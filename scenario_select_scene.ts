import Phaser from 'phaser';
import scenario1Img from './scenario1.png';
import scenario2Img from './scenario2.png';
import gameLogoImg from './android-chrome-192x192.png';

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

export const SCENARIOS: Scenario[] = [
  { key: 'scenario1', name: 'Dona Isa', img: scenario1Img },
  { key: 'scenario2', name: 'Acácia', img: scenario2Img },
  // Add more scenarios here as needed
];

class ScenarioSelectScene extends Phaser.Scene {
  private selectedScenario: number = 0; // Always an index into SCENARIOS
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
  private _gameStartCooldown: number = 1000; // 1 second cooldown between start attempts
  private _processedMessageIds: Set<string> = new Set();

  /**
   * Optional wsManager injection for testability
   */
  constructor(wsManagerInstance: any = null) {
    super({ key: 'ScenarioSelectScene' });
    this.selectedScenario = 0; // Default to 0, will be updated in init() for guests
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
    this.roomCode = data.roomCode || null;
    this.isHost = data.isHost || false;
    
    // For guests in online mode, don't reset selectedScenario - wait for host's selection
    if (this.mode === 'online' && !this.isHost) {
      // Keep current selectedScenario value, don't reset it
      console.debug('[ScenarioSelectScene] Guest mode - keeping current selectedScenario:', this.selectedScenario);
    } else {
      // For hosts and local mode, selectedScenario can be reset to 0 if needed
      this.selectedScenario = 0;
      console.debug('[ScenarioSelectScene] Host/Local mode - reset selectedScenario to 0');
    }
    
    // CRITICAL: Always initialize gameStarted to false when the scene starts
    this.gameStarted = false;
    this.hostReady = false;
    this.guestReady = false;
    
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

    // --- PATCH: Always re-send both character selections to server on entry (online mode) ---
    if (this.mode === 'online' && this.wsManager && typeof this.wsManager.send === 'function') {
      if (this.isHost) {
        // Host re-sends both player selections to ensure sync
        console.log('[ScenarioSelectScene] Host re-sending both character selections:', { 
          p1: this.selected.p1, 
          p2: this.selected.p2 
        });
        this.wsManager.send({
          type: 'player_selected',
          player: 'p1',
          character: this.selected.p1
        });
        setTimeout(() => {
          this.wsManager.send({
            type: 'player_selected',
            player: 'p2',
            character: this.selected.p2
          });
        }, 50);
      } else {
        // Guest only re-sends their own selection (p2) if it's not a default/invalid value
        if (this.selected.p2 && this.selected.p2 !== 'davir' && this.selected.p2 !== 'player2') {
          console.log('[ScenarioSelectScene] Guest re-sending p2 character selection:', { 
            p2: this.selected.p2 
          });
          this.wsManager.send({
            type: 'player_selected',
            player: 'p2',
            character: this.selected.p2
          });
        } else {
          console.log('[ScenarioSelectScene] Guest skipping p2 re-send - has default/invalid value:', { 
            p2: this.selected.p2 
          });
        }
      }
    }
  }

  preload(): void {
    this.load.image('gameLogo', gameLogoImg);
    SCENARIOS.forEach(s => {
      this.load.image(s.key, s.img);
    });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.hostReady = false;
    this.guestReady = false;
    this.gameStarted = false;

    // Add logo as a background, subtle watermark style
    const logoBg = this.add.image(width/2, height/2, 'gameLogo')
      .setOrigin(0.5)
      .setDisplaySize(width, height)
      .setAlpha(0.13)
      .setDepth(0);

    // Add background color rectangle above logo for contrast
    const bg = this.add.rectangle(width/2, height/2, width, height, 0x222222, 0.55).setDepth(1);

    // Add dark overlay
    this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7).setDepth(2);
    
    // Add title
    this.add.text(width/2, 80, 'ESCOLHA O CENÁRIO', {
      fontSize: '32px',
      color: '#fff',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(2);

    // Defensive: ensure selectedScenario is always a valid index
    if (typeof this.selectedScenario !== 'number' || this.selectedScenario < 0 || this.selectedScenario >= SCENARIOS.length) {
      console.warn('[ScenarioSelectScene] Invalid selectedScenario index, defaulting to 0:', this.selectedScenario);
      this.selectedScenario = 0;
    }
    // Show scenario preview
    this.preview = this.add.image(width/2, height/2, SCENARIOS[this.selectedScenario].key)
      .setOrigin(0.5)
      .setAlpha(0.95)
      .setDepth(2);
    
    // Match scaling logic to KidsFightScene (contain, never crop)
    this.rescalePreview();

    // Navigation buttons
    this.createNavigationButtons();

    // Action buttons
    this.createActionButtons();

    // Show waiting message for guest
    if (this.mode === 'online' && !this.isHost) {
      this.waitingText = this.add.text(width/2, height*0.85, 'Enfitrião escolhendo cenário...', {
        fontSize: '22px',
        color: '#fff',
        backgroundColor: '#222',
        padding: { x: 16, y: 8 },
        fontFamily: 'monospace'
      }).setOrigin(0.5).setDepth(2);
      
      // Disable scenario selection for guest
      if (this.prevButton) this.prevButton.disableInteractive();
      if (this.nextButton) this.nextButton.disableInteractive();
    }

    // Responsive layout update on resize
    this.scale.on('resize', this.updateLayout, this);

    // Send initial scenario selection to guest if host (with delay to ensure handlers are set up)
    if (this.mode === 'online' && this.isHost && this.wsManager && typeof this.wsManager.send === 'function') {
      setTimeout(() => {
        const scenarioMsg = {
          type: 'scenario_selected',
          scenario: SCENARIOS[this.selectedScenario].key,
          roomCode: this.roomCode
        };
        console.debug('[ScenarioSelectScene] Host sending initial scenario selection to guest:', scenarioMsg);
        this.wsManager.send(scenarioMsg);
      }, 100);
    }

    // Listen for ready and game_start messages if online
    if (this.mode === 'online' && this.wsManager && this.wsManager.setMessageCallback) {
      console.log('[ScenarioSelectScene] Setting WebSocket message handler for scenario scene');
      
      // Add a small delay to ensure the WebSocket handler is properly set up
      // before any ready messages can be sent/received
      setTimeout(() => {
        console.log('[ScenarioSelectScene] WebSocket handler setup delay completed');
      }, 100);
      
      this._wsMessageHandler = (event: MessageEvent): void => {
        try {
          // Handle the data which might be already parsed by WebSocketManager
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.debug('[ScenarioSelectScene][WebSocket] Received message:', data);
          
          if (data.type === 'scenario_selected' && !this.isHost) {
            // Update the preview to match the host's selection
            console.log('[ScenarioSelectScene][WebSocket] *** GUEST RECEIVED SCENARIO SELECTION ***');
            console.log('[ScenarioSelectScene][WebSocket] Current selectedScenario:', this.selectedScenario);
            console.log('[ScenarioSelectScene][WebSocket] Host selected scenario:', data.scenario);
            
            // Find the index of the scenario by key
            const scenarioIndex = SCENARIOS.findIndex(s => s.key === data.scenario);
            if (scenarioIndex !== -1) {
              this.selectedScenario = scenarioIndex;
              console.log('[ScenarioSelectScene][WebSocket] ✅ Guest updated scenario preview to:', data.scenario, 'index:', scenarioIndex);
              this.preview.setTexture(data.scenario);
              this.rescalePreview();
              
              // Update waiting text to show which scenario was selected
              if (this.waitingText) {
                const scenarioName = SCENARIOS[scenarioIndex].name;
                this.waitingText.setText(`Cenário selecionado: ${scenarioName}`);
                this.waitingText.setStyle({ color: '#00FF00' });
              }
            } else {
              console.error('[ScenarioSelectScene][WebSocket] ❌ Invalid scenario key received:', data.scenario);
            }
          } else if (data.type === 'player_ready') {
            console.log('[ScenarioSelectScene][WebSocket] *** PLAYER_READY MESSAGE RECEIVED ***');
            console.log('[ScenarioSelectScene][WebSocket] Message data:', data);
            console.log('[ScenarioSelectScene][WebSocket] Current scene state:', {
              isHost: this.isHost, 
              hostReady: this.hostReady, 
              guestReady: this.guestReady,
              gameStarted: this.gameStarted,
              roomCode: this.roomCode
            });
            
            if (data.player === 'host') {
              this.hostReady = true;
              console.log('[ScenarioSelectScene][WebSocket] ✅ HOST marked as ready');
            } else if (data.player === 'guest') {
              this.guestReady = true;
              console.log('[ScenarioSelectScene][WebSocket] ✅ GUEST marked as ready');
              
              // Show notification that guest is ready if we're the host
              if (this.isHost && this.waitingText) {
                this.waitingText.setText('Convidado está pronto!');
                this.waitingText.setStyle({ color: '#00FF00' });
              }
            }
            
            console.log('[ScenarioSelectScene][WebSocket] Updated readiness state:', {
              isHost: this.isHost, 
              hostReady: this.hostReady, 
              guestReady: this.guestReady,
              gameStarted: this.gameStarted
            });
            
            this.updateReadyUI();
            
            // Check if both players are ready and we should start the game
            const shouldStartGame = this.hostReady && this.guestReady && !this.gameStarted;
            console.log('[ScenarioSelectScene][WebSocket] Should start game?', {
              hostReady: this.hostReady, 
              guestReady: this.guestReady,
              gameStarted: this.gameStarted,
              shouldStart: shouldStartGame,
              isHost: this.isHost
            });
            
            if (shouldStartGame && this.isHost) {
              console.log('[ScenarioSelectScene][WebSocket] 🚀 BOTH PLAYERS READY - HOST STARTING GAME');
              this.startGame();
            } else if (shouldStartGame && !this.isHost) {
              console.log('[ScenarioSelectScene][WebSocket] ⏳ Both players ready but guest waiting for host to start');
            } else {
              console.log('[ScenarioSelectScene][WebSocket] ⏱️ Waiting for more players to be ready');
            }
          } else if (data.type === 'player_selected') {
            // Handle character selection sync in online mode
            if (this.mode === 'online') {
              if (data.player === 'p1') {
                this.selected.p1 = data.character;
                console.debug('[ScenarioSelectScene][WebSocket] Host received host character selection:', data.character);
              } else if (data.player === 'p2' || data.player === 'guest') {
                this.selected.p2 = data.character;
                console.debug('[ScenarioSelectScene][WebSocket] Host received guest character selection:', data.character);
              }
            }
          } else if (data.type === 'game_start') {
            // Ignore duplicate game_start messages if we've already started
            if (this.gameStarted) {
              console.debug('[ScenarioSelectScene][WebSocket] Ignoring duplicate game_start message, game already started');
              return;
            }
            
            console.debug('[ScenarioSelectScene][WebSocket] game_start received:', data);
            
            // Always set gameStarted to true when we receive game_start
            this.gameStarted = true;
            
            // Ensure we have the correct scenario from the server
            const scenarioKey = data.scenario || 'scenario1';
            console.debug('[ScenarioSelectScene][WebSocket] Starting game with server-provided scenario:', scenarioKey);
            
            // Start the KidsFightScene with the data from the server message
            this._transitionToGame(data, data.p1Char, data.p2Char);
          }
        } catch (e) {
          console.error('[ScenarioSelectScene][WebSocket] Error processing message:', e);
        }
      };
      this.wsManager.setMessageCallback(this._wsMessageHandler);
    }

    // Responsive layout update on resize
    this.scale.on('resize', this.updateLayout, this);
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
      .setInteractive({ useHandCursor: true })
      .setDepth(2);

    // Next button
    this.nextButton = this.add.text(width * 0.8, height/2, '>', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(2);

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
      .setDepth(2)
      .on('pointerdown', () => {
        this.scene.start('PlayerSelectScene');
      });
    
    // Ready button (or Start in local mode)
    const buttonText = this.mode === 'local' ? 'COMEÇAR' : 'COMEÇAR';
    this.readyButton = this.add.text(width - 100, height - 80, buttonText, buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(2)
      .setPadding(20)
      .setBackgroundColor('#00AA00')
      .on('pointerdown', () => {
        if (this.mode === 'local') {
          this.startGame();
        } else if (this.mode === 'online' && this.wsManager) {
          // Online mode - send ready message
          const msg: any = {
            type: 'player_ready',
            player: this.isHost ? 'host' : 'guest'
          };
          if (this.isHost) {
            msg.scenario = SCENARIOS[this.selectedScenario].key;
          }
          console.log('[ScenarioSelectScene][ReadyButton] *** SENDING PLAYER_READY MESSAGE ***');
          console.log('[ScenarioSelectScene][ReadyButton] Message:', msg);
          console.log('[ScenarioSelectScene][ReadyButton] Current player role:', {
            isHost: this.isHost,
            player: this.isHost ? 'host' : 'guest',
            roomCode: this.roomCode,
            wsManager: !!this.wsManager,
            wsConnected: this.wsManager && typeof this.wsManager.isConnected === 'function' ? this.wsManager.isConnected() : 'unknown'
          });
          
          const sendSuccess = this.wsManager.send(msg);
          console.log('[ScenarioSelectScene][ReadyButton] Message send result:', sendSuccess);

          if (this.isHost) {
            console.debug('[ScenarioSelectScene][ReadyButton] Host simulating receiving own player_ready message');
            
            // Directly set host as ready to ensure it's set
            this.hostReady = true;
            console.debug('[ScenarioSelectScene][ReadyButton] Directly set hostReady=true');
            this.updateReadyUI();
            
            // Then simulate the message for full processing
            setTimeout(() => {
              try {
                // Direct call to our own handler to ensure it's processed
                if (this._wsMessageHandler) {
                  console.debug('[ScenarioSelectScene][ReadyButton] Calling _wsMessageHandler directly');
                  this._wsMessageHandler({ data: JSON.stringify(msg) } as MessageEvent);
                } else if (this.wsManager && this.wsManager._onMessage) {
                  console.debug('[ScenarioSelectScene][ReadyButton] Calling wsManager._onMessage');
                  this.wsManager._onMessage({ data: JSON.stringify(msg) });
                } else {
                  console.error('[ScenarioSelectScene][ReadyButton] No message handler available!');
                  
                  // If both players are ready but we couldn't simulate the message, force start
                  if (this.guestReady && !this.gameStarted) {
                    console.debug('[ScenarioSelectScene][ReadyButton] Both players ready but no handler, force starting game');
                    this.startGame();
                  }
                }
              } catch (e) {
                console.error('[ScenarioSelectScene][ReadyButton] Error simulating message:', e);
              }
            }, 50);
          }

          // Update button text to show waiting
          this.readyButton.setText('AGUARDANDO...');
          this.readyButton.setTint(0x888888);
          this.readyButton.setBackgroundColor('#888888');
          this.readyButton.disableInteractive();
        }
      }
    );
  
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
    
  private startGame(): void {
    console.debug('[ScenarioSelectScene][startGame] Starting game with mode:', this.mode);
    
    const now = Date.now();
    
    // Check if we're in cooldown period
    if (now - this._lastGameStartTime < this._gameStartCooldown) {
      console.debug('[ScenarioSelectScene] Game start throttled - too soon after last attempt');
      return;
    }
    
    this._lastGameStartTime = now;
    
    try {
      // Defensive: ensure selectedScenario is always a valid index
      let scenarioKey = 'scenario1';
      if (typeof this.selectedScenario === 'number' && SCENARIOS[this.selectedScenario]) {
        scenarioKey = SCENARIOS[this.selectedScenario].key;
      } else {
        console.warn('[ScenarioSelectScene][startGame] Invalid selectedScenario index, defaulting to scenario1:', this.selectedScenario);
      }
      
      if (this.mode === 'local') {
        console.debug('[ScenarioSelectScene][startGame] Starting local game with:', {
          p1: this.selected.p1,
          p2: this.selected.p2,
          scenario: scenarioKey
        });
        
        this.scene.start('KidsFightScene', {
          gameMode: 'single', 
          p1: this.selected.p1,
          p2: this.selected.p2,
          selected: { p1: this.selected.p1, p2: this.selected.p2 },
          scenario: scenarioKey,
          selectedScenario: scenarioKey 
        });
      } else if (this.mode === 'online') {
        // For online mode, set gameStarted flag to prevent duplicate starts
        this.gameStarted = true;
        
        console.debug('[ScenarioSelectScene][startGame] Starting online game with:', {
          isHost: this.isHost,
          hostReady: this.hostReady,
          guestReady: this.guestReady,
          p1: this.selected.p1,
          p2: this.selected.p2,
          scenario: scenarioKey,
          selectedScenario: this.selectedScenario
        });
        
        if (this.isHost) {
          // Create game_start message with the correct scenario key
          const msg = {
            type: 'game_start',
            scenario: scenarioKey,
            p1Char: this.selected.p1,
            p2Char: this.selected.p2,
            roomCode: this.roomCode,
            isHost: true
          };
          
          console.debug('[ScenarioSelectScene][startGame] Host sending game_start message:', msg);
          this.wsManager.send(msg);
          setTimeout(() => {
            this._transitionToGame(msg, this.selected.p1, this.selected.p2);
          }, 100);
        } else {
          // Guest should never directly start the game - they should wait for the game_start message
          console.debug('[ScenarioSelectScene][startGame] Guest waiting for game_start message from host');
        }
      }
    } catch (e) {
      console.error('[ScenarioSelectScene][startGame] Error starting game:', e);
      // Reset state to allow retry
      this.gameStarted = false;
      this._lastGameStartTime = 0;
    }
  }
  
  // Helper method to transition to the game scene
  private _transitionToGame(data: any, p1Char: string, p2Char: string): void {
    try {
      // Defensive: ensure valid character keys for both players
      const validKeys = ['player1','player2','bento','davir','jose','davis','carol','roni','jacqueline','ivan','d_isa'];
      const isValid = (k: string) => typeof k === 'string' && validKeys.includes(k);
      // Try to use provided keys, else fallback to something valid
      let finalP1 = isValid(p1Char) ? p1Char : (data.p1Char || data.p1 || this.selected?.p1);
      let finalP2 = isValid(p2Char) ? p2Char : (data.p2Char || data.p2 || this.selected?.p2);
      if (!isValid(finalP1)) finalP1 = validKeys.find(k => this.textures.exists(k)) || 'player1';
      if (!isValid(finalP2) || finalP2 === finalP1) finalP2 = validKeys.find(k => this.textures.exists(k) && k !== finalP1) || 'player2';
      console.debug('[ScenarioSelectScene][_transitionToGame] Transitioning to KidsFightScene with:', { ...data, p1: finalP1, p2: finalP2 });
      this.scene.start('KidsFightScene', {
        ...data,
        gameMode: data.gameMode || data.mode || this.mode,
        mode: data.mode || data.gameMode || this.mode,
        isHost: typeof data.isHost === 'boolean' ? data.isHost : this.isHost,
        playerIndex: typeof data.playerIndex === 'number' ? data.playerIndex : (this.isHost ? 0 : 1),
        roomCode: data.roomCode || this.roomCode,
        p1: finalP1,
        p2: finalP2,
        selected: { p1: finalP1, p2: finalP2 },
        scenario: data.scenario || SCENARIOS[this.selectedScenario].key,
        selectedScenario: data.scenario || SCENARIOS[this.selectedScenario].key,
        wsManager: this.wsManager
      });
    } catch (e) {
      console.error('[ScenarioSelectScene][_transitionToGame] Error transitioning to game:', e);
      // Reset state to allow retry
      this.gameStarted = false;
      this._lastGameStartTime = 0;
    }
  }

  // Add a character key validation method
  private validateCharacterKey(key: string): string {
    const validKeys = ['player1', 'player2', 'bento', 'davir', 'jose', 'davis', 'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'];
    
    // Clean up the key by removing '_select' suffix if present
    const cleanKey = key.replace('_select', '');
    
    // If key is not valid, return player1 or player2
    if (!validKeys.includes(cleanKey)) {
      console.warn(`[ScenarioSelectScene] Invalid character key: ${key}, using 'player1' instead`);
      return 'player1';
    }
    
    return cleanKey;
  }

  // Add shutdown method to clean up resources
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
    
    console.debug('[ScenarioSelectScene] Scene shutdown completed');
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
    if (!this.readyButton || !this.readyButton.scene) return;
    
    if (this.mode === 'online') {
      if ((this.isHost && this.hostReady) || (!this.isHost && this.guestReady)) {
        // This player is ready
        this.readyButton.setText('CANCELAR');
        this.readyButton.setBackgroundColor('#AA0000');
        this.readyButton.disableInteractive();
      } else {
        // This player is not ready
        this.readyButton.setText('COMEÇAR');
        this.readyButton.setBackgroundColor('#00AA00');
        this.readyButton.setInteractive();
      }
      
      // If both players are ready, show waiting text
      if (this.hostReady && this.guestReady) {
        this.readyButton.setText('AGUARDANDO...');
        this.readyButton.setBackgroundColor('#888888');
        this.readyButton.disableInteractive();
      }
    }
  }
}

export default ScenarioSelectScene;
