import { WebSocketManager } from '../websocket_manager';

/**
 * Tests for auto-reconnect: an unexpected close should trigger a backoff
 * reconnect, while a manual disconnect() should not.
 */
describe('WebSocketManager auto-reconnect', () => {
  let created: any[];
  const factory = () => {
    const ws: any = {
      url: '',
      readyState: 1,
      send: jest.fn(),
      close: jest.fn(),
      _listeners: {} as Record<string, Function[]>,
      addEventListener(type: string, fn: Function) {
        (this._listeners[type] = this._listeners[type] || []).push(fn);
      },
      removeEventListener(type: string, fn: Function) {
        this._listeners[type] = (this._listeners[type] || []).filter((l: Function) => l !== fn);
      },
      onopen: null as any,
      onclose: null as any,
      onerror: null as any,
      _trigger(type: string, data?: any) {
        if (type === 'open' && this.onopen) this.onopen({ type: 'open' });
        if (type === 'close' && this.onclose) this.onclose({ type: 'close' });
        (this._listeners[type] || []).forEach((l: Function) => l(data));
      },
    };
    created.push(ws);
    return ws;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    created = [];
    WebSocketManager.resetInstance();
  });

  afterEach(() => {
    WebSocketManager.resetInstance();
    jest.useRealTimers();
  });

  it('reconnects after an unexpected close', async () => {
    const mgr = WebSocketManager.getInstance(factory as any);
    const p = mgr.connect('ws://test');
    created[0]._trigger('open');
    await p;
    expect(created.length).toBe(1);
    expect(mgr.isConnected()).toBe(true);

    // Simulate the server dropping the connection.
    created[0]._trigger('close');
    expect(mgr.isConnected()).toBe(false);

    // Backoff is 1000ms for the first attempt.
    jest.advanceTimersByTime(1000);
    expect(created.length).toBe(2); // a new socket was created

    created[1]._trigger('open');
    expect(mgr.isConnected()).toBe(true);
  });

  it('does not reconnect after a manual disconnect', async () => {
    const mgr = WebSocketManager.getInstance(factory as any);
    const p = mgr.connect('ws://test');
    created[0]._trigger('open');
    await p;

    mgr.disconnect();
    created[0]._trigger('close');

    jest.advanceTimersByTime(20000);
    expect(created.length).toBe(1); // no reconnect
  });
});
