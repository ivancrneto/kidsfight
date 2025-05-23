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
    this.mode = data.mode || 'local';
    this.selected = data.selected || { p1: 'player1', p2: 'player2' };
    this.roomCode = data.roomCode || null;
    this.isHost = data.isHost || false;
  }

  preload(): void {
    SCENARIOS.forEach(s => {
      this.load.image(s.key, s.img);
    });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
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

    // Button click handlers
    this.readyButton.on('pointerdown', () => this.startGame());
    this.backButton.on('pointerdown', () => this.goBack());
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
}

export default ScenarioSelectScene;
