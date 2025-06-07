import PlayerSelectScene from '../player_select_scene';

describe('PlayerSelectScene Ready Button UI', () => {
  let scene: PlayerSelectScene;
  let mockButton: any;
  let mockBackButton: any;

  beforeEach(() => {
    mockButton = {
      setText: jest.fn().mockReturnThis(),
      setBackgroundColor: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      disableInteractive: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      displayWidth: 100,
      displayHeight: 40,
      x: 0,
      y: 0
    };
    mockBackButton = {
      setText: jest.fn().mockReturnThis(),
      setBackgroundColor: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      displayWidth: 100,
      displayHeight: 40,
      x: 0,
      y: 0
    };
    scene = new PlayerSelectScene();
    scene.add = {
      text: jest.fn()
        .mockReturnValueOnce(mockButton)
        .mockReturnValueOnce(mockBackButton),
    } as any;
    scene.cameras = { main: { width: 800, height: 600 } } as any;
    scene.scale = { on: jest.fn(), width: 800, height: 600 } as any;
    scene.scene = { start: jest.fn(), get: jest.fn() } as any;
    scene.isHost = true;
    scene.player1Ready = false;
    scene.player2Ready = false;
  });

  it('creates ready button with correct default style', () => {
    scene.createUIButtons();
    expect(scene.add.text).toHaveBeenCalledWith(
      0, 0, 'COMEÇAR',
      expect.objectContaining({
        fontSize: '24px',
        color: '#fff',
        fontFamily: 'monospace',
        backgroundColor: '#00AA00',
        padding: { x: 20, y: 10 }
      })
    );
  });

  it('updateReadyButton sets COMEÇAR state (green, enabled)', () => {
    scene.readyButton = mockButton;
    scene.isHost = true;
    scene.player1Ready = false;
    scene.updateReadyButton();
    expect(mockButton.setText).toHaveBeenCalledWith('COMEÇAR');
    expect(mockButton.setBackgroundColor).toHaveBeenCalledWith('#00AA00');
    expect(mockButton.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });
  });

  it('updateReadyButton sets CANCELAR state (red, disabled)', () => {
    scene.readyButton = mockButton;
    scene.isHost = true;
    scene.player1Ready = true;
    scene.updateReadyButton();
    expect(mockButton.setText).toHaveBeenCalledWith('CANCELAR');
    expect(mockButton.setBackgroundColor).toHaveBeenCalledWith('#AA0000');
    expect(mockButton.disableInteractive).toHaveBeenCalled();
  });

  it('does not use a rectangle for the button background', () => {
    scene.add.rectangle = jest.fn();
    scene.createUIButtons();
    expect(scene.add.rectangle).not.toHaveBeenCalled();
  });
});
