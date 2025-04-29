class PlayerSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerSelectScene' });
    this.selected = [null, null];
  }

  preload() {
    // Explicitly load assets needed for the menu
    this.load.image('player1_raw', 'sprites-bento3.png');
    this.load.spritesheet('player2', 'sprites-davir3.png', { frameWidth: 476, frameHeight: 512 });
    this.load.image('scenario1', 'scenario1.png');
  }

  create() {
    this.add.text(400, 60, 'Choose Your Fighters', { fontSize: '32px', color: '#fff', fontFamily: 'monospace' }).setOrigin(0.5);

    // Player 1 selection
    this.add.text(200, 120, 'Player 1', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
    // Use setCrop to crop the head region from the original textures
    // Player 1: sprites-bento2.png, crop top-center 64x64 from first frame (x: 70, y: 0)
    // Player 2: sprites-davir2.png, crop top-center 64x64 from first frame (x: 206, y: 0)
    // Add debug rectangles behind images
    this.add.rectangle(170, 200, 68, 68, 0xff0000, 0.2).setOrigin(0.5);
    this.add.rectangle(270, 200, 68, 68, 0x00ff00, 0.2).setOrigin(0.5);
    this.add.rectangle(570, 200, 68, 68, 0x0000ff, 0.2).setOrigin(0.5);
    this.add.rectangle(670, 200, 68, 68, 0xffff00, 0.2).setOrigin(0.5);

    // For player2 (spritesheet), specify frame 0
    // Crop to the top-center 64x64 region (for 400px-wide frames)
    const cropX = 168; // (400 - 64) / 2
    const p1Head = this.add.image(170, 200, 'player1_raw').setDisplaySize(64, 64).setInteractive().setCrop(cropX, 0, 64, 64);
    const p2Head = this.add.image(270, 200, 'player2', 0).setDisplaySize(64, 64).setInteractive().setCrop(cropX, 0, 64, 64);
    const p1Head2 = this.add.image(570, 200, 'player1_raw').setDisplaySize(64, 64).setInteractive().setCrop(cropX, 0, 64, 64);
    const p2Head2 = this.add.image(670, 200, 'player2', 0).setDisplaySize(64, 64).setInteractive().setCrop(cropX, 0, 64, 64);
    // Add white borders for clarity
    this.add.rectangle(170, 200, 64, 64).setStrokeStyle(2, 0xffffff).setOrigin(0.5);
    this.add.rectangle(270, 200, 64, 64).setStrokeStyle(2, 0xffffff).setOrigin(0.5);
    this.add.rectangle(570, 200, 64, 64).setStrokeStyle(2, 0xffffff).setOrigin(0.5);
    this.add.rectangle(670, 200, 64, 64).setStrokeStyle(2, 0xffffff).setOrigin(0.5);
    this.p1Btns = [p1Head, p2Head];
    this.p2Btns = [p1Head2, p2Head2];
    console.log('Created player1 head image:', p1Head);
    console.log('Created player2 head image:', p2Head);
    console.log('Created player1 head image (P2):', p1Head2);
    console.log('Created player2 head image (P2):', p2Head2);
    // Player 2 selection
    this.add.text(600, 120, 'Player 2', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);

    this.p1Btns.forEach((btn, idx) => {
      btn.on('pointerdown', () => {
        this.selected[0] = idx;
        this.p1Btns.forEach((b, i) => b.setAlpha(i === idx ? 1 : 0.5));
        this.updateStartBtn();
      });
    });
    this.p2Btns.forEach((btn, idx) => {
      btn.on('pointerdown', () => {
        this.selected[1] = idx;
        this.p2Btns.forEach((b, i) => b.setAlpha(i === idx ? 1 : 0.5));
        this.updateStartBtn();
      });
    });

    this.startBtn = this.add.text(400, 350, 'START', { fontSize: '32px', color: '#fff', backgroundColor: '#44aaff', padding: { left: 24, right: 24, top: 8, bottom: 8 } })
      .setOrigin(0.5)
      .setInteractive()
      .setVisible(false);
    this.startBtn.on('pointerdown', () => {
      if (this.selected[0] !== null && this.selected[1] !== null) {
        this.scene.start('KidsFightScene', {
          p1: this.selected[0],
          p2: this.selected[1]
        });
      }
    });
  }

  updateStartBtn() {
    this.startBtn.setVisible(this.selected[0] !== null && this.selected[1] !== null);
  }
}

export default PlayerSelectScene;
