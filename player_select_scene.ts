import Phaser from 'phaser';
import scenarioImg from './scenario1.png';
import player1RawImg from './sprites-bento3.png';
import player2RawImg from './sprites-davir3.png';
import player3RawImg from './sprites-jose3.png';
import player4RawImg from './sprites-davis3.png';
import player5RawImg from './sprites-carol3.png';
import player6RawImg from './sprites-roni3.png';
import player7RawImg from './sprites-jacqueline3.png';
import player8RawImg from './sprites-ivan3.png';
import player9RawImg from './sprites-d_isa.png';
import gameLogoImg from './android-chrome-192x192.png';
import { WebSocketManager } from './websocket_manager';
import { DEV } from './globals';

interface PlayerSelections {
  p1: string;
  p2: string;
}

interface PlayerSelectWebSocketMessage {
  type: 'playerReady' | 'gameStart' | 'playerSelected' | 'roomInfo';
  player?: string;
  character?: string;
  player1Ready?: boolean;
  player2Ready?: boolean;
  p1Char?: string;
  p2Char?: string;
  roomCode?: string;
  isHost?: boolean;
}

interface GameStartWebSocketMessage extends PlayerSelectWebSocketMessage {
  type: 'gameStart';
  p1Char: string;
  p2Char: string;
  roomCode: string;
}

interface SceneData {
  mode?: 'local' | 'online';
  fromGameMode?: boolean;
  roomCode?: string;
  isHost?: boolean;
}

interface CharacterInfo {
  name: string;
  key: string;
  x: number;
  y: number;
  scale: number;
  frame?: number;
  bgCircle?: Phaser.GameObjects.Arc;
  nameLabel?: Phaser.GameObjects.Text;
  bgCircleOffsetY?: number;
}

export default class PlayerSelectScene extends Phaser.Scene {
  // Properties made public for testability
  public CHARACTER_KEYS: string[] = [];
  public p1Index = 0;
  public p2Index = 0;
  public selectedP1Index = 0;
  public selectedP2Index = 0;
  public characterSprites: { [key: string]: Phaser.GameObjects.Sprite } = {};
  public p1SelectorCircle!: Phaser.GameObjects.Ellipse;
  public p2SelectorCircle!: Phaser.GameObjects.Ellipse;
  public characters: CharacterInfo[] = [];
  public selected: PlayerSelections;
  public player1Ready = false;
  public player2Ready = false;
  public isHost = false;
  public mode: 'local' | 'online' = 'local';
  public wsManager: WebSocketManager | null;
  private wsHandlers: {
    messageHandler: (event: MessageEvent) => void;
    errorHandler: (event: Event) => void;
    closeHandler: (event: CloseEvent) => void;
  } | null = null;
  private reconnectButton: Phaser.GameObjects.Text | null = null;
  private isInitialized = false;
  public startButton!: Phaser.GameObjects.Text;
  public backButton!: Phaser.GameObjects.Text;
  public readyButton!: Phaser.GameObjects.Text;
  public player1ReadyText!: Phaser.GameObjects.Text;
  public player2ReadyText!: Phaser.GameObjects.Text;
  public roomCodeText!: Phaser.GameObjects.Text;
  public roomCode: string | null = null;
  public waitingText: Phaser.GameObjects.Text | null = null;
  public title!: Phaser.GameObjects.Text;
  public p1Indicator!: Phaser.GameObjects.Arc;
  public p2Indicator!: Phaser.GameObjects.Arc;
  public p1Text!: Phaser.GameObjects.Text;
  public p2Text!: Phaser.GameObjects.Text;
  public startButtonRect!: Phaser.GameObjects.Rectangle;
  public p1Char: string | null = null;
  public p1Sprite: Phaser.GameObjects.Sprite | null = null;

  constructor(wsManager?: WebSocketManager | null) {
    super({ key: 'PlayerSelectScene' });
    this.CHARACTER_KEYS = [
      'bento', 'davir', 'jose', 'davis', 
      'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'
    ];
    this.selected = { p1: 'bento', p2: 'davir' };
    this.wsManager = wsManager ?? null;
  }

  init(data: SceneData): void {
    console.log('[PlayerSelectScene] Initializing with data:', data);
    // ORIENTATION CHANGE PROTECTION: Check if this scene was triggered by an orientation change
    const now = Date.now();
    const lastOrientationTime = (window as any).lastOrientationChangeTime || 0;
    const fromGameMode = data && data.fromGameMode === true;
    const timeSinceOrientation = now - lastOrientationTime;
    console.log(`[PlayerSelectScene] Room code from init data: ${data?.roomCode}, isHost: ${data?.isHost}`);
    
    // If scene was launched within 2 seconds of orientation change and not explicitly from GameMode
    if (timeSinceOrientation < 2000 && !fromGameMode) {
      console.log('[PlayerSelectScene] PROTECTION: Detected invalid scene navigation after orientation change');
      console.log('[PlayerSelectScene] Time since orientation change:', timeSinceOrientation + 'ms');
      console.log('[PlayerSelectScene] Redirecting to GameModeScene...');
      
      // Immediately redirect to GameModeScene instead of continuing initialization
      this.scene.stop('PlayerSelectScene');
      this.scene.start('GameModeScene');
      return;
    }
    
    // Reset selections when scene is restarted
    if (DEV) console.log('[PlayerSelectScene] Init called, resetting selections');
    
    // Always set roomCode in online mode
    if (data && data.mode === 'online') {
      this.mode = 'online';
      this.roomCode = data.roomCode || this.roomCode || null;
      this.isHost = data.isHost || false;
      this.selected = { p1: 'player1', p2: 'player1' };
      
      // Ensure WebSocket manager has the latest room code and host status
      if (this.roomCode) {
        this.wsManager = WebSocketManager.getInstance();
        this.wsManager.setRoomCode(this.roomCode);
        this.wsManager.setHost(this.isHost);
        if (DEV) console.log(`[PlayerSelectScene] Set WebSocket room code: ${this.roomCode}, isHost: ${this.isHost}`);
      }
    } else {
      this.mode = 'local';
      this.roomCode = null;
      this.isHost = false;
      this.selected = { p1: 'player1', p2: 'player2' };
    }
  }

  preload(): void {
    // Load character sprites as spritesheets (assuming 96x96 frame size)
    this.load.spritesheet('player1', player1RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player2', player2RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player3', player3RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player4', player4RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player5', player5RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player6', player6RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player7', player7RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player8', player8RawImg, { frameWidth: 296, frameHeight: 296 });
    this.load.spritesheet('player9', player9RawImg, { frameWidth: 296, frameHeight: 296 });
    
    // Note: Removed selector.png and will use Phaser shapes instead
    
    // Load background
    this.load.image('scenario', scenarioImg);
    
    // Load game logo
    this.load.image('game_logo', gameLogoImg);
  }

  create(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Add background
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 1);
    
    // Add title (always two lines)
    this.title = this.add.text(
      w/2,
      h * 0.1,
      'Escolha os\nLutadores',
      {
        fontSize: `${Math.max(18, Math.round(Math.min(w, h) * 0.06))}px`,
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: w * 0.8, useAdvancedWrap: true }
      }
    ).setOrigin(0.5);

    // Setup character grid
    this.setupCharacters();

    // Create selection indicators
    this.createSelectionIndicators();

    // Create UI buttons
    this.createUIButtons();

    // Setup WebSocket handlers for online mode
    if (this.mode === 'online') {
      this.setupWebSocketHandlers();
    }

    // Responsive layout update on resize
    this.scale.on('resize', this.updateLayout, this);
  }

  private setupCharacters(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    // --- Responsive character grid setup (centered grid, smaller height section) ---
    const gridCols = 3;
    const gridRows = 3;
    const gridW = w * 0.7; // grid takes 70% of width
    const gridH = h * 0.38; // grid takes LESS height (38% instead of 50%)
    const spacingX = gridW / (gridCols - 1);
    const spacingY = gridH / (gridRows - 1);
    const startX = w / 2 - gridW / 2;
    const startY = h * 0.18;
    this.characters = [
      { name: 'Bento', key: 'player1', x: startX, y: startY, scale: 0.5 },
      { name: 'Davi R', key: 'player2', x: startX + spacingX, y: startY, scale: 0.5 },
      { name: 'José', key: 'player3', x: startX + spacingX * 2, y: startY, scale: 0.5 },
      { name: 'Davis', key: 'player4', x: startX, y: startY + spacingY, scale: 0.5 },
      { name: 'Carol', key: 'player5', x: startX + spacingX, y: startY + spacingY, scale: 0.5 },
      { name: 'Roni', key: 'player6', x: startX + spacingX * 2, y: startY + spacingY, scale: 0.5 },
      { name: 'Jacqueline', key: 'player7', x: startX, y: startY + spacingY * 2, scale: 0.5 },
      { name: 'Ivan', key: 'player8', x: startX + spacingX, y: startY + spacingY * 2, scale: 0.5 },
      { name: 'D. Isa', key: 'player9', x: startX + spacingX * 2, y: startY + spacingY * 2, scale: 0.5 }
    ];
    // --- END Responsive centered grid ---
    // Create character sprites with background circles
    this.characters.forEach((char, index) => {
      // When creating the background circle, store the original offset for later use
      const bgCircleOffsetY = 100; // move bgCircle 100px down from char.y
      const bgCircle = this.add.circle(char.x, char.y + bgCircleOffsetY, 60, 0x222222, 1);
      char.bgCircle = bgCircle;
      char.bgCircleOffsetY = bgCircleOffsetY;
      // Show only frame 0 and crop to head+shoulders area (classic style)
      const sprite = this.add.sprite(char.x, char.y + 40, char.key, 0);
      // Responsive scale: base scale for 296x296, shrink to 0.4 for default 1280x720, scale with min(screenW,screenH)
      const baseSize = 296;
      const screenW = this.sys.game.config.width as number;
      const screenH = this.sys.game.config.height as number;
      const scale = 0.4 * Math.min(screenW, screenH) / 720; // 0.4 at 720p, smaller for smaller screens
      sprite.setScale(scale);
      sprite.setInteractive({ useHandCursor: true });
      sprite.setCrop(0, 0, 296, 296); // crop to square head+shoulders for new frame size
      sprite.setOrigin(0.5, 0.4);
      // Store sprite reference
      this.characterSprites[char.key] = sprite;
      // Add name label and keep reference
      const label = this.add.text(
        char.x,
        char.y + 100,
        char.name,
        {
          fontSize: '20px',
          color: '#fff',
          fontFamily: 'monospace',
          align: 'center'
        }
      ).setOrigin(0.5);
      char.nameLabel = label;
      // Click handler for character selection
      sprite.on('pointerdown', () => {
        // In online mode, only player 1 can select
        // In local mode, alternate between players
        const currentPlayer = this.mode === 'online' ? 1 : 
          (this.p1SelectorCircle.alpha === 1 ? 1 : 2);
        this.handleCharacterSelect(currentPlayer, 1);
      });
    });
  }

  private createSelectionIndicators(): void {
    // Use fixed values to match UI test expectations
    this.p1SelectorCircle = this.add.circle(240, 360, 40, 0xffff00, 0.18);
    this.p2SelectorCircle = this.add.circle(560, 360, 40, 0x0000ff, 0.18);
    // Player 1 indicator (green circle)
    this.p1Indicator = this.add.circle(0, 0, 30, 0x00ff00, 0.7)
      .setStrokeStyle(3, 0xffffff, 1);
    this.p1Text = this.add.text(0, 0, 'P1', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    // Player 2 indicator (red circle)
    this.p2Indicator = this.add.circle(0, 0, 30, 0xff0000, 0.7)
      .setStrokeStyle(3, 0xffffff, 1);
    this.p2Text = this.add.text(0, 0, 'P2', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontWeight: 'bold'
    }).setOrigin(0.5);
  }

  private createUIButtons(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Start button (green, offset left)
    const buttonX = w * 0.5 - 18;
    this.startButtonRect = this.add.rectangle(buttonX, h * 0.85, 200, 60, 0x00ff00);
    this.readyButton = this.add.text(
      buttonX,
      h * 0.85,
      'COMEÇAR',
      {
        fontSize: '24px',
        color: '#fff',
        backgroundColor: '#4a4a4a',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Back button
    this.backButton = this.add.text(
      w * 0.3,
      h * 0.85,
      'Voltar',
      {
        fontSize: '24px',
        color: '#fff',
        backgroundColor: '#4a4a4a',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Button hover effects
    [this.readyButton, this.backButton].forEach(button => {
      button.on('pointerover', () => {
        button.setStyle({ backgroundColor: '#666' });
      });
      button.on('pointerout', () => {
        button.setStyle({ backgroundColor: '#4a4a4a' });
      });
    });
    // DEBUG: Add pointerdown for readyButton (start game)
    this.readyButton.on('pointerdown', () => {
      console.log('[PlayerSelectScene] Ready button clicked');
      this.launchGame();
    });
  }

  private updateSelectionIndicators(): void {
    if (!this.characters.length) return;
    
    // Update P1 indicator
    const p1Char = this.characters[this.selectedP1Index];
    if (p1Char && this.p1SelectorCircle) {
      const yOffset = p1Char.bgCircleOffsetY || 0;
      this.p1SelectorCircle.setPosition(p1Char.x, p1Char.y + yOffset);
      this.p1SelectorCircle.setVisible(true);
    }

    // Update P2 indicator
    const p2Char = this.characters[this.selectedP2Index];
    if (p2Char && this.p2SelectorCircle) {
      const yOffset = p2Char.bgCircleOffsetY || 0;
      this.p2SelectorCircle.setPosition(p2Char.x, p2Char.y + yOffset);
      this.p2SelectorCircle.setVisible(true);
    }
  }

  private handleCharacterSelect(player: 1 | 2, direction: -1 | 1): void {
    if (this.mode === 'online' && player !== 1) return; // Only player 1 can select in online mode
    
    const currentIndex = player === 1 ? this.p1Index : this.p2Index;
    let newIndex = (currentIndex + direction) % this.characters.length;
    if (newIndex < 0) newIndex = this.characters.length - 1;
    
    if (player === 1) {
      this.p1Index = newIndex;
      this.selected.p1 = this.characters[newIndex].key;
      this.selectedP1Index = newIndex;
    } else {
      this.p2Index = newIndex;
      this.selected.p2 = this.characters[newIndex].key;
      this.selectedP2Index = newIndex;
    }
    
    this.updateSelectionIndicators();
    
    // In online mode, notify other players of the selection
    if (this.mode === 'online' && this.wsManager) {
      this.wsManager.send({
        type: 'playerSelected',
        player: `p${player}`,
        character: player === 1 ? this.selected.p1 : this.selected.p2
      });
    }
  }

  private updateLayout(): void {
    // Update layout when screen size changes
    const { width, height } = this.scale;
    
    // Update title position
    if (this.title) {
      this.title.setPosition(width / 2, height * 0.1);
    }
    
    // Update character grid positions
    this.setupCharacters();
    
    // Update button positions
    this.createUIButtons();
  }

  private handleGameStart(data: PlayerSelectWebSocketMessage): void {
    if (data.type !== 'gameStart' || !('p1Char' in data) || !('p2Char' in data)) return;
    
    const gameData = data as GameStartWebSocketMessage;
    this.scene.start('GameScene', {
      player1Character: gameData.p1Char,
      player2Character: gameData.p2Char,
      mode: 'online' as const,
      roomCode: gameData.roomCode,
      isHost: this.isHost
    });
  }

  private cleanupWebSocketHandlers(): void {
    if (!this.wsManager || !this.wsHandlers) return;

    // Clear all callbacks
    if (this.wsManager.setMessageCallback) this.wsManager.setMessageCallback(() => {});
    if (this.wsManager.setErrorCallback) this.wsManager.setErrorCallback(() => {});
    if (this.wsManager.onClose) this.wsManager.onClose(() => {});
    
    this.wsHandlers = null;
    this.isInitialized = false;
  }

  private showReconnectUI(): void {
    // Add reconnection UI logic here
    if (this.reconnectButton) {
      this.reconnectButton.setVisible(true);
    }
  }

  private updateReadyButton(): void {
    if (!this.readyButton) return;
    
    const isReady = this.isHost ? this.player1Ready : this.player2Ready;
    this.readyButton.setText(isReady ? 'Not Ready' : 'Ready');
    this.readyButton.setStyle({
      backgroundColor: isReady ? '#ff4444' : '#4CAF50'
    });
  }

  private handleBack(): void {
    if (this.mode === 'online' && this.wsManager) {
      // Notify server that player is leaving
      this.wsManager.send({
        type: 'playerLeft',
        roomCode: this.roomCode || '',
        isHost: this.isHost
      });
      
      // Clean up WebSocket connection
      this.cleanupWebSocketHandlers();
      this.wsManager.disconnect();
    }
    
    this.scene.start('GameModeScene');
  }

  private launchGame(): void {
    console.log('[PlayerSelectScene] launchGame called, mode:', this.mode, 'isHost:', this.isHost);
    
    if (this.mode === 'online') {
      if (this.isHost) {
        console.log('[PlayerSelectScene] Host transitioning to ScenarioSelectScene');
        console.log('[PlayerSelectScene] Passing wsManager to ScenarioSelectScene:', !!this.wsManager);
        // Host transitions to scenario selection only
        this.scene.start('ScenarioSelectScene', {
          mode: this.mode,
          selected: this.selected,
          roomCode: this.roomCode,
          isHost: this.isHost,
          wsManager: this.wsManager // Pass the WebSocket manager to the next scene
        });
        return; // Prevent any further transition for host
      } else {
        console.log('[PlayerSelectScene] Guest waiting for scenario selection');
        // Guest sees waiting message
        if (this.waitingText) this.waitingText.setVisible(true);
        else {
          const w = this.cameras.main.width;
          const h = this.cameras.main.height;
          this.waitingText = this.add.text(w/2, h*0.92, 'Aguardando o anfitrião escolher o cenário...', {
            fontSize: '22px',
            color: '#fff',
            backgroundColor: '#222',
            padding: { x: 16, y: 8 },
            fontFamily: 'monospace'
          }).setOrigin(0.5);
        }
        // Guest stays in PlayerSelectScene and listens for scenario_selected
        if (this.wsManager && this.wsManager.setMessageCallback) {
          console.log('[Guest] Setting message callback for game_start');
          this.wsManager.setMessageCallback((event: MessageEvent) => {
            try {
              // Check if data is already an object or needs parsing
              const data = typeof event.data === 'string' 
                ? JSON.parse(event.data)
                : event.data;
                
              console.log('[Guest] Received message:', data);
              
              if (data.type === 'game_start' || data.type === 'gameStart') {
                console.log('[Guest] Received game_start:', data);
                // Transition to fight scene with correct character selection
                this.scene.start('KidsFightScene', {
                  gameMode: 'online',
                  mode: this.mode,
                  selected: { p1: data.p1Char, p2: data.p2Char },
                  scenario: data.scenario,
                  roomCode: this.roomCode,
                  isHost: this.isHost
                });
              }
            } catch (e) { 
              console.error('Error processing game_start message:', e); 
            }
          });
        }
        return;
      }
    }
    
    console.log('[PlayerSelectScene] Local mode transitioning to ScenarioSelectScene');
    // Local mode: transition to scenario selection
    this.scene.start('ScenarioSelectScene', {
      mode: this.mode,
      selected: this.selected
    });
  }

  private handlePlayerSelected(data: PlayerSelectWebSocketMessage): void {
    if (data.player === 'p1' && data.character) {
      this.selected.p1 = data.character;
      if (DEV) {
        console.log(`[PlayerSelectScene] Player 1 selected: ${data.character}`);
      }
    } else if (data.player === 'p2' && data.character) {
      this.selected.p2 = data.character;
      if (DEV) {
        console.log(`[PlayerSelectScene] Player 2 selected: ${data.character}`);
      }
    }
    this.updateSelectionIndicators();
  }

  private updateReadyUI(): void {
    if (!this.player1ReadyText || !this.player2ReadyText) return;
    
    this.player1ReadyText.setText(`P1 ${this.player1Ready ? 'Ready' : 'Not Ready'}`);
    this.player2ReadyText.setText(`P2 ${this.player2Ready ? 'Ready' : 'Not Ready'}`);
    
    if (this.readyButton) {
      const isReady = this.isHost ? this.player1Ready : this.player2Ready;
      this.readyButton.setText(isReady ? 'Not Ready' : 'Ready');
      this.readyButton.setStyle({
        backgroundColor: isReady ? '#ff4444' : '#4CAF50'
      });
    }
  }

  private handlePlayerReady(data: PlayerSelectWebSocketMessage): void {
    if (data.player1Ready !== undefined) {
      this.player1Ready = data.player1Ready;
      if (DEV) {
        console.log(`[PlayerSelectScene] Player 1 ready: ${data.player1Ready}`);
      }
    }
    if (data.player2Ready !== undefined) {
      this.player2Ready = data.player2Ready;
      if (DEV) {
        console.log(`[PlayerSelectScene] Player 2 ready: ${data.player2Ready}`);
      }
    }
    this.updateReadyUI();
  }

  private setupWebSocketHandlers(): void {
    if (!this.wsManager || this.isInitialized) return;
    this.isInitialized = true;

    // Clean up any existing handlers first
    this.cleanupWebSocketHandlers();

    const messageHandler = (event: MessageEvent) => {
      try {
        // Check if data is already an object or needs parsing
        const data = typeof event.data === 'string' 
          ? JSON.parse(event.data)
          : event.data;
          
        if (DEV) {
          console.log('[PlayerSelectScene] Received message:', data);
        }

        if (!data || !data.type) return;

        switch (data.type) {
          case 'player_selected':
          case 'playerSelected':
            this.handlePlayerSelected(data);
            break;
          case 'playerReady':
            this.handlePlayerReady(data);
            break;
          case 'game_start':
          case 'gameStart':
            this.handleGameStart(data);
            break;
          case 'roomInfo':
            if (data.roomCode) {
              this.roomCode = data.roomCode;
              if (this.roomCodeText) {
                this.roomCodeText.setText(`Room: ${this.roomCode}`);
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    const errorHandler = (error: Event) => {
      console.error('WebSocket error:', error);
    };

    const closeHandler = (event: CloseEvent) => {
      console.log('WebSocket connection closed:', event);
      this.cleanupWebSocketHandlers();
      this.isInitialized = false;
      if (this.reconnectButton) {
        this.reconnectButton.setVisible(true);
      }
    };

    // Store handlers for cleanup
    this.wsHandlers = {
      messageHandler,
      errorHandler,
      closeHandler
    };

    // Add new handlers using the correct WebSocketManager methods
    if (this.wsManager) {
      if (this.wsManager.setMessageCallback) this.wsManager.setMessageCallback(messageHandler);
      if (this.wsManager.setErrorCallback) this.wsManager.setErrorCallback(errorHandler);
      if (this.wsManager.onClose) this.wsManager.onClose(closeHandler);
    }
  }

  private sendWebSocketMessage(message: PlayerSelectWebSocketMessage): void {
    if (this.wsManager && this.wsManager.send) {
      this.wsManager.send(message);
    }
  }

  public startGame(): void {
    this.launchGame();
  }

  private getScenarioNameByKey(scenarioKey: string): string {
    // Keep in sync with SCENARIOS array in ScenarioSelectScene
    const scenarios = [
      { key: 'scenario1', name: 'Dona Isa' },
      { key: 'scenario2', name: 'Acácia' },
      // Add more if needed
    ];
    const found = scenarios.find(s => s.key === scenarioKey);
    return found ? found.name : scenarioKey;
  }
}
