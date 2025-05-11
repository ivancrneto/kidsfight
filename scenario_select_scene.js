import Phaser from 'phaser';
import scenario1Img from './scenario1.png';
import scenario2Img from './scenario2.png';

const SCENARIOS = [
  { key: 'scenario1', name: 'Dona Isa', img: scenario1Img },
  { key: 'scenario2', name: 'Acácia', img: scenario2Img },
  // Add more scenarios here as needed
];

class ScenarioSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ScenarioSelectScene' });
    this.selectedScenario = 0;
  }

  preload() {
    SCENARIOS.forEach(s => {
      this.load.image(s.key, s.img);
    });
  }

  create() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    this.add.text(width/2, 80, 'ESCOLHA O CENÁRIO', {
      fontSize: '32px', fill: '#fff', fontStyle: 'bold', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Store data from the calling scene
    this.p1 = this.scene.settings.data && this.scene.settings.data.p1 !== undefined ? this.scene.settings.data.p1 : 0;
    this.p2 = this.scene.settings.data && this.scene.settings.data.p2 !== undefined ? this.scene.settings.data.p2 : 1;
    this.fromPlayerSelect = this.scene.settings.data && this.scene.settings.data.fromPlayerSelect;
    this.onlineMode = this.scene.settings.data && this.scene.settings.data.onlineMode;
    
    console.log('[ScenarioSelectScene] Created with data:', {
      p1: this.p1,
      p2: this.p2,
      fromPlayerSelect: this.fromPlayerSelect,
      onlineMode: this.onlineMode
    });

    // Show scenario preview
    this.preview = this.add.image(width/2, height/2, SCENARIOS[this.selectedScenario].key)
      .setOrigin(0.5)
      .setAlpha(0.95);
    // Match scaling logic to KidsFightScene (contain, never crop)
    this.rescalePreview();



    // Left/right arrows with scenario name in between
    this.leftBtn = this.add.text(width/2 - 200, height/2, '<', {
      fontSize: '64px', fill: '#fff', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.15)'
    }).setOrigin(0.5).setInteractive();
    
    this.label = this.add.text(width/2, height/2, SCENARIOS[this.selectedScenario].name, {
      fontSize: '28px', fill: '#fff', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.2)'
    }).setOrigin(0.5);
    
    this.rightBtn = this.add.text(width/2 + 200, height/2, '>', {
      fontSize: '64px', fill: '#fff', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.15)'
    }).setOrigin(0.5).setInteractive();

    this.leftBtn.on('pointerdown', () => this.changeScenario(-1));
    this.rightBtn.on('pointerdown', () => this.changeScenario(1));

    // Create a more visible confirm button with a background rectangle
    const confirmBtnBg = this.add.rectangle(width/2, height - 100, 250, 70, 0x44aaff)
      .setStrokeStyle(4, 0x000000)
      .setInteractive({ useHandCursor: true });
    
    this.confirmBtn = this.add.text(width/2, height - 100, 'CONFIRMAR', {
      fontSize: '32px', 
      fill: '#fff', 
      fontFamily: 'monospace',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add hover effects
    confirmBtnBg.on('pointerover', () => {
      confirmBtnBg.setFillStyle(0x55bbff); // Lighter blue on hover
    });
    
    confirmBtnBg.on('pointerout', () => {
      confirmBtnBg.setFillStyle(0x44aaff); // Back to original color
    });
    
    // Handle click
    confirmBtnBg.on('pointerdown', () => {
      confirmBtnBg.setFillStyle(0x3377dd); // Darker blue when clicked
      
      // If coming from PlayerSelectScene in online mode, return to it with the selected scenario
      if (this.fromPlayerSelect) {
        const selectedScenarioKey = SCENARIOS[this.selectedScenario].key;
        console.log('[ScenarioSelectScene] Returning to PlayerSelectScene with scenario:', selectedScenarioKey);
        
        // Create the data to return to PlayerSelectScene
        const returnData = {
          scenario: selectedScenarioKey,
          type: 'scenario_selected'
        };
        
        console.log('[ScenarioSelectScene] Resuming PlayerSelectScene with data:', returnData);
        
        // Resume the PlayerSelectScene with the scenario data
        this.scene.resume('PlayerSelectScene', returnData);
        this.scene.stop();
      } else {
        // Normal flow - start the game directly
        this.scene.start('KidsFightScene', {
          p1: this.p1,
          p2: this.p2,
          scenario: SCENARIOS[this.selectedScenario].key
        });
      }
    });

    // Keyboard navigation
    this.input.keyboard.on('keydown-LEFT', () => this.changeScenario(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.changeScenario(1));
    this.input.keyboard.on('keydown-ENTER', () => this.confirmBtn.emit('pointerdown'));
  }

  changeScenario(dir) {
    this.selectedScenario = (this.selectedScenario + dir + SCENARIOS.length) % SCENARIOS.length;
    this.preview.setTexture(SCENARIOS[this.selectedScenario].key);
    this.rescalePreview();
    this.label.setText(SCENARIOS[this.selectedScenario].name);
  }

  rescalePreview() {
    // Squeeze/stretch scenario preview to fill the entire screen (ignore aspect ratio)
    const { width, height } = this.cameras.main;
    const tex = this.textures.get(SCENARIOS[this.selectedScenario].key);
    if (!tex) return;
    const img = tex.getSourceImage();
    if (!img) return;
    this.preview.displayWidth = width * 0.8; // 80% of screen width
    this.preview.displayHeight = height * 0.8; // 80% of screen height
  }
}

export default ScenarioSelectScene;
