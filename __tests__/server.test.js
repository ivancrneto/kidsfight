/**
 * @jest-environment node
 */
const WebSocket = require('ws');
const { spawn } = require('child_process');

const SERVER_URL = 'ws://localhost:18081';
let serverProcess;

// Utility to start the server before tests
beforeAll((done) => {
  serverProcess = spawn('node', ['server.js'], { cwd: __dirname + '/../server' });
  serverProcess.stdout.on('data', (data) => {
    if (data.toString().includes('WebSocket server running')) done();
  });
  serverProcess.stderr.on('data', (data) => {
    // Fail fast on server error
    throw new Error(data.toString());
  });
});

afterAll(() => {
  if (serverProcess) serverProcess.kill();
});

describe('WebSocket Server', () => {
  it('should create a room and respond with room code', (done) => {
    const ws = new WebSocket(SERVER_URL);
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'create_room' }));
    });
    ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      expect(data.type).toBe('room_created');
      expect(data.roomCode).toBeDefined();
      ws.close();
      done();
    });
  });

  it('should allow a client to join an existing room', (done) => {
    const wsHost = new WebSocket(SERVER_URL);
    wsHost.on('open', () => {
      wsHost.send(JSON.stringify({ type: 'create_room' }));
    });
    wsHost.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (data.type === 'room_created') {
        const roomCode = data.roomCode;
        const wsClient = new WebSocket(SERVER_URL);
        wsClient.on('open', () => {
          wsClient.send(JSON.stringify({ type: 'join_room', roomCode }));
        });
        let hostGotPlayerJoined = false;
        let clientGotGameJoined = false;
        wsHost.on('message', (hostMsg) => {
          const hostData = JSON.parse(hostMsg);
          if (hostData.type === 'player_joined') {
            expect(hostData.roomCode).toBe(roomCode);
            hostGotPlayerJoined = true;
            if (clientGotGameJoined) {
              wsHost.close();
              wsClient.close();
              done();
            }
          }
        });
        wsClient.on('message', (clientMsg) => {
          const clientData = JSON.parse(clientMsg);
          if (clientData.type === 'game_joined') {
            expect(clientData.roomCode).toBe(roomCode);
            clientGotGameJoined = true;
            if (hostGotPlayerJoined) {
              wsHost.close();
              wsClient.close();
              done();
            }
          }
        });
      }
    });
  });

  it('should not join a non-existent room', (done) => {
    const ws = new WebSocket(SERVER_URL);
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'join_room', roomCode: 'FAKE' }));
    });
    ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      expect(data.type).toBe('error');
      expect(data.message).toMatch(/not found/i);
      ws.close();
      done();
    });
  });

  it('should not join a full room', (done) => {
    const wsHost = new WebSocket(SERVER_URL);
    wsHost.on('open', () => {
      wsHost.send(JSON.stringify({ type: 'create_room' }));
    });
    wsHost.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (data.type === 'room_created') {
        const roomCode = data.roomCode;
        const wsClient1 = new WebSocket(SERVER_URL);
        wsClient1.on('open', () => {
          wsClient1.send(JSON.stringify({ type: 'join_room', roomCode }));
        });
        let client1Joined = false;
        wsClient1.on('message', (clientMsg) => {
          const clientData = JSON.parse(clientMsg);
          if (clientData.type === 'game_joined') {
            client1Joined = true;
            // Try a third client
            const wsClient2 = new WebSocket(SERVER_URL);
            wsClient2.on('open', () => {
              wsClient2.send(JSON.stringify({ type: 'join_room', roomCode }));
            });
            wsClient2.on('message', (msg2) => {
              const data2 = JSON.parse(msg2);
              expect(data2.type).toBe('error');
              expect(data2.message).toMatch(/full/i);
              wsHost.close();
              wsClient1.close();
              wsClient2.close();
              done();
            });
          }
        });
      }
    });
  });

  it('should forward game_action between host and client', (done) => {
    const wsHost = new WebSocket(SERVER_URL);
    wsHost.on('open', () => {
      wsHost.send(JSON.stringify({ type: 'create_room' }));
    });
    wsHost.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (data.type === 'room_created') {
        const roomCode = data.roomCode;
        const wsClient = new WebSocket(SERVER_URL);
        wsClient.on('open', () => {
          wsClient.send(JSON.stringify({ type: 'join_room', roomCode }));
        });
        let hostReady = false;
        let clientReady = false;
        wsHost.on('message', (msg2) => {
          const d2 = JSON.parse(msg2);
          if (d2.type === 'player_joined') {
            // Host sends action
            wsHost.send(JSON.stringify({ type: 'game_action', action: 'test', payload: { foo: 'bar' } }));
          } else if (d2.type === 'game_action') {
            expect(d2.action).toBe('test');
            // The server only forwards the 'action', not 'payload'
            expect(d2.payload).toBeUndefined();
            wsHost.close();
            wsClient.close();
            done();
          }
        });
        wsClient.on('message', (msg3) => {
          const d3 = JSON.parse(msg3);
          if (d3.type === 'game_joined') {
            // Client sends action
            wsClient.send(JSON.stringify({ type: 'game_action', action: 'test', payload: { foo: 'bar' } }));
          } else if (d3.type === 'game_action') {
            expect(d3.action).toBe('test');
            expect(d3.payload).toBeUndefined();
            wsHost.close();
            wsClient.close();
            done();
          }
        });
      }
    });
  });
});
