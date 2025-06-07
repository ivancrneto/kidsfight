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

export const SCENARIOS: Scenario[] = [
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
    this.roomCode = data.roomCode || null;
    this.isHost = data.isHost || false;
    
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
      this.waitingText = this.add.text(width/2, height*0.85, 'Aguardando o anfitrião escolher o cenário...', {
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
      this._wsMessageHandler = (event: MessageEvent): void => {
        try {
          // Handle the data which might be already parsed by WebSocketManager
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.debug('[ScenarioSelectScene][WebSocket] Received message:', data);
          
          if (data.type === 'scenario_selected' && !this.isHost) {
            // Update the preview to match the host's selection
            console.debug('[ScenarioSelectScene][WebSocket] Guest received scenario selection from host:', data.scenario);
            
            // Find the scenario index
            const scenarioIndex = SCENARIOS.findIndex(s => s.key === data.scenario);
            if (scenarioIndex !== -1) {
              this.selectedScenario = scenarioIndex;
              this.preview.setTexture(SCENARIOS[this.selectedScenario].key);
              this.rescalePreview();
              console.debug('[ScenarioSelectScene][WebSocket] Guest updated scenario preview to:', data.scenario);
            }
          } else if (data.type === 'player_ready') {
            console.debug('[ScenarioSelectScene][WebSocket] player_ready received:', data);
            console.debug('[ScenarioSelectScene][WebSocket] Readiness BEFORE assignment:', {
              isHost: this.isHost,
              hostReady: this.hostReady,
              guestReady: this.guestReady,
              gameStarted: this.gameStarted
            });
            if (data.player === 'host') {
              this.hostReady = true;
              console.debug('[ScenarioSelectScene][WebSocket] Marked host as ready');
            } else if (data.player === 'guest') {
              this.guestReady = true;
              console.debug('[ScenarioSelectScene][WebSocket] Marked guest as ready');
            }
            this.updateReadyUI();
            console.debug('[ScenarioSelectScene][WebSocket] Readiness AFTER assignment:', {
              isHost: this.isHost,
              hostReady: this.hostReady,
              guestReady: this.guestReady,
              gameStarted: this.gameStarted
            });
            
            // Debug: print readiness state before checking if we should start game
            console.debug('[ScenarioSelectScene][WebSocket] Checking if should start game:', {
              isHost: this.isHost,
              hostReady: this.hostReady,
              guestReady: this.guestReady,
              gameStarted: this.gameStarted,
              condition: this.isHost && this.hostReady && this.guestReady && !this.gameStarted
            });
            
            if (this.isHost && this.hostReady && this.guestReady && !this.gameStarted) {
              console.debug('[ScenarioSelectScene][WebSocket] Readiness before starting game:', {
                isHost: this.isHost,
                hostReady: this.hostReady,
                guestReady: this.guestReady,
                gameStarted: this.gameStarted
              });
              this.gameStarted = true;
              console.debug('[ScenarioSelectScene][WebSocket] Both ready! Host sending game_start.', {
                hostReady: this.hostReady,
                guestReady: this.guestReady,
                gameStarted: this.gameStarted
              });
              const gameStartMsg = {
                type: 'game_start',
                scenario: SCENARIOS[this.selectedScenario].key,
                roomCode: this.roomCode,
                p1Char: this.selected.p1.replace('_select', ''),
                p2Char: this.selected.p2.replace('_select', ''),
                isHost: true
              };
              this.wsManager.send(gameStartMsg);
              const p1Clean = this.selected.p1.replace('_select', '');
              const p2Clean = this.selected.p2.replace('_select', '');
              console.log('[ScenarioSelectScene] Starting KidsFightScene with characters:', { p1: p1Clean, p2: p2Clean });
              this.scene.start('KidsFightScene', {
                gameMode: 'online',
                mode: this.mode,
                p1: p1Clean,
                p2: p2Clean,
                selected: { p1: p1Clean, p2: p2Clean },
                scenario: SCENARIOS[this.selectedScenario].key,
                selectedScenario: SCENARIOS[this.selectedScenario].key,
                roomCode: this.roomCode,
                isHost: true,
                wsManager: this.wsManager
              });
            }
          } else if (data.type === 'game_start' || data.type === 'gameStart') {
            console.debug('[ScenarioSelectScene][WebSocket] game_start received, state BEFORE processing:', {
              data,
              isHost: this.isHost,
              hostReady: this.hostReady,
              guestReady: this.guestReady,
              gameStarted: this.gameStarted,
              roomCode: this.roomCode
            });
            
            // Always set gameStarted to true when we receive game_start
            this.gameStarted = true;
            console.debug('[ScenarioSelectScene][WebSocket] gameStarted set to true, starting game scene');
            
            // Always use the character keys from the server message
            // Note: We always process game_start messages regardless of gameStarted flag
            // This ensures the host doesn't get stuck on the scenario selection screen
            console.debug('[ScenarioSelectScene][WebSocket] Transitioning to KidsFightScene with data:', data);
            this.scene.start('KidsFightScene', {
              gameMode: 'online',
              mode: this.mode,
              p1: data.p1Char,
              p2: data.p2Char,
              selected: { p1: data.p1Char, p2: data.p2Char },
              scenario: data.scenario,
              selectedScenario: data.scenario,
              roomCode: data.roomCode,
              isHost: data.isHost,
              playerIndex: data.playerIndex,
              wsManager: this.wsManager
            });
          }
        } catch (e) {
          console.error('[ScenarioSelectScene][WebSocket] Error parsing incoming message:', e, event);
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
        } else if (this.mode === 'online' && this.wsManager) {
          // Online mode - send ready message
          const msg = {
            type: 'player_ready',
            player: this.isHost ? 'host' : 'guest',
            scenario: SCENARIOS[this.selectedScenario].key
          };
          
          console.debug('[ScenarioSelectScene][ReadyButton] Sending player_ready message', msg);
          this.wsManager.send(msg);

          // Ensure the host simulates receiving its own player_ready message
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
        this.readyButton.disableInteractive();
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
    
  private startGame(): void {
    console.debug('[ScenarioSelectScene][startGame] Starting game with mode:', this.mode);
    
    try {
      if (this.mode === 'local') {
        console.debug('[ScenarioSelectScene][startGame] Starting local game with:', {
          p1: this.selected.p1,
          p2: this.selected.p2,
          scenario: SCENARIOS[this.selectedScenario].key
        });
        
        this.scene.start('KidsFightScene', {
          gameMode: 'single', // Changed from 'local' to 'single' to match the expected value in KidsFightScene
          p1: this.selected.p1,
          p2: this.selected.p2,
          selected: { p1: this.selected.p1, p2: this.selected.p2 },
          scenario: SCENARIOS[this.selectedScenario].key,
          selectedScenario: SCENARIOS[this.selectedScenario].key // Adding this as a fallback
        });
      } else if (this.mode === 'online') {
        // For online mode, set gameStarted flag and send game_start message if host
        this.gameStarted = true;
        
        console.debug('[ScenarioSelectScene][startGame] Starting online game with:', {
          isHost: this.isHost,
          hostReady: this.hostReady,
          guestReady: this.guestReady,
          p1: this.selected.p1,
          p2: this.selected.p2,
          scenario: SCENARIOS[this.selectedScenario].key
        });
        
        if (this.isHost) {
          const msg = {
            type: 'game_start',
            scenario: SCENARIOS[this.selectedScenario].key,
            p1Char: this.selected.p1,
            p2Char: this.selected.p2,
            roomCode: this.roomCode,
            isHost: true
          };
          
          console.debug('[ScenarioSelectScene][startGame] Host sending game_start message:', msg);
          this.wsManager.send(msg);
        }
        
        this.scene.start('KidsFightScene', {
          gameMode: 'online',
          mode: this.mode,
          p1: this.selected.p1,
          p2: this.selected.p2,
          selected: { p1: this.selected.p1, p2: this.selected.p2 },
          scenario: SCENARIOS[this.selectedScenario].key,
          selectedScenario: SCENARIOS[this.selectedScenario].key,
          roomCode: this.roomCode,
          isHost: this.isHost,
          wsManager: this.wsManager
        });
      }
    } catch (e) {
      console.error('[ScenarioSelectScene][startGame] Error starting game:', e);
    }
    
    // Set the WebSocket message handler
    this.wsManager.setMessageCallback(this._wsMessageHandler);
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
    let hostTxt = this.isHost ? 'YOU' : 'HOST';
    let guestTxt = this.isHost ? 'GUEST' : 'YOU';
    
    let txt = this.add.text(this.cameras.main.width / 2, 50, `${hostTxt}: ${this.hostReady ? 'READY' : 'NOT READY'}`, { fontSize: '18px', color: '#fff' });
    txt.setOrigin(0.5);
    txt = this.add.text(this.cameras.main.width / 2, 80, `${guestTxt}: ${this.guestReady ? 'READY' : 'NOT READY'}`, { fontSize: '18px', color: '#fff' });
    txt.setOrigin(0.5);
    
    if (this.waitingText) {
      this.waitingText.setVisible(this.hostReady || this.guestReady);
      this.waitingText.setText(`Waiting for ${!this.hostReady ? 'host' : !this.guestReady ? 'guest' : 'game to start'}...`);
    }
    
    // If both players are ready, update the UI
    if (this.hostReady && this.guestReady && this.readyButton) {
      this.readyButton.setText('STARTING...');
      this.readyButton.setTint(0x00ff00);
    }
  }
}

export default ScenarioSelectScene;
