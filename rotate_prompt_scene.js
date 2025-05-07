import Phaser from 'phaser';
import PlayerSelectScene from './player_select_scene.js';
import ScenarioSelectScene from './scenario_select_scene.js';
import KidsFightScene from './kidsfight_scene.js';

class RotatePromptScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RotatePromptScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 1);
    this.text = this.add.text(w/2, h/2, 'Por favor, gire seu dispositivo para o modo paisagem.', {
      fontSize: Math.max(24, Math.round(w * 0.045)) + 'px',
      color: '#fff',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: w * 0.8 }
    }).setOrigin(0.5);
    this.icon = this.add.image(w/2, h/2 - 80, 'rotate_icon').setOrigin(0.5).setScale(0.5);
  }

  resize() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.bg.setSize(w, h).setPosition(w/2, h/2);
    this.text.setFontSize(Math.max(24, Math.round(w * 0.045)) + 'px').setPosition(w/2, h/2);
    this.icon.setPosition(w/2, h/2 - 80);
  }

  update() {
    if (this.scale.orientation === Phaser.Scale.LANDSCAPE) {
      // Add the other scenes dynamically when in landscape mode
      if (!this.scenesAdded) {
        console.log('[RotatePromptScene] Adding game scenes');
        // Check if scenes exist before adding them
        if (!this.scene.get('PlayerSelectScene')) {
          this.scene.add('PlayerSelectScene', PlayerSelectScene, false);
        }
        if (!this.scene.get('ScenarioSelectScene')) {
          this.scene.add('ScenarioSelectScene', ScenarioSelectScene, false);
        }
        if (!this.scene.get('KidsFightScene')) {
          this.scene.add('KidsFightScene', KidsFightScene, false);
        }
        this.scenesAdded = true;
        console.log('[RotatePromptScene] Starting PlayerSelectScene');
        this.scene.stop();
        this.scene.start('PlayerSelectScene');
      }
    }
  }
}

export default RotatePromptScene;
