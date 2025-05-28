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
    
    // If wsManager is passed in data, use it
    if (data.wsManager) {
      console.log('[ScenarioSelectScene] Received wsManager from previous scene');
      this.wsManager = data.wsManager;
    } else {
      console.log('[ScenarioSelectScene] No wsManager received from previous scene');
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

    // Listen for ready and game_start messages if online
    if (this.mode === 'online' && this.wsManager && this.wsManager.setMessageCallback) {
      console.log('[ScenarioSelectScene] Setting WebSocket message handler for scenario scene');
      this._wsMessageHandler = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.debug('[ScenarioSelectScene][WebSocket] Incoming message:', data, {
            isHost: this.isHost,
            hostReady: this.hostReady,
            guestReady: this.guestReady,
            gameStarted: this.gameStarted,
            roomCode: this.roomCode
          });
          if (data.type === 'player_ready') {
            console.debug('[ScenarioSelectScene][WebSocket] player_ready received:', data);
            if (data.player === 'host') {
              this.hostReady = true;
              console.debug('[ScenarioSelectScene][WebSocket] Marked host as ready');
            }
            if (data.player === 'guest') {
              this.guestReady = true;
              console.debug('[ScenarioSelectScene][WebSocket] Marked guest as ready');
            }
            this.updateReadyUI();
            if (this.isHost && this.hostReady && this.guestReady && !this.gameStarted) {
              this.gameStarted = true;
              console.debug('[ScenarioSelectScene][WebSocket] Both ready! Host sending game_start.', {
                p1: this.selected.p1,
                p2: this.selected.p2,
                scenario: SCENARIOS[this.selectedScenario].key,
                roomCode: this.roomCode
              });
              const gameStartMsg = {
                type: 'game_start',
                p1Char: this.selected.p1,
                p2Char: this.selected.p2,
                scenario: SCENARIOS[this.selectedScenario].key,
                roomCode: this.roomCode
              };
              this.wsManager.send(gameStartMsg);
              this.scene.start('KidsFightScene', {
                gameMode: 'online',
                mode: this.mode,
                p1: this.selected.p1.replace('_select', ''),
                p2: this.selected.p2.replace('_select', ''),
                scenario: SCENARIOS[this.selectedScenario].key,
                roomCode: this.roomCode,
                isHost: true
              });
            }
          } else if ((data.type === 'game_start' || data.type === 'gameStart') && !this.gameStarted) {
            this.gameStarted = true;
            console.debug('[ScenarioSelectScene][WebSocket] game_start received:', data);
            this.scene.start('KidsFightScene', {
              gameMode: 'online',
              mode: this.mode,
              p1: data.p1Char.replace('_select', ''),
              p2: data.p2Char.replace('_select', ''),
              scenario: data.scenario,
              roomCode: data.roomCode,
              isHost: false
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
    const buttonStyle = {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#4a4a4a',
      padding: { x: 20, y: 10 }
    };

    // Ready button
    this.readyButton = this.add.text(width * 0.7, height * 0.85, 'Pronto!', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Back button
    this.backButton = this.add.text(width * 0.3, height * 0.85, 'Voltar', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Button hover effects
    [this.readyButton, this.backButton].forEach(button => {
      button.on('pointerover', () => button.setBackgroundColor('#666666'));
      button.on('pointerout', () => button.setBackgroundColor('#4a4a4a'));
    });

    // Online mode: ready button for both host and guest
    if (this.mode === 'online') {
      this.readyButton.on('pointerdown', () => {
        console.debug('[ScenarioSelectScene][ReadyButton] pointerdown fired', {
          isHost: this.isHost,
          hostReady: this.hostReady,
          guestReady: this.guestReady,
          roomCode: this.roomCode
        });
        if (this.isHost && this.hostReady) {
          console.debug('[ScenarioSelectScene][ReadyButton] Host already ready, ignoring click');
          return;
        }
        if (!this.isHost && this.guestReady) {
          console.debug('[ScenarioSelectScene][ReadyButton] Guest already ready, ignoring click');
          return;
        }
        if (this.wsManager) {
          const msg = {
            type: 'player_ready',
            player: this.isHost ? 'host' : 'guest',
            roomCode: this.roomCode
          };
          console.debug('[ScenarioSelectScene][ReadyButton] Sending player_ready message', msg);
          this.wsManager.send(msg);
          // Also send scenario_selected if host
          if (this.isHost) {
            const scenarioMsg = {
              type: 'scenario_selected',
              scenario: SCENARIOS[this.selectedScenario].key,
              roomCode: this.roomCode
            };
            this.wsManager.send(scenarioMsg);
            // Simulate host receiving their own player_ready message to trigger game_start
            if (this._wsMessageHandler) {
              this._wsMessageHandler({
                data: JSON.stringify({
                  type: 'player_ready',
                  player: 'host',
                  roomCode: this.roomCode
                })
              } as MessageEvent);
            }
          }
        } else {
          console.warn('[ScenarioSelectScene][ReadyButton] wsManager not available!');
        }
        if (this.isHost) {
          this.hostReady = true;
          console.debug('[ScenarioSelectScene][ReadyButton] Host marked self as ready');
        } else {
          this.guestReady = true;
          console.debug('[ScenarioSelectScene][ReadyButton] Guest marked self as ready');
        }
        this.updateReadyUI();
        this.readyButton.disableInteractive();
        // Host will check for both ready in message handler
      });
    } else if (this.mode === 'local') {
      this.readyButton.on('pointerdown', () => this.startGame());
      this.backButton.on('pointerdown', () => this.goBack());
    }
  }

  private changeScenario(direction: number): void {
    this.selectedScenario = (this.selectedScenario + direction + SCENARIOS.length) % SCENARIOS.length;
    this.preview.setTexture(SCENARIOS[this.selectedScenario].key);
    this.rescalePreview();
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
    this.scene.start('KidsFightScene', {
      mode: this.mode,
      p1: this.selected.p1,
      p2: this.selected.p2,
      selected: this.selected,
      scenario: SCENARIOS[this.selectedScenario].key,
      roomCode: this.roomCode,
      isHost: this.isHost
    });
  }

  private goBack(): void {
    this.scene.start('PlayerSelectScene', {
      mode: this.mode,
      roomCode: this.roomCode,
      isHost: this.isHost
    });
  }

  private updateLayout(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Update preview position and scale
    if (this.preview) {
      this.preview.setPosition(width/2, height/2);
      this.rescalePreview();
    }

    // Update navigation buttons
    if (this.prevButton) {
      this.prevButton.setPosition(width * 0.2, height/2);
    }
    if (this.nextButton) {
      this.nextButton.setPosition(width * 0.8, height/2);
    }

    // Update action buttons
    if (this.readyButton) {
      this.readyButton.setPosition(width * 0.7, height * 0.85);
    }
    if (this.backButton) {
      this.backButton.setPosition(width * 0.3, height * 0.85);
    }
  }

  private updateReadyUI(): void {
    if (this.mode !== 'online') return;
    let txt = '';
    if (this.isHost) {
      txt = `Você: ${this.hostReady ? 'Pronto' : 'Aguardando'} | Convidado: ${this.guestReady ? 'Pronto' : 'Aguardando'}`;
    } else {
      txt = `Você: ${this.guestReady ? 'Pronto' : 'Aguardando'} | Anfitrião: ${this.hostReady ? 'Pronto' : 'Aguardando'}`;
    }
    if (!this.waitingText) {
      const { width, height } = this.cameras.main;
      this.waitingText = this.add.text(width/2, height*0.92, txt, {
        fontSize: '22px',
        color: '#fff',
        backgroundColor: '#222',
        padding: { x: 16, y: 8 },
        fontFamily: 'monospace'
      }).setOrigin(0.5);
    } else {
      this.waitingText.setText(txt);
    }
  }
}

export default ScenarioSelectScene;
