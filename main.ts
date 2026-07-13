import Phaser from 'phaser';
import GameModeScene from './game_mode_scene';
import PlayerSelectScene from './player_select_scene';
import OnlineModeScene from './online_mode_scene';
import KidsFightScene from './kidsfight_scene';
import ScenarioSelectScene from './scenario_select_scene';
import RotatePromptScene from './rotate_prompt_scene';

console.log('*** FULL SCENE REGISTRATION: All main scenes included ***');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#222222',
  scene: [
    RotatePromptScene,
    GameModeScene,
    PlayerSelectScene,
    ScenarioSelectScene,
    KidsFightScene,
    OnlineModeScene
  ],
  physics: {
    default: 'arcade',
    arcade: {
      // Effective player gravity. Previously this was 200 here plus a per-body
      // setGravityY(300) on each player (Arcade adds the two), for 500 total.
      // Consolidated to a single value so jump height has one source of truth.
      gravity: { y: 500 },
      debug: false
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(config);
});
