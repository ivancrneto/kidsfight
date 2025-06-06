import Phaser from 'phaser';
import scenario1Img from './scenario1.png';
import scenario2Img from './scenario2.png';

interface Scenario {
  key: string;
  name: string;
  img: string;
}

interface SceneData {
  mode?: 'local' | 'online';
  selected?: {
    p1: string;
    p2: string;
  };
  roomCode?: string;
  isHost?: boolean;
  wsManager?: any;
}

const SCENARIOS: Scenario[] = [
  { key: 'scenario1', name: 'Dona Isa', img: scenario1Img },
  { key: 'scenario2', name: 'Acácia', img: scenario2Img },
  // Add more scenarios here as needed
];

class ScenarioSelectScene extends Phaser.Scene {
  private selectedScenario: number;
  private preview!: Phaser.GameObjects.Image;
  private nextButton!: Phaser.GameObjects.Text;
  private prevButton!: Phaser.GameObjects.Text;
  private readyButton!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Text;
  private mode: 'local' | 'online';
  public selected: { p1: string; p2: string }; // public for test injection
  private roomCode: string | null;
  private isHost: boolean;
  public waitingText!: Phaser.GameObjects.Text; // public for test injection
  public wsManager: any; // public for test injection (if needed)
  private hostReady: boolean = false;
  private guestReady: boolean = false;
  private gameStarted: boolean = false;
  private _wsMessageHandler?: (event: MessageEvent) => void;
  private _lastGameStartTime: number = 0;
  private _gameStartCooldown: number = 3000; // 3 seconds cooldown
  private _processedMessageIds: Set<string> = new Set<string>();

  /**
   * Optional wsManager injection for testability
   */
  constructor(wsManagerInstance: any = null) {
    super({ key: 'ScenarioSelectScene' });
    this.selectedScenario = 0;
    this.mode = 'local';
    this.selected = { p1: 'player1', p2: 'player2' };
    this.roomCode = null;
    this.isHost = false;
    if (wsManagerInstance) {
      this.wsManager = wsManagerInstance;
    }
  }

  init(data: SceneData): void {
    console.log('[ScenarioSelectScene] Initializing with data:', data);
    this.mode = data.mode || 'local';
    this.selected = data.selected || { p1: 'player1', p2: 'player2' };
    this.roomCode = data.roomCode || '';
    this.isHost = data.isHost || false;
    this.wsManager = data.wsManager || null;
    
    // Initialize ready states
    this.hostReady = false;
    this.guestReady = false;
    this.gameStarted = false;
    
    // Notify server about scene change
    if (this.mode === 'online' && this.wsManager && this.roomCode) {
      this.wsManager.send({
        type: 'scene_change',
        scene: 'scenario_select',
        roomCode: this.roomCode,
        isHost: this.isHost
      });
      
      // Re-send character selection to ensure server has latest state
      const playerKey = this.isHost ? 'p1' : 'p2';
      const character = this.isHost ? this.selected.p1 : this.selected.p2;
      
      this.wsManager.send({
        type: 'player_selected',
        player: playerKey,
        character: character,
        roomCode: this.roomCode
      });
    }
    
    console.debug('[ScenarioSelectScene][init] Initialized with:', {
      mode: this.mode,
      roomCode: this.roomCode,
      isHost: this.isHost,
      gameStarted: this.gameStarted,
      hostReady: this.hostReady,
      guestReady: this.guestReady
    });
    
    // If wsManager is passed in data, use it
    if (data.wsManager) {
      console.log('[ScenarioSelectScene] Received wsManager from previous scene');
      this.wsManager = data.wsManager;
    } else {
      console.log('[ScenarioSelectScene] No wsManager received from previous scene');
    }

    // --- PATCH: Always re-send selection to server on entry (online mode) ---
    if (this.mode === 'online' && this.wsManager && typeof this.wsManager.send === 'function') {
      const playerKey = this.isHost ? 'p1' : 'p2';
      const characterKey = this.isHost ? this.selected.p1 : this.selected.p2;
      console.log('[ScenarioSelectScene] Re-sending character selection to server:', { playerKey, characterKey });
      this.wsManager.send({
        type: 'player_selected',
        player: playerKey,
        character: characterKey
      });
    }
  }

  preload(): void {
    SCENARIOS.forEach(s => {
      this.load.image(s.key, s.img);
    });
  }

  create(): void {
    console.log('[ScenarioSelectScene] create() called', this.selected, this.roomCode, this.isHost);
    const { width, height } = this.cameras.main;
    this.hostReady = false;
    this.guestReady = false;
    this.gameStarted = false;

    // Add dark overlay
    this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    
    // Add title
    this.add.text(width/2, 80, 'ESCOLHA O CENÁRIO', {
      fontSize: '32px',
      color: '#fff',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Show scenario preview
    this.preview = this.add.image(width/2, height/2, SCENARIOS[this.selectedScenario].key)
      .setOrigin(0.5)
      .setAlpha(0.95);
    
    // Match scaling logic to KidsFightScene (contain, never crop)
    this.rescalePreview();

    // Navigation buttons
    this.createNavigationButtons();

    // Action buttons
    this.createActionButtons();

    // Show waiting message for guest
    if (this.mode === 'online' && !this.isHost) {
      this.waitingText = this.add.text(width/2, height*0.85, 'Anfitrião escolhendo o cenário...', {
        fontSize: '22px',
        color: '#fff',
        backgroundColor: '#222',
        padding: { x: 16, y: 8 },
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      
      // Disable scenario selection for guest
      if (this.prevButton) this.prevButton.disableInteractive();
      if (this.nextButton) this.nextButton.disableInteractive();
    }

    // Responsive layout update on resize
    this.scale.on('resize', this.updateLayout, this);

    // Listen for ready and game_start messages if online
    if (this.mode === 'online' && this.wsManager && this.wsManager.setMessageCallback) {
      console.log('[ScenarioSelectScene] Setting WebSocket message handler for scenario scene');
      
      // Notify server that we've entered the scenario select scene
      this.wsManager.send({
        type: 'scene_change',
        scene: 'scenario_select',
        roomCode: this.roomCode,
        isHost: this.isHost
      });
      
      // Request current game state with a small delay to ensure scene change is processed
      setTimeout(() => {
        console.log(`[ScenarioSelectScene] Requesting initial game state`);
        this.wsManager.send({
          type: 'request_game_state',
          roomCode: this.roomCode,
          isHost: this.isHost
        });
      }, 200);
      
      this._wsMessageHandler = (event: MessageEvent): void => {
        console.log('[ScenarioSelectScene][WebSocket] RAW event received:', event, 'type:', typeof event, 'data:', event?.data);
        try {
          // Handle the data which might be already parsed by WebSocketManager
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.debug('[ScenarioSelectScene][WebSocket] Received message:', data);
          
          // Skip if this message is for a different room
          if (data.roomCode && data.roomCode !== this.roomCode) {
            console.debug('[ScenarioSelectScene][WebSocket] Ignoring message for different room:', data.roomCode);
            return;
          }
          
          // Handle game state sync
          if (data.type === 'game_state') {
            console.log('[ScenarioSelectScene][WebSocket] Received game state:', data);
            
            // Update ready states and scenario from server
            if (data.states) {
              const previousHostReady = this.hostReady;
              const previousGuestReady = this.guestReady;
              
              this.hostReady = data.states.hostReady || false;
              this.guestReady = data.states.guestReady || false;
              
              // Update selected scenario if it exists in the game state
              if (typeof data.states.scenario === 'number') {
                this.selectedScenario = data.states.scenario;
                this.preview.setTexture(SCENARIOS[this.selectedScenario].key);
                this.rescalePreview();
              }
              
              // Only update UI if ready states changed
              if (previousHostReady !== this.hostReady || previousGuestReady !== this.guestReady) {
                this.updateReadyUI();
                console.log(`[ScenarioSelectScene] Updated ready states - host: ${this.hostReady}, guest: ${this.guestReady}`);
              }
              
              // If host and we're ready, check if we should start the game
              if (this.isHost && this.hostReady && this.guestReady && !this.gameStarted) {
                setTimeout(() => {
                  if (this.hostReady && this.guestReady && !this.gameStarted) {
                    this.startGame();
                  }
                }, 100);
              }
            }
            return;
          }
          
          // Handle scene change notifications
          if (data.type === 'scene_change') {
            console.log(`[ScenarioSelectScene] Player ${data.isHost ? 'host' : 'guest'} changed scene to ${data.scene}`);
            
            // If the other player left the scenario select, reset their ready state
            if (data.scene !== 'scenario_select' && data.isHost !== this.isHost) {
              if (data.isHost) {
                this.hostReady = false;
              } else {
                this.guestReady = false;
              }
              this.updateReadyUI();
            }
            return;
          }
          
          if (data.type === 'scenario_selected' && !this.isHost) {
            // Update the preview to match the host's selection
            console.debug('[ScenarioSelectScene][WebSocket] Guest received scenario selection from host:', data.scenario);
            
            // Find the scenario index
            const scenarioIndex = SCENARIOS.findIndex(s => s.key === data.scenario);
            if (scenarioIndex !== -1) {
              this.selectedScenario = scenarioIndex;
              this.preview.setTexture(SCENARIOS[this.selectedScenario].key);
              this.rescalePreview();
            }
            return;
          }

          if (data.type === 'player_ready') {
            console.log(`[ScenarioSelectScene][WebSocket] Player ${data.player} is ${data.isReady ? 'ready' : 'not ready'}`);

            // Update the appropriate ready state
            if (data.player === 'host') {
              this.hostReady = data.isReady;
            } else if (data.player === 'guest') {
              this.guestReady = data.isReady;
            } else {
              console.warn('[ScenarioSelectScene][WebSocket] Unknown player in ready message:', data.player);
              return;
            }

            this.updateReadyUI();

            // If both players are ready, start the game (only host can start)
            if (this.isHost && this.hostReady && this.guestReady && !this.gameStarted) {
              console.log('[ScenarioSelectScene][WebSocket] Both players ready, starting game...');
              // Add a small delay to ensure all ready states are processed
              this.gameStarted = true;
              
              // Send game start message to the other player
              const gameStartMsg = {
                type: 'game_start',
                scenario: SCENARIOS[this.selectedScenario].key,
                p1Char: this.selected.p1,
                p2Char: this.selected.p2,
                roomCode: this.roomCode,
                isHost: this.isHost,
                messageId: `game_start_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
              };
              
              console.debug('[ScenarioSelectScene][WebSocket] Host sending game_start message', gameStartMsg);
              this.wsManager.send(gameStartMsg);
              
              // Start the game locally after a short delay
              setTimeout(() => {
                if (this.hostReady && this.guestReady) {
                  this.startGame({
                    scenario: SCENARIOS[this.selectedScenario].key,
                    p1Char: this.selected.p1,
                    p2Char: this.selected.p2,
                    isHost: this.isHost,
                    roomCode: this.roomCode
                  });
                } else {
                  this.gameStarted = false; // Reset if conditions changed
                }
              }, 100);
            }
          } else if (data.type === 'game_start' || data.type === 'gameStart') {
            const now = Date.now();
            const messageId = data.messageId || `game_start_${now}_${Math.random().toString(36).substr(2, 8)}`;
            
            // Skip if we've already processed this message or if it's too soon after last message
            if (this._processedMessageIds.has(messageId) || 
                now - this._lastGameStartTime < this._gameStartCooldown) {
              console.debug('[ScenarioSelectScene][_wsMessageHandler] Ignoring duplicate game_start message', {
                messageId,
                hasProcessed: this._processedMessageIds.has(messageId),
                timeSinceLastStart: now - this._lastGameStartTime,
                cooldown: this._gameStartCooldown
              });
              return;
            }
            
            // Mark as processed and update state
            this._processedMessageIds.add(messageId);
            this._lastGameStartTime = now;
            this.gameStarted = true;
            
            // Get character selections from the message or use defaults
            const p1Char = data.p1Char || (data.selected?.p1 ? data.selected.p1.replace('_select', '') : 'player1');
            const p2Char = data.p2Char || (data.selected?.p2 ? data.selected.p2.replace('_select', '') : 'player2');
            const scenario = data.scenario || SCENARIOS[this.selectedScenario].key;
            
            console.debug('[ScenarioSelectScene][WebSocket] Processing game_start message', {
              messageId: messageId,
              isHost: this.isHost,
              hostReady: this.hostReady,
              guestReady: this.guestReady,
              gameStarted: this.gameStarted,
              roomCode: this.roomCode,
              p1Char,
              p2Char,
              scenario,
              timestamp: now
            });
            
            // Start the game with the received character selections
            this.startGame({
              scenario: scenario,
              p1Char: p1Char,
              p2Char: p2Char,
              isHost: this.isHost,
              roomCode: this.roomCode,
              playerIndex: this.isHost ? 0 : 1
            });
          
        }
      }catch (e) {
          console.error(e);
        } 
      }

    // Responsive layout update on resize
    this.scale.on('resize', this.updateLayout, this);
  }
}

  private createNavigationButtons(): void {
    const { width, height } = this.cameras.main;
    const buttonStyle = {
      fontSize: '48px',
      color: '#fff',
      backgroundColor: '#4a4a4a',
      padding: { x: 20, y: 10 }
    };

    // Previous button
    this.prevButton = this.add.text(width * 0.2, height/2, '<', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Next button
    this.nextButton = this.add.text(width * 0.8, height/2, '>', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Button hover effects
    [this.prevButton, this.nextButton].forEach(button => {
      button.on('pointerover', () => button.setBackgroundColor('#666666'));
      button.on('pointerout', () => button.setBackgroundColor('#4a4a4a'));
    });

    // Button click handlers
    this.prevButton.on('pointerdown', () => this.changeScenario(-1));
    this.nextButton.on('pointerdown', () => this.changeScenario(1));
  }

  private createActionButtons(): void {
    const { width, height } = this.cameras.main;
    const buttonStyle = { fontSize: '24px', color: '#fff', fontFamily: 'monospace' };

    // Back button
    this.backButton = this.add.text(100, height - 80, 'VOLTAR', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('PlayerSelectScene');
      });
    
    // Ready button (or Start in local mode)
    const buttonText = this.mode === 'local' ? 'COMEÇAR' : 'PRONTO';
    this.readyButton = this.add.text(width - 100, height - 80, buttonText, buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        if (this.mode === 'local') {
          // For local mode, just start the game
          this.startGame();
          return;
        }
        
        if (this.mode === 'online' && this.wsManager) {
          // Toggle ready state
          const isReady = this.isHost ? !this.hostReady : !this.guestReady;
          
          // Update local state immediately for better UX
          if (this.isHost) {
            this.hostReady = isReady;
          } else {
            this.guestReady = isReady;
          }
          
          // Update UI to reflect new ready state
          this.updateReadyUI();
          
          // Send ready state to server
          const msg = {
            type: 'player_ready',
            isReady: isReady,
            roomCode: this.roomCode,
            player: this.isHost ? 'host' : 'guest',
            timestamp: Date.now(),
            messageId: `ready_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
            scenario: SCENARIOS[this.selectedScenario].key
          };
          
          console.debug('[ScenarioSelectScene][ReadyButton] Sending player_ready message', msg);
          this.wsManager.send(msg);
          
          // Update button state based on ready status
          if (!isReady) {
            // If marking as not ready, re-enable the button and navigation
            this.readyButton.setText('PRONTO!');
            this.readyButton.setTint(0xffffff);
            this.readyButton.setInteractive();
            
            // Re-enable scenario navigation
            if (this.prevButton) this.prevButton.setInteractive();
            if (this.nextButton) this.nextButton.setInteractive();
          } else {
            // If marking as ready, show waiting state
            this.readyButton.setText('AGUARDANDO...');
            this.readyButton.setTint(0x888888);
            this.readyButton.disableInteractive();
            
            // Disable scenario navigation when ready
            if (this.prevButton) this.prevButton.disableInteractive();
            if (this.nextButton) this.nextButton.disableInteractive();
            
            // If host is ready and guest is already ready, start the game
            if (this.isHost && this.guestReady && !this.gameStarted) {
              console.debug('[ScenarioSelectScene][ReadyButton] Host ready and guest already ready, starting game');
              this.gameStarted = true;
              
              // Send game start message to the other player
              const gameStartMsg = {
                type: 'game_start',
                scenario: SCENARIOS[this.selectedScenario].key,
                p1Char: this.selected.p1,
                p2Char: this.selected.p2,
                roomCode: this.roomCode,
                isHost: this.isHost,
                messageId: `game_start_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
              };
              
              console.debug('[ScenarioSelectScene][ReadyButton] Host sending game_start message', gameStartMsg);
              this.wsManager.send(gameStartMsg);
              
              // Start the game locally after a short delay
              setTimeout(() => {
                if (this.hostReady && this.guestReady) {
                  this.startGame({
                    scenario: SCENARIOS[this.selectedScenario].key,
                    p1Char: this.selected.p1,
                    p2Char: this.selected.p2,
                    isHost: this.isHost,
                    roomCode: this.roomCode,
                    playerIndex: 0 // Host is always player 1 (index 0)
                  });
                } else {
                  this.gameStarted = false; // Reset if conditions changed
                }
              }, 100);
            } else if (!this.isHost && this.hostReady && !this.gameStarted) {
              // If guest is ready and host is already ready, wait for host to start the game
              console.debug('[ScenarioSelectScene][ReadyButton] Guest ready and host already ready, waiting for game start');
            }
          }
        }
    });
    
  // Local mode button handlers
  if (this.mode === 'local') {
      this.readyButton.on('pointerdown', () => this.startGame());
      this.backButton.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }
  }

  private changeScenario(direction: number): void {
    // Only allow host to change scenario in online mode
    if (this.mode === 'online' && !this.isHost) {
      console.debug('[ScenarioSelectScene][changeScenario] Guest attempted to change scenario, ignoring');
      return;
    }
    
    this.selectedScenario = (this.selectedScenario + direction + SCENARIOS.length) % SCENARIOS.length;
    this.preview.setTexture(SCENARIOS[this.selectedScenario].key);
    this.rescalePreview();
    
    // In online mode, when host changes scenario, send update to server
    if (this.mode === 'online' && this.isHost && this.wsManager) {
      const scenarioMsg = {
        type: 'scenario_selected',
        scenario: SCENARIOS[this.selectedScenario].key,
        roomCode: this.roomCode
      };
      console.debug('[ScenarioSelectScene][changeScenario] Host selected new scenario, sending update:', scenarioMsg);
      this.wsManager.send(scenarioMsg);
    }
  }

  private rescalePreview(): void {
    if (!this.preview) return;
  
    const { width, height } = this.cameras.main;
    const maxWidth = width * 0.6;
    const maxHeight = height * 0.6;
  
    const scaleX = maxWidth / this.preview.width;
    const scaleY = maxHeight / this.preview.height;
    const scale = Math.min(scaleX, scaleY);
  
    this.preview.setScale(scale);
  }
    
  private _transitionToGame(data: any, p1Char: string, p2Char: string): void {
    console.debug('[ScenarioSelectScene][_transitionToGame] Starting transition with data:', {
      data,
      p1Char,
      p2Char,
      gameStarted: this.gameStarted
    });



    // Ensure we have valid character keys
    const validP1Char = this.validateCharacterKey(p1Char);
    const validP2Char = this.validateCharacterKey(p2Char);

    console.debug('[ScenarioSelectScene][_transitionToGame] Starting game with:', {
      p1Char: validP1Char,
      p2Char: validP2Char,
      scenario: data.scenario,
      isHost: data.isHost,
      roomCode: data.roomCode || this.roomCode
    });

    try {
      // Clean up WebSocket handlers
      if (this._wsMessageHandler && this.wsManager?.removeMessageCallback) {
        console.debug('[ScenarioSelectScene] Removing WebSocket message handler');
        this.wsManager.removeMessageCallback(this._wsMessageHandler);
      }

      // Ensure scene is not already being transitioned
      if (this.scene.isActive('KidsFightScene')) {
        console.warn('KidsFightScene is already active, not starting again');
        return;
      }

      // Add a small delay to ensure cleanup completes
      setTimeout(() => {
        console.debug('[ScenarioSelectScene] Starting KidsFightScene');
        this.scene.start('KidsFightScene', {
          gameMode: 'online',
          mode: this.mode,
          p1: validP1Char,
          p2: validP2Char,
          selected: { p1: validP1Char, p2: validP2Char },
          scenario: data.scenario || 'scenario1',
          selectedScenario: data.scenario || 'scenario1',
          roomCode: data.roomCode || this.roomCode,
          isHost: data.isHost || false,
          playerIndex: data.playerIndex || (data.isHost ? 0 : 1),
          wsManager: this.wsManager
        });
      }, 50);
    } catch (error) {
      console.error('[ScenarioSelectScene] Error starting game scene:', error);
      // Reset state to allow retry
      this.gameStarted = false;
      this._lastGameStartTime = 0;
    }
  }

  private startGame(data?: {
    scenario?: string;
    p1Char?: string;
    p2Char?: string;
    isHost?: boolean;
    roomCode?: string | null;
    playerIndex?: number;
  }): void {
    // Initialize data if not provided
    data = data || {};

    const now = Date.now();
    
    // Check if we're in cooldown period
    if (now - this._lastGameStartTime < this._gameStartCooldown) {
      console.debug('[ScenarioSelectScene] Game start throttled - too soon after last attempt');
      return;
    }
    
    this._lastGameStartTime = now;
    
    console.debug('[ScenarioSelectScene][startGame] Starting game with mode:', this.mode, 'data:', data);
    
    try {
      if (this.mode === 'local') {
        const p1Char = data?.p1Char || this.validateCharacterKey(this.selected.p1);
        const p2Char = data?.p2Char || this.validateCharacterKey(this.selected.p2);
        const scenario = data?.scenario || SCENARIOS[this.selectedScenario].key;
        
        console.debug('[ScenarioSelectScene][startGame] Starting local game with:', {
          p1: p1Char,
          p2: p2Char,
          scenario: scenario
        });
        
        this.scene.start('KidsFightScene', {
          gameMode: 'single',
          p1: p1Char,
          p2: p2Char,
          selected: { p1: p1Char, p2: p2Char },
          scenario: scenario,
          selectedScenario: scenario
        });
      } else if (this.mode === 'online') {
        // For online mode, set gameStarted flag and send game_start message if host
        this.gameStarted = true;
        
        const p1Char = data?.p1Char || this.validateCharacterKey(this.selected.p1);
        const p2Char = data?.p2Char || this.validateCharacterKey(this.selected.p2);
        const scenario = data?.scenario || SCENARIOS[this.selectedScenario].key;
        const isHost = data?.isHost ?? this.isHost;
        const roomCode = data?.roomCode || this.roomCode;
        const playerIndex = data?.playerIndex ?? (isHost ? 0 : 1);
        
        console.debug('[ScenarioSelectScene][startGame] Starting online game with:', {
          isHost,
          hostReady: this.hostReady,
          guestReady: this.guestReady,
          p1: p1Char,
          p2: p2Char,
          scenario: scenario,
          roomCode: roomCode,
          playerIndex: playerIndex
        });
        
        // Transition to game with the provided or current data
        this._transitionToGame({
          scenario: scenario,
          roomCode: roomCode,
          isHost: isHost,
          playerIndex: playerIndex
        }, p1Char, p2Char);
      }
    } catch (e) {
      console.error('[ScenarioSelectScene][startGame] Error starting game:', e);
      // Reset state to allow retry
      this.gameStarted = false;
      this._lastGameStartTime = 0;
    }
  }

  private validateCharacterKey(key: string): string {
    const validKeys = ['player1', 'player2', 'bento', 'davir', 'jose', 'davis', 'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'];
    
    // Clean up the key by removing '_select' suffix
    const cleanKey = key.replace('_select', '');
    
    // If key is not valid, return player1 or player2
    if (!validKeys.includes(cleanKey)) {
      console.warn(`[ScenarioSelectScene] Invalid character key: ${key}, using 'player1' instead`);
      return 'player1';
    }
    
    return cleanKey;
  }

  private updateLayout(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Update positions of UI elements based on new size
    if (this.preview) {
      this.preview.setPosition(width / 2, height / 2 - 50);
      this.rescalePreview();
    }

    if (this.prevButton) {
      this.prevButton.setPosition(width * 0.2, height / 2);
    }

    if (this.nextButton) {
      this.nextButton.setPosition(width * 0.8, height / 2);
    }

    if (this.backButton) {
      this.backButton.setPosition(100, height - 80);
    }

    if (this.readyButton) {
      this.readyButton.setPosition(width - 100, height - 80);
    }
  }

  private updateReadyUI(): void {
    // Clear any existing status text
    this.children.each((child: Phaser.GameObjects.GameObject) => {
      if (child.name === 'statusText') {
        child.destroy();
      }
    });

    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const readyColor = '#00ff00';
    const notReadyColor = '#ff4444';
    const waitingColor = '#ffcc00';
    const fontSize = '20px';
    const fontFamily = 'monospace';
    
    // Host status
    const hostLabel = this.isHost ? 'VOCÊ' : 'ANFITRIÃO';
    const hostStatus = this.hostReady ? 'PRONTO' : 'NÃO PRONTO';
    const hostColor = this.hostReady ? readyColor : notReadyColor;
    
    this.add.text(centerX, 40, `${hostLabel}: `, { 
      fontSize, 
      fontFamily,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setName('statusText');
    
    this.add.text(centerX + 80, 40, hostStatus, { 
      fontSize, 
      fontFamily,
      color: hostColor,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setName('statusText');
    
    // Guest status
    const guestLabel = this.isHost ? 'CONVIDADO' : 'VOCÊ';
    const guestStatus = this.guestReady ? 'PRONTO' : 'NÃO PRONTO';
    const guestColor = this.guestReady ? readyColor : notReadyColor;
    
    this.add.text(centerX, 80, `${guestLabel}: `, { 
      fontSize, 
      fontFamily,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setName('statusText');
    
    this.add.text(centerX + 80, 80, guestStatus, { 
      fontSize, 
      fontFamily,
      color: guestColor,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setName('statusText');
    
    // Update waiting text if it exists
    if (this.waitingText) {
      const bothReady = this.hostReady && this.guestReady;
      this.waitingText.setVisible(!bothReady);
      
      if (bothReady) {
        this.waitingText.setText('Starting game...');
        this.waitingText.setColor('#00ff00');
      } else if (this.isHost) {
        this.waitingText.setText('Waiting for guest to be ready...');
        this.waitingText.setColor(this.guestReady ? '#00ff00' : '#ff9900');
      } else {
        this.waitingText.setText('Waiting for host to be ready...');
        this.waitingText.setColor(this.hostReady ? '#00ff00' : '#ff9900');
      }
    }
  }

  shutdown() {
    console.log('[ScenarioSelectScene] shutdown called');
    
    // Clean up WebSocket handler when leaving the scene
    if (this.wsManager) {
      if (typeof this.wsManager.setMessageCallback === 'function') {
        this.wsManager.setMessageCallback(null);
      }
      
      // Notify server that we're leaving the scenario select scene
      if (this.mode === 'online' && this.roomCode) {
        this.wsManager.send({
          type: 'scene_change',
          scene: 'leaving_scenario_select',
          roomCode: this.roomCode,
          isHost: this.isHost
        });
      }
    }
    
    // Reset state in case scene is reused
    this.gameStarted = false;
    this.hostReady = false;
    this.guestReady = false;
    this._lastGameStartTime = 0;
    this._processedMessageIds.clear(); // Clear processed message IDs
    
    // Remove any event listeners
    this.scale.off('resize', this.updateLayout, this);
    
    // Clear any timeouts that might be pending
    // This is a no-op if no timeouts are set, but prevents memory leaks
    clearTimeout((this as any)._timeoutId);
    
    console.debug('[ScenarioSelectScene] Scene shutdown completed');
  }
}

export default ScenarioSelectScene;
