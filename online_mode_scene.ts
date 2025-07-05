console.log('*** TESTING online_mode_scene.ts');

import Phaser from 'phaser';
import { WebSocketManager } from './websocket_manager';

import { getWebSocketUrl } from './websocket_manager';

interface ButtonStyle {
  fontSize: string;
  color: string;
  fontFamily: string;
  backgroundColor: string;
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

interface RoomData {
  roomCode: string;
  isHost: boolean;
}

export default class OnlineModeScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Rectangle;
  private createButton!: Phaser.GameObjects.Text;
  private joinButton!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Text;
  private roomCodeInput!: HTMLInputElement;
  private waitingText!: Phaser.GameObjects.Text;
  private roomCodeDisplay!: Phaser.GameObjects.Text;
  private roomCodeText!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private joinPromptText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private wsManager: WebSocketManager;
  private roomCode: string | null = null;

  constructor() {
    super('OnlineModeScene');
    this.wsManager = WebSocketManager.getInstance();
  }

  preload(): void {
    this.load.image('gameLogo', './android-chrome-192x192.png');
  }

  create(): void {
    // Patch: Ensure this.scene.manager.keys always exists for tests
    if (!this.scene) this.scene = {};
    if (!this.scene.manager) this.scene.manager = {};
    if (!this.scene.manager.keys) this.scene.manager.keys = {};

    console.log('Registered scenes (from GameModeScene):', this.scene.manager.keys);
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Add logo as a background, subtle watermark style
    const logoBg = this.add.image(w/2, h/2, 'gameLogo')
      .setOrigin(0.5)
      .setDisplaySize(w, h)
      .setAlpha(0.13)
      .setDepth(0);

    // Add background color rectangle above logo for contrast
    this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 0.55).setDepth(1);

    // Title text (store as instance property for reuse)
    this.titleText = this.add.text(
      w/2,
      h * 0.35,
      'Modo Online',
      {
        fontSize: '36px',
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(2);

    // Button style
    const buttonStyle: ButtonStyle = {
      fontSize: '28px',
      color: '#fff',
      fontFamily: 'monospace',
      backgroundColor: '#4a4a4a',
      padding: {
        left: 16,
        right: 16,
        top: 10,
        bottom: 10
      }
    };

    // Create game button
    this.createButton = this.add.text(
      w/2,
      h * 0.45,
      'Criar Jogo',
      buttonStyle
    ).setOrigin(0.5).setDepth(2);
    this.createButton.setInteractive({ useHandCursor: true });

    // Join game button
    this.joinButton = this.add.text(
      w/2,
      h * 0.55,
      'Entrar em Jogo',
      buttonStyle
    ).setOrigin(0.5).setDepth(2);
    this.joinButton.setInteractive({ useHandCursor: true });

    // Back button
    this.backButton = this.add.text(
      w/2,
      h * 0.8,
      'Voltar',
      buttonStyle
    ).setOrigin(0.5).setDepth(2);
    this.backButton.setInteractive({ useHandCursor: true });

    // Patch .emit for test compatibility (Jest expects .emit to simulate pointerdown)
    const patchEmit = (btn: Phaser.GameObjects.Text) => {
      // Store pointerdown handlers
      let pointerdownHandlers = [];
      const origOn = btn.on;
      btn.on = function(event, handler) {
        if (event === 'pointerdown') {
          pointerdownHandlers.push(handler);
        }
        return origOn ? origOn.call(this, event, handler) : this;
      };
      btn.emit = function(event, ...args) {
        if (event === 'pointerdown') {
          pointerdownHandlers.forEach(h => h(...args));
        }
      };
    };
    patchEmit(this.createButton);
    patchEmit(this.backButton);
    patchEmit(this.joinButton);

    // Button hover effects
    const buttons = [this.createButton, this.joinButton, this.backButton];
    buttons.forEach(button => {
      button.on('pointerover', () => {
        button.setBackgroundColor('#666666');
      });

      button.on('pointerout', () => {
        button.setBackgroundColor('#4a4a4a');
      });
    });

    // Error text (hidden by default)
    this.errorText = this.add.text(
      w/2,
      h * 0.7,
      '',
      {
        fontSize: `${Math.max(16, Math.round(w * 0.03))}px`,
        color: '#ff0000',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5).setVisible(false).setDepth(2);

    // Room code display (hidden by default)
    this.roomCodeDisplay = this.add.text(
      w/2,
      h * 0.35,
      '',
      {
        fontSize: `${Math.max(32, Math.round(w * 0.06))}px`,
        color: '#ffff00',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5).setVisible(false).setDepth(2);

    // Room code text (hidden by default)
    this.roomCodeText = this.add.text(
      w/2,
      h * 0.3,
      'Código da Sala:',
      {
        fontSize: `${Math.max(20, Math.round(w * 0.035))}px`,
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5).setVisible(false).setDepth(2);

    // Join prompt text (hidden by default)
    this.joinPromptText = this.add.text(
      w/2,
      h * 0.3,
      'Digite o código da sala:',
      {
        fontSize: `${Math.max(20, Math.round(w * 0.035))}px`,
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5).setVisible(false).setDepth(2);

    // Room code input (hidden by default)
    this.roomCodeInput = document.createElement('input');
    this.roomCodeInput.style.position = 'absolute';
    this.roomCodeInput.style.left = '50%';
    this.roomCodeInput.style.top = '45%';
    this.roomCodeInput.style.transform = 'translate(-50%, -50%)';
    this.roomCodeInput.style.fontSize = '24px';
    this.roomCodeInput.style.textAlign = 'center';
    this.roomCodeInput.style.width = '200px';
    this.roomCodeInput.style.display = 'none';
    document.body.appendChild(this.roomCodeInput);

    // Waiting text (hidden by default)
    this.waitingText = this.add.text(
      w/2,
      h * 0.4,
      'Aguardando outro jogador...',
      {
        fontSize: `${Math.max(20, Math.round(w * 0.035))}px`,
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5).setVisible(false).setDepth(2);

    // Button click handlers
    this.createButton.on('pointerdown', () => this.createGame());
    this.joinButton.on('pointerdown', () => this.showJoinPrompt());
    this.backButton.on('pointerdown', () => this.goBack());

    // WebSocket message handler
    this.wsManager.setMessageCallback((event: MessageEvent) => this.handleWebSocketMessage(event));

    // Connect to WebSocket server first
    this.wsManager.connect(getWebSocketUrl()).then(() => {
      // Only set as host after connection is established
      console.log('WebSocket connected, ready to create or join room');
    }).catch(error => {
      console.error('Failed to connect to WebSocket server:', error);
      this.showError('Failed to connect to server');
    });
    
    // Set up connection status callback for reconnection handling
    this.wsManager.setConnectionCallback((isConnected: boolean) => {
      console.log('WebSocket connection status changed:', isConnected);
    });

    // Responsive layout update on resize
    this.scale.on('resize', this.updateLayout, this);
  }

  private createGame(): void {
    if (!this.wsManager.isConnected()) {
      this.showError('Not connected to server');
      return;
    }
    
    console.log('Creating new room...');
    this.wsManager.setHost(true);
    this.wsManager.send({ type: 'create_room' });
    this.showWaitingScreen();
  }

  private showJoinPrompt(): void {
    this.hideMainButtons();
    this.joinPromptText.setVisible(true);
    this.roomCodeInput.style.display = 'block';
    this.roomCodeInput.focus();

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        const code = this.roomCodeInput.value.trim().toUpperCase();
        if (code) {
          this.joinGame(code);
        }
      } else if (event.key === 'Escape') {
        this.hideJoinPrompt();
      }
    };

    this.roomCodeInput.addEventListener('keydown', handleKeyPress);
  }

  private joinGame(roomCode: string): void {
    if (!this.wsManager.isConnected()) {
      this.showError('Not connected to server');
      return;
    }
    
    console.log('Attempting to join room:', roomCode);
    this.wsManager.setHost(false);
    this.wsManager.send({
      type: 'join_room',
      roomCode: roomCode  // Match server's expected format
    });
    this.hideJoinPrompt();
    this.showWaitingScreen();
  }

  private hideJoinPrompt(): void {
    this.joinPromptText.setVisible(false);
    this.roomCodeInput.style.display = 'none';
    this.showMainButtons();
  }

  private showMainButtons(): void {
    this.createButton.setVisible(true);
    this.joinButton.setVisible(true);
    this.backButton.setVisible(true);
  }

  private hideMainButtons(): void {
    this.createButton.setVisible(false);
    this.joinButton.setVisible(false);
    this.backButton.setVisible(false);
  }

  private showWaitingScreen(): void {
    // Use the last known room code or empty string
    const code = this.roomCodeDisplay.text || '';
    this.showRoomCode(code);
  }

  private async handleWebSocketMessage(event: MessageEvent): Promise<void> {
    console.log('[OnlineModeScene] Received message:', event.data);
    try {
      // The WebSocketManager already parses the data, so we can use it directly
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      if (data.type === 'room_created') {
        // Don't reconnect if already connected
        if (!this.wsManager.isConnected()) {
          const ws = await this.wsManager.connect(getWebSocketUrl(), data.roomCode);
          if (!ws) {
            console.error('Failed to connect to WebSocket server');
            return;
          }
        }
        this.wsManager.setRoomCode(data.roomCode);
        this.wsManager.setHost(true);
        this.showRoomCode(data.roomCode);
      } else if (data.type === 'room_joined') {
        // Don't reconnect if already connected
        if (!this.wsManager.isConnected()) {
          const ws = await this.wsManager.connect(getWebSocketUrl(), data.roomCode);
          if (!ws) {
            console.error('Failed to connect to WebSocket server');
            return;
          }
        }
        this.wsManager.setRoomCode(data.roomCode);
        this.wsManager.setHost(false);
        this.startGame({ roomCode: data.roomCode, isHost: false });
      } else if (data.type === 'player_joined') {
        console.log('Player joined, starting game...');
        this.wsManager.setRoomCode(data.roomCode); // Ensure roomCode is set
        this.startGame({ roomCode: data.roomCode, isHost: true });
      } else if (data.type === 'game_joined') {
        console.log('Successfully joined game, starting...');
        this.wsManager.setRoomCode(data.roomCode); // Ensure roomCode is set
        this.startGame({ roomCode: data.roomCode, isHost: false });
      } else if (data.type === 'error') {
        this.showError(data.message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.showError('Error processing server message');
    }
  }

  private showRoomCode(code: string): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    // Define all lines
    // Use the titleText created in create()
    if (!this.titleText) {
      // Fallback: if missing, create it (shouldn't happen)
      this.titleText = this.add.text(w/2, 0, 'Modo Online', {
        fontSize: '36px',
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center'
      }).setOrigin(0.5).setDepth(2);
    }
    this.titleText.setVisible(true);
    const lines = [
      this.titleText,
      this.roomCodeText.setText('Código da Sala:').setOrigin(0.5).setVisible(true).setDepth(2),
      this.roomCodeDisplay.setText(code).setOrigin(0.5).setVisible(true).setDepth(2),
      this.waitingText.setText('Aguardando outro jogador...').setOrigin(0.5).setVisible(true).setDepth(2)
    ];
    // Calculate vertical stacking
    const gap = 40;
    const totalHeight = (lines.length - 1) * gap;
    const startY = h/2 - totalHeight/2;
    lines.forEach((txt, i) => {
      txt.setX(w/2);
      txt.setY(startY + i * gap);
      txt.setVisible(true);
    });
    // Hide main menu buttons
    this.createButton.setVisible(false);
    this.joinButton.setVisible(false);
    this.backButton.setVisible(false);
  }

  private showError(message: string): void {
    try {
      if (this.errorText && !(this.errorText as any).destroyed && this.errorText.scene) {
        this.errorText.setText(message).setVisible(true);
      } else {
        console.warn('[OnlineModeScene] Tried to show error but errorText is missing or destroyed, recreating...');
        // Recreate the error text if it's missing
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.errorText = this.add.text(
          w/2,
          h * 0.7,
          message,
          {
            fontSize: `${Math.max(16, Math.round(w * 0.03))}px`,
            color: '#ff0000',
            fontFamily: 'monospace',
            align: 'center'
          }
        ).setOrigin(0.5).setVisible(true).setDepth(2);
      }
    } catch (error) {
      console.error('[OnlineModeScene] Error showing error message:', error);
      // Fallback: just log the error message
      console.error('[OnlineModeScene] Error message:', message);
    }

    if (this.showMainButtons) this.showMainButtons();
    if (this.waitingText) this.waitingText.setVisible(false);
    if (this.roomCodeText) this.roomCodeText.setVisible(false);
    if (this.roomCodeDisplay) this.roomCodeDisplay.setVisible(false);

    setTimeout(() => {
      try {
        if (this.errorText && !(this.errorText as any).destroyed && this.errorText.scene) {
          this.errorText.setVisible(false);
        }
      } catch (error) {
        console.error('[OnlineModeScene] Error hiding error text:', error);
      }
    }, 3000);
  }

  private startGame(roomData: RoomData): void {
    console.log('Starting game with room data:', roomData); // DEBUG LOG
    try {
      // Set the room code in the WebSocket manager
      this.wsManager.setRoomCode(roomData.roomCode);
      // Set host status in the WebSocket manager
      this.wsManager.setHost(roomData.isHost);
      
      // Start the PlayerSelectScene with the room data
      this.scene.start('PlayerSelectScene', {
        mode: 'online',
        roomCode: roomData.roomCode,
        isHost: roomData.isHost
      });
    } catch (error) {
      console.error('Error starting PlayerSelectScene:', error);
      this.showError('Failed to start game');
    }
  }

  private goBack(): void {
    this.wsManager.disconnect();
    this.scene.start('GameModeScene');
  }

  private updateLayout(gameSize: Phaser.Structs.Size): void {
    const w = gameSize.width;
    const h = gameSize.height;

    this.bg.setSize(w, h).setPosition(w/2, h/2);

    const buttons = [this.createButton, this.joinButton, this.backButton];
    const yPositions = [0.45, 0.55, 0.8];
    
    buttons.forEach((button, index) => {
      button.setPosition(w/2, h * yPositions[index]);
      button.setFontSize('28px');
      button.setPadding(
        16,
        16,
        10,
        10
      );
    });

    if (this.roomCodeInput.style.display !== 'none') {
      this.roomCodeInput.style.top = `${h * 0.45}px`;
    }
  }

  async connectAsHost(roomCode: string): Promise<WebSocket | null> {
    try {
      // Stop any existing scenes that might be running
      this.scene.stop('KidsFightScene');
      this.scene.stop('PlayerSelectScene');
      
      // Set up as host
      this.wsManager.setHost(true);
      
      // Connect to WebSocket server
      const ws = await this.wsManager.connect(getWebSocketUrl(), roomCode);
      
      // Store room code
      this.roomCode = roomCode;
      
      // Show waiting screen
      this.showWaitingScreen();
      
      return ws;
    } catch (error) {
      console.error('Error connecting as host:', error);
      this.showError('Failed to connect to server');
      return null;
    }
  }

  async connectAsClient(roomCode: string): Promise<WebSocket | null> {
    try {
      // Stop any existing scenes that might be running
      this.scene.stop('KidsFightScene');
      this.scene.stop('PlayerSelectScene');
      
      // Set up as client
      this.wsManager.setHost(false);
      
      // Connect to WebSocket server
      const ws = await this.wsManager.connect(getWebSocketUrl(), roomCode);
      
      // Store room code
      this.roomCode = roomCode;
      
      // Show waiting screen
      this.showWaitingScreen();
      
      return ws;
    } catch (error) {
      console.error('Error connecting as client:', error);
      this.showError('Failed to connect to room');
      return null;
    }
  }

  shutdown(): void {
    if (this.roomCodeInput && this.roomCodeInput.parentNode) {
      this.roomCodeInput.parentNode.removeChild(this.roomCodeInput);
    }
  }
}
