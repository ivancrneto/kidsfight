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
    // Use correct frame size for 3072x512 spritesheets: 256x256
    this.load.spritesheet('player1', player1RawImg, { frameWidth: 300, frameHeight: 512 });
    this.load.spritesheet('player2', player2RawImg, { frameWidth: 300, frameHeight: 512 });
    this.load.spritesheet('player3', player3RawImg, { frameWidth: 340, frameHeight: 512 });
    this.load.spritesheet('player4', player4RawImg, { frameWidth: 340, frameHeight: 512 });
    this.load.spritesheet('player5', player5RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player6', player6RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player7', player7RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player8', player8RawImg, { frameWidth: 400, frameHeight: 512 });
    this.load.spritesheet('player9', player9RawImg, { frameWidth: 510, frameHeight: 512 });
  }

  create() {
    // After loading, go directly to KidsFightScene with chosen players/scenario
    this.scene.start('KidsFightScene', {
      selected: { p1: 'player1', p2: 'player2' },
      p1: 'player1',
      p2: 'player2',
      selectedScenario: 'scenario1',
      gameMode: 'single',
      isHost: true
    });
  }
}
