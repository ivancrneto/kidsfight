import Phaser from 'phaser';
import { getWebSocketUrl } from './websocket_manager';
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
  type: 'playerReady' | 'gameStart' | 'playerSelected' | 'roomInfo' | 'game_start' | 'scene_change' | 'player_selected';
  player?: string;
  character?: string;
  player1Ready?: boolean;
  player2Ready?: boolean;
  p1Char?: string;
  p2Char?: string;
  roomCode?: string;
  isHost?: boolean;
  scenario?: string;
  scene?: string;
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
  // ... existing properties ...
  public readyStatusText!: Phaser.GameObjects.Text; // Add status text property

  // Properties made public for testability
  public CHARACTER_KEYS: string[] = [
    'bento', 'davir', 'jose', 'davis',
    'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'
  ];
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
    this.selected = { p1: 'bento', p2: 'davir' };
    this.wsManager = wsManager ?? null;
  }

  init(data: SceneData): void {
    console.log('[PlayerSelectScene] Initializing with data:', data);
    setTimeout(() => {
      console.log('[PlayerSelectScene][DEBUG] After init: mode =', this.mode, 'roomCode =', this.roomCode, 'isHost =', this.isHost);
    }, 0);
    // DEBUG: Show mode and isHost after init
    setTimeout(() => {
      console.log('[DEBUG] After init: mode =', this.mode, 'isHost =', this.isHost);
    }, 0);
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
    const keys = (this.CHARACTER_KEYS && this.CHARACTER_KEYS.length >= 2)
      ? this.CHARACTER_KEYS
      : ['player1', 'player2'];
    if (data && data.mode === 'online') {
      this.mode = 'online';
      this.roomCode = data.roomCode || this.roomCode || null;
      this.isHost = !!data.isHost; // Always use the boolean value
      console.log(`[PlayerSelectScene][init] isHost set to:`, this.isHost, 'from data:', data.isHost);
      // Use first character in CHARACTER_KEYS (or fallback) for both players, but set index to -1 so first click advances
      this.selected = { p1: keys[0], p2: keys[0] };
      this.p1Index = -1;
      this.p2Index = -1;
      this.selectedP1Index = -1;
      this.selectedP2Index = -1;
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
      // Use first and second characters in CHARACTER_KEYS (or fallback) for local mode
      this.selected = { p1: keys[0], p2: keys[1] };
      this.p1Index = 0;
      this.p2Index = 1;
      this.selectedP1Index = 0;
      this.selectedP2Index = 1;
    }
  }

  preload(): void {
    // Load character sprites as spritesheets (assuming 96x96 frame size)
    this.load.spritesheet('player1', player1RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player2', player2RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player3', player3RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player4', player4RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player5', player5RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player6', player6RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player7', player7RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player8', player8RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player9', player9RawImg, { frameWidth: 450, frameHeight: 512 });
    
    // Note: Removed selector.png and will use Phaser shapes instead
    
    // Load background
    this.load.image('scenario', scenarioImg);
    
    // Load game logo
    this.load.image('game_logo', gameLogoImg);
  }

  create(): void {
    console.log('[PlayerSelectScene] create() called, mode:', this.mode, 'roomCode:', this.roomCode, 'isHost:', this.isHost);
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
      this.setupWebSocketDebug();
    }

    // Responsive layout update on resize
    this.scale.on('resize', this.updateLayout, this);
  }

  private setupWebSocketDebug(): void {
    if (!this.wsManager) return;
    this.wsManager.setMessageCallback((event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log('[DEBUG][PlayerSelectScene] Incoming WebSocket message:', data);
        if (data.type === 'game_start' || data.type === 'gameStart') {
          console.log('[DEBUG][PlayerSelectScene] Triggering scene.start("KidsFightScene") with:', data);
        }
        // Add more debug points for other message types if needed
      } catch (e) {
        console.error('[DEBUG][PlayerSelectScene] Error parsing incoming WebSocket message:', e, event);
      }
    });
  }

  private setupCharacters(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    // --- Responsive character grid setup (centered grid, smaller height section) ---
    // Only declare these ONCE:
    const gridCols = 3;
    const gridRows = 3;
    const gridW = w * 0.7;
    const gridH = h * 0.65; // use even more vertical space
    const cellW = gridW / gridCols;
    const cellH = gridH / gridRows;
    const circleRadius = 60;
    const labelOffset = 10;
    // Offsets for proportional layout
    const circleYOffset = -cellH * 0.4; // move circles 40% up
    const nameYOffset = -cellH * 0.1;   // move names 10% up
    const spriteYOffset = cellH * 0.3;  // move sprites 30% down
    const startX = w / 2 - gridW / 2 + cellW / 2;
    const startY = h / 2 - gridH / 2 + cellH / 2 + 20; // center grid, nudge it slightly lower
    // Setup characters with only name/key, then assign x/y/scale
    const characterDefs = [
      { name: 'Bento', key: 'player1' },
      { name: 'Davi R', key: 'player2' },
      { name: 'José', key: 'player3' },
      { name: 'Davis', key: 'player4' },
      { name: 'Carol', key: 'player5' },
      { name: 'Roni', key: 'player6' },
      { name: 'Jacqueline', key: 'player7' },
      { name: 'Ivan', key: 'player8' },
      { name: 'D. Isa', key: 'player9' }
    ];
    this.characters = characterDefs.map((char, i) => {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const cx = startX + col * cellW;
      const cy = startY + row * cellH;
      return {
        ...char,
        x: cx,
        y: cy,
        scale: 0.5
      };
    });
    this.characters.forEach((char, i) => {
      // Use char.x, char.y as the center of the cell
      // Background circle
      const bgCircle = this.add.circle(char.x, char.y + circleYOffset, circleRadius, 0x222222, 1);
      char.bgCircle = bgCircle;
      char.bgCircleOffsetY = 0;
      // Sprite (feet at bottom of circle)
      const cropX = 30;
      const cropY = 40;
      const cropW = 300;
      const cropH = 250;
      const baseSize = 296;
      const screenW = this.sys.game.config.width as number;
      const screenH = this.sys.game.config.height as number;
      const scale = 0.4 * Math.min(screenW, screenH) / 720;
      const sprite = this.add.sprite(char.x, char.y + spriteYOffset + circleRadius / 2, char.key, 0);
      sprite.setScale(scale);
      sprite.setInteractive({ useHandCursor: true });
      sprite.setOrigin(0.5, 1.0);
      sprite.setCrop(cropX, cropY, cropW, cropH);
      sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        console.log('[DEBUG] pointerdown', { isHost: this.isHost, mode: this.mode, pointer, charKey: char.key });
        if (this.mode === 'online') {
          if (this.isHost) {
            if (pointer.leftButtonDown()) this.setSelectorToCharacter('p1', sprite);
          } else {
            if (pointer.leftButtonDown()) this.setSelectorToCharacter('p2', sprite);
          }
        } else {
          if (pointer.leftButtonDown()) this.setSelectorToCharacter('p1', sprite);
          if (pointer.rightButtonDown()) this.setSelectorToCharacter('p2', sprite);
        }
      });
    this.characterSprites[char.key] = sprite;
    // Align selector circle with center
    bgCircle.setPosition(char.x, char.y);
  });

  // Draw each bottom-row name label directly under its character
  const lastRowY = startY + (gridRows - 1) * cellH;
  const nameFontSize = 20;
  const nameLabelsY = lastRowY + circleRadius + labelOffset;
  // Draw name label for EVERY character, centered under each
  for (let i = 0; i < this.characters.length; i++) {
    const char = this.characters[i];
    const label = this.add.text(
      char.x,
      char.y + nameYOffset + circleRadius + labelOffset + circleYOffset,
      char.name,
      {
        fontSize: '20px',
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center',
      }
    ).setOrigin(0.5, 0);
    char.nameLabel = label;
  }

  // Move button group further down below the row of names
  const buttonOffset = 80; // much more space for buttons below names
  const buttonsY = nameLabelsY + nameFontSize + buttonOffset;
  if (this.backButton && this.readyButton && this.startButtonRect) {
    const spacing = 32;
    const totalWidth = this.readyButton.displayWidth + spacing + this.backButton.displayWidth;
    const centerX = w / 2;
    this.backButton.setPosition(centerX - totalWidth/2 + this.backButton.displayWidth/2, buttonsY);
    this.readyButton.setPosition(centerX + totalWidth/2 - this.readyButton.displayWidth/2, buttonsY);
    this.startButtonRect.setPosition(this.readyButton.x, this.readyButton.y);
  }
}

  public handleCharacterSelect(player: 1 | 2, direction: -1 | 1): void {
    const currentIndex = player === 1 ? this.p1Index : this.p2Index;
    let newIndex = (currentIndex + direction + this.CHARACTER_KEYS.length) % this.CHARACTER_KEYS.length;
    // ... rest of the code remains the same ...

    if (this.mode !== 'online') {
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
      this.updateReadyUI();
    } else {
      // Online mode: only allow the local player to move their selector
      if ((player === 1 && this.isHost) || (player === 2 && !this.isHost)) {
        if (player === 1) {
          newIndex = (this.p1Index + 1) % this.CHARACTER_KEYS.length;
          this.p1Index = newIndex;
          this.selected.p1 = this.characters[newIndex].key;
          this.selectedP1Index = newIndex;
        } else {
          newIndex = (this.p2Index + 1) % this.CHARACTER_KEYS.length;
          this.p2Index = newIndex;
          this.selected.p2 = this.characters[newIndex].key;
          this.selectedP2Index = newIndex;
        }
        this.updateSelectionIndicators();
        this.updateReadyUI();
        // Notify the server of the selection in online mode
        if (this.wsManager && typeof this.wsManager.send === 'function') {
          const playerKey = player === 1 ? 'p1' : 'p2';
          const characterKey = this.characters[newIndex].key;
          console.log('[DEBUG] Sending player_selected:', { player: playerKey, character: characterKey });
          this.wsManager.send({
            type: 'player_selected',
            player: playerKey,
            character: characterKey
          });
        }
      }
      // Otherwise, ignore
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
    if (data.type !== 'gameStart' && data.type !== 'game_start' || !('p1Char' in data) || !('p2Char' in data)) return;

    const gameData = data as GameStartWebSocketMessage & { isHost?: boolean; playerIndex?: number };
    // Use isHost and playerIndex from the server message, fallback to local if missing
    const isHost = typeof gameData.isHost === 'boolean' ? gameData.isHost : this.isHost;
    const playerIndex = typeof gameData.playerIndex === 'number' ? gameData.playerIndex : (isHost ? 0 : 1);

    this.scene.start('KidsFightScene', {
      gameMode: 'online',
      isHost,
      playerIndex,
      mode: 'online',
      p1: data.p1Char,
      p2: data.p2Char,
      selected: { p1: data.p1Char, p2: data.p2Char },
      scenario: data.scenario,
      roomCode: data.roomCode,
      wsManager: this.wsManager,
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
  }

  private launchGame(): void {
    console.log('[PlayerSelectScene] launchGame called, mode:', this.mode, 'isHost:', this.isHost);
    
    if (this.mode === 'online') {
      // Toggle ready state for the current player in online mode
      if (this.isHost) {
        this.player1Ready = !this.player1Ready;
        console.log(`[PlayerSelectScene] Host toggled own ready state to: ${this.player1Ready}`);
      } else {
        this.player2Ready = !this.player2Ready;
        console.log(`[PlayerSelectScene] Guest toggled own ready state to: ${this.player2Ready}`);
      }

      // Log both ready states for debugging
      console.log(`[PlayerSelectScene] [DEBUG] Ready states after toggle: player1Ready=${this.player1Ready}, player2Ready=${this.player2Ready}, isHost=${this.isHost}`);

      // Update UI immediately for local feedback
      this.updateReadyUI();

      // Send ready state to the other player (server expects type: 'player_ready', player: 'host'|'guest')
      if (this.wsManager) {
        const message = {
          type: 'player_ready',
          player: this.isHost ? 'host' : 'guest',
          roomCode: this.roomCode
        };
        console.log('[PlayerSelectScene] Sending ready state to server:', message);
        this.wsManager.send(message);
      }
    } else {
      // Local mode: proceed directly to scenario selection
      const p1CharKey = this.CHARACTER_KEYS[this.selectedP1Index];
      const p2CharKey = this.CHARACTER_KEYS[this.selectedP2Index];
      console.log('[PlayerSelectScene] Local mode selected characters:', { p1: p1CharKey, p2: p2CharKey });
      this.selected = { p1: p1CharKey, p2: p2CharKey };
      this.scene.start('ScenarioSelectScene', {
        mode: 'local',
        selected: this.selected
      });
    }
  }

  private handlePlayerReady(data: PlayerSelectWebSocketMessage): void {
    console.log('[PlayerSelectScene] handlePlayerReady received:', data, 'isHost:', this.isHost);

    // Update ready state based on which player is ready
    if (data.player === 'host') {
      this.player1Ready = true;
      console.log(`[PlayerSelectScene] Updated Player 1 ready:`, this.player1Ready);
    } else if (data.player === 'guest') {
      this.player2Ready = true;
      console.log(`[PlayerSelectScene] Updated Player 2 ready:`, this.player2Ready);
    }

    // Log both ready states for debugging
    console.log(`[PlayerSelectScene] [DEBUG] Ready states after update: player1Ready=${this.player1Ready}, player2Ready=${this.player2Ready}, isHost=${this.isHost}`);

    this.updateReadyUI();

    // Host: check if both ready and proceed
    if (this.isHost && this.player1Ready && this.player2Ready) {
      console.log('[PlayerSelectScene] Both players ready, proceeding to scenario select...');
      this.proceedToScenarioSelect();
    }
  }

private createUIButtons(): void {
  // Create a "Ready" button at the bottom center
  const w = this.cameras.main.width;
  const h = this.cameras.main.height;
  const readyButton = this.add.text(w * 0.5, h * 0.8, 'Ready', {
    fontSize: '32px',
    color: '#00ff00',
    backgroundColor: '#222',
    padding: { x: 20, y: 10 }
  }).setOrigin(0.5).setInteractive();

  readyButton.on('pointerdown', () => {
    this.launchGame();
  });

  // Store reference for later updates
  this.readyButton = readyButton;
}

private createSelectionIndicators(): void {
  const w = this.cameras.main.width;
  const h = this.cameras.main.height;
  // Player 1: yellow circle
  this.p1SelectorCircle = this.add.circle(w * 0.25, h * 0.5, 30, 0xffff00);
  // Player 2: blue circle
  this.p2SelectorCircle = this.add.circle(w * 0.75, h * 0.5, 30, 0x3399ff);
  // Create status text in the center, if not already created
  if (!this.readyStatusText) {
    this.readyStatusText = this.add.text(w * 0.5, h * 0.15, '', {
      fontSize: '24px',
      color: '#fff',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5);
  }
}

private setSelectorToCharacter(player: 'p1' | 'p2', charSprite: Phaser.GameObjects.Sprite): void {
  // Move the selector circle to the character sprite's position
  if (player === 'p1' && this.p1SelectorCircle) {
    this.p1SelectorCircle.setPosition(charSprite.x, charSprite.y);
  } else if (player === 'p2' && this.p2SelectorCircle) {
    this.p2SelectorCircle.setPosition(charSprite.x, charSprite.y);
  }
}

private updateSelectionIndicators(): void {
  // Example: update indicator positions or appearance if needed
  const w = this.cameras.main.width;
  const h = this.cameras.main.height;
  if (this.p1SelectorCircle) {
    this.p1SelectorCircle.setPosition(w * 0.25, h * 0.5);
  }
  if (this.p2SelectorCircle) {
    this.p2SelectorCircle.setPosition(w * 0.75, h * 0.5);
  }
}

private updateReadyUI(): void {
  // Update the ready button (if present)
  if (typeof this.updateReadyButton === 'function') {
    this.updateReadyButton();
  }

  // Optionally update a status text field if it exists
  if (this.readyStatusText) {
    const p1Status = this.player1Ready ? 'PRONTO' : 'NÃO PRONTO';
    const p2Status = this.player2Ready ? 'PRONTO' : 'NÃO PRONTO';
    this.readyStatusText.setText(`P1: ${p1Status} | P2: ${p2Status}`);
  }
}

private setupWebSocketHandlers(): void {
  // Clean up any existing handlers first
  this.cleanupWebSocketHandlers();

  const messageHandler = (event: MessageEvent) => {
    try {
      // Check if data is already an object or needs parsing
      const data = typeof event.data === 'string'
        ? JSON.parse(event.data)
        : event.data;

      console.log('[PlayerSelectScene] Received message:', data);

      if (!data || !data.type) return;

      // Handle different message types
      if (data.type === 'player_selected' || data.type === 'playerSelected') {
        this.handlePlayerSelected(data);
      } else if (data.type === 'player_ready' || data.type === 'playerReady') {
        this.handlePlayerReady(data as PlayerSelectWebSocketMessage);
      } else if (data.type === 'game_start' || data.type === 'gameStart') {
        if (!this.isHost) {
          this.scene.start('KidsFightScene', {
            gameMode: 'online',
            isHost: false,
            mode: 'online',
            p1: data.p1Char,
            p2: data.p2Char,
            selected: { p1: data.p1Char, p2: data.p2Char },
            scenario: data.scenario,
            roomCode: data.roomCode,
            wsManager: this.wsManager,
          });
        } else {
          this.handleGameStart(data as PlayerSelectWebSocketMessage);
        }
      } else if (data.type === 'roomInfo') {
        if (data.roomCode) {
          this.roomCode = data.roomCode;
          if (this.roomCodeText) {
            this.roomCodeText.setText(`Room: ${this.roomCode}`);
          }
        }
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

  /**
   * Proceeds to the scenario select screen
   */
  private proceedToScenarioSelect(): void {
    // Get the final character selections
    const p1CharKey = this.CHARACTER_KEYS[this.selectedP1Index];
    const p2CharKey = this.CHARACTER_KEYS[this.selectedP2Index];
    
    console.log('[PlayerSelectScene] Proceeding to scenario select with characters:', { 
      p1: p1CharKey, 
      p2: p2CharKey,
      mode: this.mode,
      isHost: this.isHost
    });
    
    // Update the selected object
    this.selected = { p1: p1CharKey, p2: p2CharKey };
    
    // In online mode, notify the server about the scene change and character selections
    if (this.mode === 'online' && this.wsManager && this.roomCode) {
      // Notify server about scene change
      this.wsManager.send({
        type: 'scene_change',
        scene: 'scenario_select',
        roomCode: this.roomCode,
        isHost: this.isHost
      });
      
      // Send character selections
      this.wsManager.send({
        type: 'player_selected',
        player: 'p1',
        character: p1CharKey,
        roomCode: this.roomCode
      });
      
      this.wsManager.send({
        type: 'player_selected',
        player: 'p2',
        character: p2CharKey,
        roomCode: this.roomCode
      });
      
      // Remove WebSocket handler before leaving scene
      if (typeof this.wsManager.setMessageCallback === 'function') {
        // Set to a no-op function instead of null to maintain type safety
        this.wsManager.setMessageCallback(() => {});
      }
    }
    
    // Start the scenario select scene
    this.scene.start('ScenarioSelectScene', {
      mode: this.mode,
      selected: this.selected,
      roomCode: this.roomCode,
      isHost: this.isHost,
      wsManager: this.mode === 'online' ? this.wsManager : undefined
    });
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
