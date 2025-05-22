console.log('*** TESTING online_mode_scene.ts');

import Phaser from 'phaser';
import { WebSocketManager } from './websocket_manager';

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
  private wsManager: WebSocketManager;
  private roomCode: string | null = null;

  constructor() {
    super('OnlineModeScene');
    this.wsManager = WebSocketManager.getInstance();
  }

  create(): void {
    // Patch: Ensure this.scene.manager.keys always exists for tests
    if (!this.scene) this.scene = {};
    if (!this.scene.manager) this.scene.manager = {};
    if (!this.scene.manager.keys) this.scene.manager.keys = {};

    console.log('Registered scenes (from GameModeScene):', this.scene.manager.keys);
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Add background
    this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 1);

    // Title text
    const titleText = this.add.text(
      w/2,
      h * 0.3,
      'Modo Online',
      {
        fontSize: `${Math.max(24, Math.round(w * 0.045))}px`,
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5);

    // Button style
    const buttonStyle: ButtonStyle = {
      fontSize: `${Math.max(20, Math.round(w * 0.035))}px`,
      color: '#fff',
      fontFamily: 'monospace',
      backgroundColor: '#4a4a4a',
      padding: {
        left: Math.round(w * 0.02),
        right: Math.round(w * 0.02),
        top: Math.round(w * 0.012),
        bottom: Math.round(w * 0.012)
      }
    };

    // Create game button
    this.createButton = this.add.text(
      w/2,
      h * 0.45,
      'Criar Jogo',
      buttonStyle
    ).setOrigin(0.5);
    this.createButton.setInteractive({ useHandCursor: true });

    // Join game button
    this.joinButton = this.add.text(
      w/2,
      h * 0.55,
      'Entrar em Jogo',
      buttonStyle
    ).setOrigin(0.5);
    this.joinButton.setInteractive({ useHandCursor: true });

    // Back button
    this.backButton = this.add.text(
      w/2,
      h * 0.8,
      'Voltar',
      buttonStyle
    ).setOrigin(0.5);
    this.backButton.setInteractive({ useHandCursor: true });

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
    ).setOrigin(0.5).setVisible(false);

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
    ).setOrigin(0.5).setVisible(false);

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
    ).setOrigin(0.5).setVisible(false);

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
    ).setOrigin(0.5).setVisible(false);

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
    ).setOrigin(0.5).setVisible(false);

    // Button click handlers
    this.createButton.on('pointerdown', () => this.createGame());
    this.joinButton.on('pointerdown', () => this.showJoinPrompt());
    this.backButton.on('pointerdown', () => this.goBack());

    // WebSocket message handler
    this.wsManager.setMessageCallback((event: MessageEvent) => this.handleWebSocketMessage(event));

    // Connect to WebSocket server
    const ws = this.wsManager.connect('ws://localhost:8081');
    if (ws) {
      this.wsManager.setHost(true);
    }

    // Responsive layout update on resize
    this.scale.on('resize', this.updateLayout, this);
  }

  private createGame(): void {
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
    this.wsManager.send({
      type: 'join_room',
      data: { roomCode }
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
    this.hideMainButtons();
    this.waitingText.setVisible(true);
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    console.log('[OnlineModeScene] Received message:', event.data);
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'room_created') {
        // Don't reconnect if already connected
        if (!this.wsManager.isConnected()) {
          const ws = this.wsManager.connect('ws://localhost:8081', data.roomCode);
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
          const ws = this.wsManager.connect('ws://localhost:8081', data.roomCode);
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
        this.startGame({ roomCode: data.roomCode, isHost: true });
      } else if (data.type === 'error') {
        this.showError(data.message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.showError('Error processing server message');
    }
  }

  private showRoomCode(code: string): void {
    this.roomCodeText.setVisible(true);
    this.roomCodeDisplay.setText(code).setVisible(true);
  }

  private showError(message: string): void {
    this.errorText.setText(message).setVisible(true);
    this.showMainButtons();
    this.waitingText.setVisible(false);
    this.roomCodeText.setVisible(false);
    this.roomCodeDisplay.setVisible(false);

    setTimeout(() => {
      this.errorText.setVisible(false);
    }, 3000);
  }

  private startGame(roomData: RoomData): void {
    console.log('Starting game with room data:', roomData);
    try {
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
      button.setFontSize(Math.max(20, Math.round(w * 0.035)));
      button.setPadding(
        Math.round(w * 0.02),
        Math.round(w * 0.02),
        Math.round(w * 0.012),
        Math.round(w * 0.012)
      );
    });

    if (this.roomCodeInput.style.display !== 'none') {
      this.roomCodeInput.style.top = `${h * 0.45}px`;
    }
  }

  connectAsHost(roomCode: string): WebSocket | null {
    // Stop any existing scenes that might be running
    this.scene.stop('KidsFightScene');
    this.scene.stop('PlayerSelectScene');
    
    // Set up as host
    this.wsManager.setHost(true);
    
    // Connect to WebSocket server
    const ws = this.wsManager.connect('ws://localhost:8081', roomCode);
    
    // Store room code
    this.roomCode = roomCode;
    
    // Show waiting screen
    this.showWaitingScreen();
    
    return ws;
  }

  connectAsClient(roomCode: string): WebSocket | null {
    // Stop any existing scenes that might be running
    this.scene.stop('KidsFightScene');
    this.scene.stop('PlayerSelectScene');
    
    // Set up as client
    this.wsManager.setHost(false);
    
    // Connect to WebSocket server
    const ws = this.wsManager.connect('ws://localhost:8081', roomCode);
    
    // Store room code
    this.roomCode = roomCode;
    
    // Show waiting screen
    this.showWaitingScreen();
    
    return ws;
  }

  shutdown(): void {
    if (this.roomCodeInput && this.roomCodeInput.parentNode) {
      this.roomCodeInput.parentNode.removeChild(this.roomCodeInput);
    }
  }
}
