import Phaser from 'phaser';

class RotatePromptScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RotatePromptScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 0.95);
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
      console.log('[RotatePromptScene] Starting PlayerSelectScene');
      this.scene.start('PlayerSelectScene');
    }
  }
}

export default RotatePromptScene;
