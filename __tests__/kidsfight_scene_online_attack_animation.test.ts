import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene Online Attack Animation', () => {
  let scene: any;
  let hostScene: any;
  let guestScene: any;
  let player0: any;
  let player1: any;

  beforeEach(() => {
    // Mock player objects
    const createMockPlayer = () => ({
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setPosition: jest.fn(),
      body: { reset: jest.fn() },
      setData: jest.fn(),
      getData: jest.fn().mockReturnValue(false),
      setFrame: jest.fn(),
      x: 0,
      y: 0,
      health: 100,
      isAttacking: false
    });

    player0 = createMockPlayer();
    player1 = createMockPlayer();

    // Set up host scene
    hostScene = new KidsFightScene();
    hostScene.players = [player0, player1];
    hostScene.isHost = true;
    hostScene.localPlayerIndex = 0; // Host controls player 0 (left)
    hostScene.gameMode = 'online';
    hostScene.playerHealth = [100, 100];
    hostScene.playerSpecial = [0, 0];
    hostScene.playerBlocking = [false, false];
    hostScene.updateSpecialPips = jest.fn();
    hostScene.updateHealthBar = jest.fn();
    hostScene.gameOver = false;

    // Set up guest scene 
    guestScene = new KidsFightScene();
    guestScene.players = [player0, player1];
    guestScene.isHost = false;
    guestScene.localPlayerIndex = 1; // Guest controls player 1 (right)
    guestScene.gameMode = 'online';
    guestScene.playerHealth = [100, 100];
    guestScene.playerSpecial = [0, 0];
    guestScene.playerBlocking = [false, false];
    guestScene.updateSpecialPips = jest.fn();
    guestScene.updateHealthBar = jest.fn();
    guestScene.gameOver = false;
  });

  it('guest attack should set animation on player 1 (right player) on host', () => {
    // Clear any previous calls
    player0.setData.mockClear();
    player1.setData.mockClear();

    // Guest attacks - sends message with their playerIndex (1)
    const attackMessage = { type: 'attack', playerIndex: 1, now: Date.now() };
    
    // Host receives the guest's attack message
    hostScene.handleRemoteAction(attackMessage);

    // On the host, player 1 (right side, guest's character) should show attack animation
    expect(player1.setData).toHaveBeenCalledWith('isAttacking', true);
    // Player 0 (left side, host's character) should NOT show attack animation
    expect(player0.setData).not.toHaveBeenCalledWith('isAttacking', true);
  });

  it('host attack should set animation on player 0 (left player) on guest', () => {
    // Clear any previous calls
    player0.setData.mockClear();
    player1.setData.mockClear();

    // Host attacks - sends message with their playerIndex (0)
    const attackMessage = { type: 'attack', playerIndex: 0, now: Date.now() };
    
    // Guest receives the host's attack message
    guestScene.handleRemoteAction(attackMessage);

    // On the guest, player 0 (left side, host's character) should show attack animation
    expect(player0.setData).toHaveBeenCalledWith('isAttacking', true);
    // Player 1 (right side, guest's character) should NOT show attack animation
    expect(player1.setData).not.toHaveBeenCalledWith('isAttacking', true);
  });

  it('verifies player positioning matches expectations', () => {
    // This test verifies our understanding of the player layout
    // Player 0 should be on the left (host's character)
    // Player 1 should be on the right (guest's character)
    
    expect(hostScene.localPlayerIndex).toBe(0); // Host controls left player
    expect(guestScene.localPlayerIndex).toBe(1); // Guest controls right player
    expect(hostScene.isHost).toBe(true);
    expect(guestScene.isHost).toBe(false);
  });
});