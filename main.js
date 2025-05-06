// Utility: Mobile and orientation detection
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
}
function isLandscape() {
  return window.matchMedia("(orientation: landscape)").matches;
}

// Parcel image imports for Phaser asset loading
import scenario1Img from './scenario1.png';
import player1RawImg from './sprites-bento3.png';
import player2RawImg from './sprites-davir3.png';
import player3RawImg from './sprites-jose3.png';
import player4RawImg from './sprites-davis3.png';
import player5RawImg from './sprites-carol3.png';
import player6RawImg from './sprites-roni3.png';
import player7RawImg from './sprites-jacqueline3.png';
import player8RawImg from './sprites-ivan3.png';
import RotatePromptScene from './rotate_prompt_scene.js';
import PlayerSelectScene from './player_select_scene.js';
import ScenarioSelectScene from './scenario_select_scene.js';
import KidsFightScene from './kidsfight_scene.js';

// Load gameUtils.js via script tag instead of import
// The functions will be available globally


// Dynamically set game size based on viewport, accounting for mobile browser UI
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

const PLAYER_SIZE = 192;
const PLAYER_SPEED = 200;
const JUMP_VELOCITY = -400;
const GRAVITY = 900;
const ATTACK_RANGE = 100;
const ATTACK_COOLDOWN = 500;
const MAX_HEALTH = 100;

const ROUND_TIME = 60;









function resizeGame(game) {
  // Use window.innerWidth/innerHeight for true viewport size (accounts for mobile browser UI)
  const w = window.innerWidth;
  const h = window.innerHeight;
  game.scale.resize(w, h);
  applyGameCss();
  // --- Ensure ALL active scenes reposition after resize/orientation change ---
  if (game.scene && typeof game.scene.getScenes === 'function') {
    const allScenes = game.scene.getScenes(true); // true = only active scenes
    allScenes.forEach(scene => {
      if (typeof scene.updateSceneLayout === 'function') {
        scene.updateSceneLayout();
      }
    });
  }
}


// --- Responsive Touch Controls Positioning ---
KidsFightScene.prototype.updateControlPositions = function() {
  if (!this.isTouch || !this.touchControls || !this.cameras || !this.cameras.main) return;
  const cam = this.cameras.main;
  const w = cam.width;
  const h = cam.height;
  // Player 1
  this.touchControls.p1.left.setPosition(w * 0.08, h * 0.85);
  this.touchControls.p1.right.setPosition(w * 0.18, h * 0.85);
  this.touchControls.p1.jump.setPosition(w * 0.13, h * 0.7);
  this.touchControls.p1.down.setPosition(w * 0.13, h * 0.97);
  this.touchControls.p1.attack.setPosition(w * 0.28, h * 0.89);
  this.touchControls.p1.special.setPosition(w * 0.36, h * 0.89);
  // Player 2
  this.touchControls.p2.left.setPosition(w * 0.82, h * 0.85);
  this.touchControls.p2.right.setPosition(w * 0.92, h * 0.85);
  this.touchControls.p2.jump.setPosition(w * 0.87, h * 0.7);
  this.touchControls.p2.down.setPosition(w * 0.87, h * 0.97);
  this.touchControls.p2.attack.setPosition(w * 0.72, h * 0.89);
  this.touchControls.p2.special.setPosition(w * 0.64, h * 0.89);
  // Labels (order must match creation)
  if (this.touchLabels && this.touchLabels.length === 12) {
    this.touchLabels[0].setPosition(w * 0.06, h * 0.83);
    this.touchLabels[1].setPosition(w * 0.16, h * 0.83);
    this.touchLabels[2].setPosition(w * 0.11, h * 0.68);
    this.touchLabels[3].setPosition(w * 0.11, h * 0.95);
    this.touchLabels[4].setPosition(w * 0.25, h * 0.87);
    this.touchLabels[5].setPosition(w * 0.33, h * 0.87);
    this.touchLabels[6].setPosition(w * 0.79, h * 0.83);
    this.touchLabels[7].setPosition(w * 0.89, h * 0.83);
    this.touchLabels[8].setPosition(w * 0.84, h * 0.68);
    this.touchLabels[9].setPosition(w * 0.84, h * 0.95);
    this.touchLabels[10].setPosition(w * 0.69, h * 0.87);
    this.touchLabels[11].setPosition(w * 0.61, h * 0.87);
  }
}

// Phaser Game Config (must be after KidsFightScene is defined)
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#222',
  parent: 'game-container',
  scene: [RotatePromptScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

window.onload = () => {
  // Set initial size to fit screen
  let game = null;
  function ensureGameContainerSize() {
    const container = document.getElementById('game-container');
    if (container) {
      container.style.width = window.innerWidth + 'px';
      container.style.height = window.innerHeight + 'px';
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
    }
  }

  function createGame(startScene, startData) {
    ensureGameContainerSize();
    // Log sizes for debugging
    const container = document.getElementById('game-container');
    console.log('[KidsFight] Creating game with:', {
      windowW: window.innerWidth,
      windowH: window.innerHeight,
      containerW: container ? container.offsetWidth : 'n/a',
      containerH: container ? container.offsetHeight : 'n/a'
    });
    config.width = window.innerWidth;
    config.height = window.innerHeight;
    config.scale.width = window.innerWidth;
    config.scale.height = window.innerHeight;
    config.scene = [RotatePromptScene, ScenarioSelectScene, PlayerSelectScene, KidsFightScene];
    console.log('[KidsFight] Game scenes:', config.scene.map(scene => scene.name || scene.prototype.constructor.name));
    console.log('[KidsFight] PlayerSelectScene included:', config.scene.some(scene => scene === PlayerSelectScene));
    game = new Phaser.Game(config);
    if (startScene === 'RotatePromptScene') {
      game.scene.start('RotatePromptScene');
    } else if (startScene === 'ScenarioSelectScene') {
      game.scene.start('ScenarioSelectScene', startData);
    } else {
      game.scene.start('PlayerSelectScene', startData);
    }
    return game;
  }



  let lastWasPortrait = null;
  let recreateTimeout = null;
  function showCorrectScene() {
    // For debugging: Always show the game regardless of orientation
    const portrait = false; // Force landscape mode for testing
    console.log('[KidsFight] Orientation check:', { 
      isMobile: isMobile(), 
      isLandscape: isLandscape(), 
      portrait: portrait,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });
    
    if (portrait) {
      if (!game) {
        game = createGame('RotatePromptScene');
      } else {
        game.scene.stop('KidsFightScene');
        game.scene.stop('PlayerSelectScene');
        game.scene.stop('ScenarioSelectScene');
        game.scene.start('RotatePromptScene');
      }
      lastWasPortrait = true;
    } else {
      if (lastWasPortrait) {
        // Destroy and recreate the game instance for a clean landscape start, with a delay to allow resize
        if (game) {
          game.destroy(true);
          game = null;
        }
        // Remove all canvas elements from #game-container to ensure a clean slate
        const container = document.getElementById('game-container');
        if (container) {
          const canvases = container.querySelectorAll('canvas');
          canvases.forEach(c => c.parentNode.removeChild(c));
        }
        if (recreateTimeout) clearTimeout(recreateTimeout);
        recreateTimeout = setTimeout(() => {
          game = createGame('ScenarioSelectScene');
        }, 120);
        lastWasPortrait = false;
      } else {
        if (!game) {
          game = createGame('ScenarioSelectScene');
        } else {
          game.scene.stop('RotatePromptScene');
          if (!game.scene.isActive('PlayerSelectScene') && !game.scene.isActive('KidsFightScene')) {
            game.scene.start('PlayerSelectScene');
          }
        }
      }
    }
  }

  // Initial scene selection
  showCorrectScene();

  // Helper: double-resize to fix mobile browser chrome issues
  function resizeWithDelay() {
    showCorrectScene();
    // Only resize and update layout if in landscape
    if (game && isLandscape()) {
      resizeGame(game);
      setTimeout(() => resizeGame(game), 250);
    }
  }

  window.addEventListener('resize', resizeWithDelay);
  window.addEventListener('orientationchange', resizeWithDelay);
}
