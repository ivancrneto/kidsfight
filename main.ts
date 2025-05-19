import Phaser from 'phaser';
import KidsFightScene from './kidsfight_scene';
import PlayerSelectScene from './player_select_scene';
import GameModeScene from './game_mode_scene';
import OnlineModeScene from './online_mode_scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#222222',
  scene: [GameModeScene, PlayerSelectScene, OnlineModeScene, KidsFightScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
