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
  type: 'playerReady' | 'gameStart' | 'game_start' | 'playerSelected' | 'player_selected' | 'roomInfo';
  player?: string;
  character?: string;
  player1Ready?: boolean;
  player2Ready?: boolean;
  p1Char?: string;
  p2Char?: string;
  roomCode?: string;
  isHost?: boolean;
  scenario?: string;
}

interface GameStartWebSocketMessage extends PlayerSelectWebSocketMessage {
  type: 'gameStart' | 'game_start';
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
  public p1Char: string | null = null;
  public p1Sprite: Phaser.GameObjects.Sprite | null = null;

  constructor(wsManager?: WebSocketManager | null) {
    super({ key: 'PlayerSelectScene' });
    this.selected = { p1: 'bento', p2: 'davir' };
    this.wsManager = wsManager ?? null;
  }

  init(data: SceneData): void {
    console.log('[PlayerSelectScene] Initializing with data:', data);
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
      this.isHost = data.isHost || false;
      // Initialize with different default characters for host vs guest to avoid conflicts
      // Host defaults to bento (index 0), Guest defaults to davir (index 1)
      if (this.isHost) {
        this.selected = { p1: keys[0], p2: keys[1] || keys[0] }; // Host: bento for p1, davir for p2
        this.p1Index = 0; // bento
        this.p2Index = 1; // davir
        this.selectedP1Index = 0;
        this.selectedP2Index = 1;
      } else {
        this.selected = { p1: keys[0], p2: keys[1] || keys[0] }; // Guest will receive actual selections from host
        this.p1Index = 0; // Will be updated by host's selection
        this.p2Index = 1; // Guest defaults to davir
        this.selectedP1Index = 0;
        this.selectedP2Index = 1;
      }
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
    // All character sprites are loaded as images. Variable-width slicing is handled in create().
    this.load.spritesheet('bento', player1RawImg,{ frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('davir', player2RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('jose', player3RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('davis', player4RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('carol', player5RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('roni', player6RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('jacqueline', player7RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('ivan', player8RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('d_isa', player9RawImg, { frameWidth: 400, frameHeight: 512 });
    
    // Note: Removed selector.png and will use Phaser shapes instead
    
    // Load background
    this.load.image('scenario', scenarioImg);
    
    // Load game logo
    this.load.image('gameLogo', gameLogoImg);
  }

  create(): void {
    console.log('[DEBUG] PlayerSelectScene.create() called, mode =', this.mode, 'isHost =', this.isHost);
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Add a large logo as a background, behind players
    const logoBg = this.add.image(w/2, h/2, 'gameLogo')
      .setOrigin(0.5)
      .setDisplaySize(w, h)
      .setAlpha(0.13)
      .setDepth(0); // Behind everything

    // Add background color rectangle above logo for contrast (optional, can remove if too opaque)
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 0.55).setDepth(1);

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
    ).setOrigin(0.5).setDepth(2);

    // Setup character grid
    this.setupCharacters();

    // Create selection indicators
    this.createSelectionIndicators();

    // Create UI buttons
    this.createUIButtons();
    
    // Update ready button state
    this.updateReadyButton();

    // Setup WebSocket handlers for online mode
    if (this.mode === 'online') {
      this.setupWebSocketHandlers();
      this.setupWebSocketDebug();
      
      // Send initial character selections when entering the scene (with delay to ensure handlers are set up)
      setTimeout(() => {
        if (this.wsManager && typeof this.wsManager.send === 'function') {
          if (this.isHost) {
            // Host sends both player selections to establish initial state
            console.log('[PlayerSelectScene] Host sending initial character selections:', { 
              p1: this.selected.p1,
              p2: this.selected.p2,
              selected: this.selected 
            });
            this.wsManager.send({
              type: 'player_selected',
              player: 'p1',
              character: this.selected.p1
            });
            // Small delay between messages to avoid race conditions
            setTimeout(() => {
              if (this.wsManager && typeof this.wsManager.send === 'function') {
                this.wsManager.send({
                  type: 'player_selected',
                  player: 'p2',
                  character: this.selected.p2
                });
              }
            }, 50);
          } else {
            // Guest only sends their own selection (p2)
            const characterKey = this.selected.p2;
            console.log('[PlayerSelectScene] Guest sending initial p2 character selection:', { 
              characterKey,
              selected: this.selected 
            });
            this.wsManager.send({
              type: 'player_selected',
              player: 'p2',
              character: characterKey
            });
          }
        }
      }, 150);
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
      { name: 'Bento', key: 'bento' },
      { name: 'Davi R', key: 'davir' },
      { name: 'José', key: 'jose' },
      { name: 'Davis', key: 'davis' },
      { name: 'Carol', key: 'carol' },
      { name: 'Roni', key: 'roni' },
      { name: 'Jacqueline', key: 'jacqueline' },
      { name: 'Ivan', key: 'ivan' },
      { name: 'D. Isa', key: 'd_isa' }
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
            if (pointer.leftButtonDown()) this.setSelectorToCharacter(1, i);
          } else {
            if (pointer.leftButtonDown()) this.setSelectorToCharacter(2, i);
          }
        } else {
          if (pointer.leftButtonDown()) this.setSelectorToCharacter(1, i);
          if (pointer.rightButtonDown()) this.setSelectorToCharacter(2, i);
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
    ).setOrigin(0.5).setDepth(2);
    char.nameLabel = label;
  }

  // Move button group further down below the row of names
  const buttonOffset = 80; // much more space for buttons below names
  const buttonsY = nameLabelsY + nameFontSize + buttonOffset;
  if (this.backButton && this.readyButton) {
    const spacing = 32;
    const totalWidth = this.readyButton.displayWidth + spacing + this.backButton.displayWidth;
    const centerX = w / 2;
    this.backButton.setPosition(centerX - totalWidth/2 + this.backButton.displayWidth/2, buttonsY);
    this.readyButton.setPosition(centerX + totalWidth/2 - this.readyButton.displayWidth/2, buttonsY);
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
    
    // Update button text and background color to match scenario select scene
    if (isReady) {
      this.readyButton.setText('CANCELAR');
      this.readyButton.setBackgroundColor('#AA0000');
      this.readyButton.disableInteractive();
    } else {
      this.readyButton.setText('COMEÇAR');
      this.readyButton.setBackgroundColor('#00AA00');
      this.readyButton.setInteractive({ useHandCursor: true });
    }
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

    let currentPlayer: 1 | 2;
    if (this.mode === 'online') {
      // Ensure guest sets up WebSocket handlers before transition
      if (!this.isHost) {
        this.setupWebSocketHandlers();
      }
      
      // Make sure to use the final selected character keys from CHARACTER_KEYS
      const p1CharKey = this.CHARACTER_KEYS[this.selectedP1Index];
      const p2CharKey = this.CHARACTER_KEYS[this.selectedP2Index];
      
      console.log('[PlayerSelectScene] Final selected characters:', { p1: p1CharKey, p2: p2CharKey });
      
      // Update the selected object to ensure it has the correct keys
      this.selected = { p1: p1CharKey, p2: p2CharKey };
      
      // Host and guest: always pass wsManager, roomCode, isHost to ScenarioSelectScene in online mode
      this.scene.start('ScenarioSelectScene', {
        mode: this.mode,
        selected: this.selected,
        roomCode: this.roomCode,
        isHost: this.isHost,
        wsManager: this.wsManager,
      });
    } else {
      // For local mode, ensure selected characters match the indexes
      const p1CharKey = this.CHARACTER_KEYS[this.selectedP1Index];
      const p2CharKey = this.CHARACTER_KEYS[this.selectedP2Index];
      
      console.log('[PlayerSelectScene] Final selected characters:', { p1: p1CharKey, p2: p2CharKey });
      
      // Update the selected object
      this.selected = { p1: p1CharKey, p2: p2CharKey };
      
      // Local mode: transition to scenario selection
      this.scene.start('ScenarioSelectScene', {
        mode: this.mode,
        selected: this.selected
      });
    }
  }

  private handlePlayerSelected(data: PlayerSelectWebSocketMessage): void {
    console.log('[PlayerSelectScene] Received player_selected message:', data);
    console.log('[PlayerSelectScene] Current state before handling:', {
      isHost: this.isHost,
      mode: this.mode,
      p1Index: this.p1Index,
      p2Index: this.p2Index,
      selectedP1Index: this.selectedP1Index,
      selectedP2Index: this.selectedP2Index,
      selected: this.selected
    });
    console.log('[PlayerSelectScene] Characters keys:', this.characters.map(c => c.key));
    
    if (data.player === 'p1' && data.character) {
      console.log('[DEBUG] Processing p1 selection:', data.character);
      this.selected.p1 = data.character;
      const idx = this.characters.findIndex(c => c.key === data.character);
      if (idx === -1) {
        console.warn('[PlayerSelectScene] Could not find character key in characters:', data.character, this.characters.map(c => c.key));
        return; // Don't update indices if character not found
      }
      console.log(`[PlayerSelectScene] Player 1 selected: ${data.character} (index ${idx})`);
      this.p1Index = idx;
      this.selectedP1Index = idx;
      // Force visual update for p1 selection indicators
      this.updateSelectionIndicators();
    } else if (data.player === 'p2' && data.character) {
      console.log('[DEBUG] Processing p2 selection:', data.character);
      this.selected.p2 = data.character;
      const idx = this.characters.findIndex(c => c.key === data.character);
      if (idx === -1) {
        console.warn('[PlayerSelectScene] Could not find character key in characters:', data.character, this.characters.map(c => c.key));
        return; // Don't update indices if character not found
      }
      console.log(`[PlayerSelectScene] Player 2 selected: ${data.character} (index ${idx})`);
      this.p2Index = idx;
      this.selectedP2Index = idx;
      // Force visual update for p2 selection indicators
      this.updateSelectionIndicators();
    } else {
      console.warn('[PlayerSelectScene] [SYNC] handlePlayerSelected called with unknown player or missing character:', data);
    }
    console.log('[PlayerSelectScene] [SYNC] Final state after handling:', {
      p1Index: this.p1Index,
      p2Index: this.p2Index,
      selectedP1Index: this.selectedP1Index,
      selectedP2Index: this.selectedP2Index,
      selected: this.selected
    });
  }

  private updateReadyUI(): void {
    if (!this.player1ReadyText || !this.player2ReadyText) return;

    this.player1ReadyText.setText(`P1 ${this.player1Ready ? 'Ready' : 'Not Ready'}`);
    this.player2ReadyText.setText(`P2 ${this.player2Ready ? 'Ready' : 'Not Ready'}`);

    if (this.readyButton) {
      const isReady = this.isHost ? this.player1Ready : this.player2Ready;
      this.readyButton.setText(isReady ? 'Cancelar' : 'COMEÇAR');
      this.readyButton.setStyle({
        color: '#fff',
        backgroundColor: isReady ? '#ff4444' : '#4CAF50'
      });
    }
  }

  private createSelectionIndicators(): void {
    // Use fixed values to match UI test expectations
    this.p1SelectorCircle = this.add.circle(-100, -100, 40, 0xffff00, 0.18).setVisible(false);
    this.p2SelectorCircle = this.add.circle(-100, -100, 40, 0x0000ff, 0.18).setVisible(false);
    // Player 1 indicator (green circle)
    this.p1Indicator = this.add.circle(-100, -100, 30, 0x00ff00, 0.7)
      .setStrokeStyle(3, 0xffffff, 1).setVisible(false);
    this.p1Text = this.add.text(-100, -100, 'P1', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontWeight: 'bold'
    }).setOrigin(0.5).setVisible(false);
    // Player 2 indicator (red circle)
    this.p2Indicator = this.add.circle(-100, -100, 30, 0xff0000, 0.7)
      .setStrokeStyle(3, 0xffffff, 1).setVisible(false);
    this.p2Text = this.add.text(-100, -100, 'P2', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontWeight: 'bold'
    }).setOrigin(0.5).setVisible(false);
  }

  private createUIButtons(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // --- Centered button group ---
    const spacing = 32; // space between buttons
    // Create both buttons first (off-screen)
    this.readyButton = this.add.text(0, 0, 'COMEÇAR', {
      fontSize: '24px',
      color: '#fff',
      fontFamily: 'monospace',
      padding: { x: 20, y: 10 },
      backgroundColor: '#00AA00'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2);
    
    this.backButton = this.add.text(0, 0, 'Voltar', {
      fontSize: '24px',
      color: '#fff',
      fontFamily: 'monospace',
      backgroundColor: '#4a4a4a',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2);
    
    // Calculate total width
    const totalWidth = this.readyButton.displayWidth + spacing + this.backButton.displayWidth;
    const centerX = w / 2;
    const y = h * 0.85;
    
    // Position backButton to the left, readyButton to the right
    this.backButton.setPosition(centerX - totalWidth/2 + this.backButton.displayWidth/2, y);
    this.readyButton.setPosition(centerX + totalWidth/2 - this.readyButton.displayWidth/2, y);

    // Button hover effects
    [this.backButton].forEach(button => {
      button.on('pointerover', () => {
        button.setStyle({ backgroundColor: '#666' });
      });
      button.on('pointerout', () => {
        button.setStyle({ backgroundColor: '#4a4a4a' });
      });
    });
    
    // Ready button click event
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

  public setSelectorToCharacter(player: 1 | 2, charIndex: number): void {
    console.log('[DEBUG] setSelectorToCharacter', { player, charIndex, isHost: this.isHost, mode: this.mode, charKey: this.characters[charIndex]?.key });
    // Restrict: host can only select for player 1, guest can only select for player 2 in online mode
    if (this.mode === 'online') {
      if ((player === 1 && !this.isHost) || (player === 2 && this.isHost)) {
        console.log('[DEBUG] selection ignored due to role restriction', { player, isHost: this.isHost });
        return;
      }
    }
    if (player === 1) {
      this.selected.p1 = this.characters[charIndex].key;
      this.selectedP1Index = charIndex;
      this.p1Index = charIndex;
    } else {
      this.selected.p2 = this.characters[charIndex].key;
      this.selectedP2Index = charIndex;
      this.p2Index = charIndex;
    }
    this.updateSelectionIndicators();
    this.updateReadyUI();
    // Notify the server of the selection in online mode
    if (this.mode === 'online' && this.wsManager && typeof this.wsManager.send === 'function') {
      console.log('[DEBUG] wsManager.send', { player, charIndex, isHost: this.isHost, mode: this.mode, charKey: this.characters[charIndex]?.key });
      const playerKey = player === 1 ? 'p1' : 'p2';
      const characterKey = this.characters[charIndex].key;
      this.wsManager.send({
        type: 'player_selected',
        player: playerKey,
        character: characterKey
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

        console.log('[PlayerSelectScene] Received message:', data);

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
              this.handleGameStart(data);
            }
            break;
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
