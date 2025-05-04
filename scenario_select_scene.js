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

    // If player choices are passed, store them
    this.p1 = this.scene.settings.data && this.scene.settings.data.p1 !== undefined ? this.scene.settings.data.p1 : 0;
    this.p2 = this.scene.settings.data && this.scene.settings.data.p2 !== undefined ? this.scene.settings.data.p2 : 1;

    // Show scenario preview
    this.preview = this.add.image(width/2, height/2, SCENARIOS[this.selectedScenario].key)
      .setOrigin(0.5)
      .setAlpha(0.95);
    // Match scaling logic to KidsFightScene (contain, never crop)
    this.rescalePreview();

    // Scenario name
    this.label = this.add.text(width/2, height/2 + 180, SCENARIOS[this.selectedScenario].name, {
      fontSize: '28px', fill: '#fff', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.2)'
    }).setOrigin(0.5);

    // Left/right arrows
    this.leftBtn = this.add.text(width/2 - 160, height/2, '<', {
      fontSize: '64px', fill: '#fff', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.15)'
    }).setOrigin(0.5).setInteractive();
    this.rightBtn = this.add.text(width/2 + 160, height/2, '>', {
      fontSize: '64px', fill: '#fff', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.15)'
    }).setOrigin(0.5).setInteractive();

    this.leftBtn.on('pointerdown', () => this.changeScenario(-1));
    this.rightBtn.on('pointerdown', () => this.changeScenario(1));

    // Confirm button
    this.confirmBtn = this.add.text(width/2, height - 100, 'CONFIRMAR', {
      fontSize: '32px', fill: '#fff', fontFamily: 'monospace', backgroundColor: '#44aaff', padding: {left:32,right:32,top:12,bottom:12}, borderRadius: 18
    }).setOrigin(0.5).setInteractive();
    this.confirmBtn.on('pointerdown', () => {
      this.scene.start('KidsFightScene', {
        p1: this.p1,
        p2: this.p2,
        scenario: SCENARIOS[this.selectedScenario].key
      });
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
