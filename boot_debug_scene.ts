import Phaser from 'phaser';
import scenario1Img from './scenario1.png';
import scenario2Img from './scenario2.png';
import player1RawImg from './sprites-bento3.png';
import player2RawImg from './sprites-davir3.png';
import player3RawImg from './sprites-jose3.png';
import player4RawImg from './sprites-davis3.png';
import player5RawImg from './sprites-carol3.png';
import player6RawImg from './sprites-roni3.png';
import player7RawImg from './sprites-jacqueline3.png';
import player8RawImg from './sprites-ivan3.png';
import player9RawImg from './sprites-d_isa.png';

export default class BootDebugScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootDebugScene' });
  }

  preload() {
    // Preload all scenario and player assets needed for KidsFightScene
    this.load.image('scenario1', scenario1Img);
    this.load.image('scenario2', scenario2Img);
    // Load raw images for all players (not as spritesheets)
    this.load.image('bento_raw', player1RawImg);
    this.load.image('davir_raw', player2RawImg);
    this.load.image('jose_raw', player3RawImg);
    this.load.image('davis_raw', player4RawImg);
    this.load.image('carol_raw', player5RawImg);
    this.load.image('roni_raw', player6RawImg);
    this.load.image('jacqueline_raw', player7RawImg);
    this.load.image('ivan_raw', player8RawImg);
    this.load.image('d_isa_raw', player9RawImg);
    console.log('[KidsFightScene][preload] Loaded raw character keys:', [
      'bento_raw','davir_raw','jose_raw','davis_raw','carol_raw','roni_raw','jacqueline_raw','ivan_raw','d_isa_raw'
    ]);
  }

  create() {
    // Utility: Adds a custom spritesheet for a player with variable frame widths
    function addVariableWidthSpritesheet(scene, key, rawKey, frameWidths, frameHeight) {
      if (!scene.textures.exists(key)) {
        const playerTexture = scene.textures.get(rawKey).getSourceImage();
        scene.textures.addSpriteSheet(key, playerTexture, {
          frameWidth: frameWidths[0], // Not used, but required
          frameHeight: frameHeight,
          endFrame: frameWidths.length - 1
        });
        const tex = scene.textures.get(key);
        tex.frames = { __BASE: tex.frames['__BASE'] };
        let x = 0;
        for (let i = 0; i < frameWidths.length; i++) {
          tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
          x += frameWidths[i];
        }
      }
    }

    // Add variable-width spritesheets for each player
    addVariableWidthSpritesheet(this, 'bento', 'bento_raw', [415, 410, 420, 440, 440, 390, 520, 480], 512);
    addVariableWidthSpritesheet(this, 'davir', 'davir_raw', [415, 410, 420, 440, 440, 470, 520, 480], 512);
    addVariableWidthSpritesheet(this, 'jose', 'jose_raw', [415, 410, 420, 440, 440, 390, 530, 480], 512);
    addVariableWidthSpritesheet(this, 'davis', 'davis_raw', [415, 410, 420, 440, 440, 390, 520, 480], 512);
    addVariableWidthSpritesheet(this, 'carol', 'carol_raw', [415, 410, 420, 440, 440, 390, 520, 480], 512);
    addVariableWidthSpritesheet(this, 'roni', 'roni_raw', [415, 410, 420, 440, 440, 390, 520, 480], 512);
    addVariableWidthSpritesheet(this, 'jacqueline', 'jacqueline_raw', [415, 410, 420, 440, 440, 410, 520, 480], 512);
    addVariableWidthSpritesheet(this, 'ivan', 'ivan_raw', [415, 410, 420, 440, 440, 390, 520, 480], 512);
    addVariableWidthSpritesheet(this, 'd_isa', 'd_isa_raw', [415, 410, 420, 440, 440, 390, 520, 480], 512);

    // Ensure debug scene always sets up two valid player objects
    this.players = [
      { key: 'bento' },
      { key: 'davir' },
    ];
    this.players[0].health = 100;
    this.players[1].health = 100;
    this.players[0].special = 0;
    this.players[1].special = 0;
    this.players[0].direction = 'right';
    this.players[1].direction = 'left';

    // Add background for visual context
    this.add.image(400, 300, 'scenario1').setOrigin(0.5, 0.5).setDepth(0);

    // Add player sprites for debug visualization
    const platformHeight = 520;
    const scale = 0.4;
    const player1 = this.add.sprite(240, platformHeight, 'bento', 0)
      .setOrigin(0.5, 1.0)
      .setScale(scale)
      .setDepth(1);
    const player2 = this.add.sprite(560, platformHeight, 'davir', 0)
      .setOrigin(0.5, 1.0)
      .setScale(scale)
      .setFlipX(true)
      .setDepth(1);

    this.add.text(240, platformHeight - 520, 'Bento', { font: '24px monospace', color: '#fff' }).setOrigin(0.5, 0);
    this.add.text(560, platformHeight - 520, 'Davi R', { font: '24px monospace', color: '#fff' }).setOrigin(0.5, 0);

    this.scene.start('KidsFightScene', {
      selected: { p1: 'bento', p2: 'davir' },
      p1: 'd_isa',
      p2: 'davir',
      selectedScenario: 'scenario1',
      gameMode: 'online',
      isHost: true
    });
  }
}
