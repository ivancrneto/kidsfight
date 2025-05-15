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
import GameModeScene from './game_mode_scene.js';
import OnlineModeScene from './online_mode_scene.js';
import PlayerSelectScene from './player_select_scene.js';
import ScenarioSelectScene from './scenario_select_scene.js';
import KidsFightScene from './kidsfight_scene.js';
import { DEV } from './globals.js';

// DIAGNOSTIC: Unique build marker
window.KIDSFIGHT_BUILD_ID = 'prod-test-' + Date.now();
console.log('KIDSFIGHT_BUILD_ID:', window.KIDSFIGHT_BUILD_ID);

// DIAGNOSTIC: Log NODE_ENV at runtime
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);

// Utility: Mobile and orientation detection
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
}
function isLandscape() {
  return window.matchMedia("(orientation: landscape)").matches;
}

// Parcel image imports for Phaser asset loading

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
  if (!game.scale || typeof game.scale.resize !== 'function') {
    console.warn('resizeGame: game.scale is not available', game && game.scale);
    return;
  }
  try {
    game.scale.resize(w, h);
  } catch (e) {
    console.error('resizeGame: Exception during game.scale.resize', e, game.scale);
    return;
  }
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


// Phaser Game Config (must be after KidsFightScene is defined)
// --- DIAGNOSTIC: Global Scene Transition Logger ---
(function() {
  const logStyle = 'background: #222; color: #bada55; font-weight: bold;';
  function logSceneTransition(method, sourceScene, targetScene, args) {
    console.log(`%c[SCENE TRANSITION]`, logStyle,
      `Method: ${method}\n  Source: ${sourceScene && sourceScene.scene && sourceScene.scene.key}\n  Target: ${targetScene}\n  Time: ${new Date().toISOString()}\n  Args:`, args,
      '\n  Stack:', new Error().stack.split('\n').slice(2, 7).join('\n'));
  }

  // Patch start
  const origStart = Phaser.Scene.prototype.start;
  Phaser.Scene.prototype.start = function(key, data = {}) {
    logSceneTransition('start', this, key, data);
    // --- Existing CRITICAL INTERCEPT for PlayerSelectScene after orientation ---
    const now = Date.now();
    const lastOrientationTime = window.lastOrientationChangeTime || 0;
    const timeSinceOrientationChange = now - lastOrientationTime;
    if (key === 'PlayerSelectScene' && timeSinceOrientationChange < 3000 && !data.fromGameMode) {
      console.log('%c[SCENE INTERCEPT] Prevented PlayerSelectScene after orientation', logStyle);
      return origStart.call(this, 'GameModeScene');
    }
    return origStart.apply(this, arguments);
  };

  // Patch switch
  const origSwitch = Phaser.Scene.prototype.switch;
  Phaser.Scene.prototype.switch = function(key) {
    logSceneTransition('switch', this, key, arguments);
    return origSwitch.apply(this, arguments);
  };

  // Patch stop
  const origStop = Phaser.Scene.prototype.stop;
  Phaser.Scene.prototype.stop = function(key) {
    logSceneTransition('stop', this, key, arguments);
    return origStop.apply(this, arguments);
  };
})();


console.log('PlayerSelectScene typeof:', typeof PlayerSelectScene, PlayerSelectScene);
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#222',
  parent: 'game-container',
  scene: [RotatePromptScene, GameModeScene, OnlineModeScene, PlayerSelectScene, ScenarioSelectScene, KidsFightScene],
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


window.DEV = DEV;

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
    // Keep the same scene order as in the initial configuration
    config.scene = [RotatePromptScene, GameModeScene, OnlineModeScene, PlayerSelectScene, ScenarioSelectScene, KidsFightScene];
    console.log('[KidsFight] Game scenes:', config.scene.map(scene => scene.name || scene.prototype.constructor.name));
    console.log('[KidsFight] PlayerSelectScene included:', config.scene.some(scene => scene === PlayerSelectScene));
    game = new Phaser.Game(config);
    if (startScene === 'RotatePromptScene') {
      game.scene.start('RotatePromptScene');
    } else if (startScene === 'GameModeScene') {
      game.scene.start('GameModeScene', startData);
    } else if (startScene === 'ScenarioSelectScene') {
      game.scene.start('ScenarioSelectScene', startData);
    } else if (startScene === 'PlayerSelectScene') {
      game.scene.start('PlayerSelectScene', startData);
    } else {
      // Default to GameModeScene if no specific scene is requested
      game.scene.start('GameModeScene');
    }
    return game;
  }



  let lastWasPortrait = null;
  let recreateTimeout = null;
  
  // Track last orientation change time to prevent multiple handlers firing too quickly
  let lastOrientationChangeTime = 0;
  
  function showCorrectScene() {
    // Debounce orientation changes that happen too quickly
    const now = Date.now();
    if (now - lastOrientationChangeTime < 300) {
      console.log('[KidsFight] Orientation change debounced');
      return;
    }
    lastOrientationChangeTime = now;
    
    // Get actual orientation state
    const portrait = !isLandscape();
    console.log('[KidsFight] Orientation check:', { 
      isMobile: isMobile(), 
      isLandscape: isLandscape(), 
      portrait: portrait,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      timestamp: now
    });
    
    // CRITICAL FIX: If we're in portrait mode, show rotate prompt
    if (portrait) {
      if (!game) {
        game = createGame('RotatePromptScene');
      } else {
        // Force stop ALL scenes to prevent any scene from persisting
        const allSceneKeys = [
          'PlayerSelectScene', 'GameModeScene', 'KidsFightScene',
          'ScenarioSelectScene', 'OnlineModeScene'
        ];
        
        allSceneKeys.forEach(key => {
          try {
            if (game.scene.isActive(key)) {
              console.log(`[KidsFight] Stopping scene: ${key}`);
              game.scene.stop(key);
            }
          } catch (e) {
            console.error(`[KidsFight] Error stopping scene ${key}:`, e);
          }
        });
        
        // Start rotate prompt scene
        console.log('[KidsFight] Starting RotatePromptScene');
        game.scene.start('RotatePromptScene');
      }
      lastWasPortrait = true;
    } 
    // LANDSCAPE MODE HANDLING
    else {
      // Coming from portrait mode - update scene and resize only
      if (lastWasPortrait === true) {
        console.log('[KidsFight] ⚠️ Orientation changed from portrait to landscape - updating scene and resizing');
        // Instead of destroying/recreating the game, just restart the main scene and resize
        if (game) {
          try {
            // Resume or start your main scene as appropriate
            game.scene.stop('RotatePromptScene');
            game.scene.start('GameModeScene'); // Or whichever scene should be active
            resizeGame(game);
          } catch (e) {
            console.error('[KidsFight] Error updating scene or resizing:', e);
          }
        }
        // Cancel any pending recreate timeouts
        if (recreateTimeout) {
          clearTimeout(recreateTimeout);
          recreateTimeout = null;
        }
        
        // Create fresh game instance with longer delay to ensure complete cleanup
        recreateTimeout = setTimeout(() => {
          console.log('[KidsFight] ⚠️ Creating fresh game instance with GameModeScene');
          try {
            game = createGame('GameModeScene');
          } catch (e) {
            console.error('[KidsFight] Error creating game:', e);
            // One more attempt if the first fails
            setTimeout(() => {
              console.log('[KidsFight] Retry creating game');
              game = createGame('GameModeScene');
            }, 100);
          }
        }, 300); // Increased delay for more reliable cleanup
        
        lastWasPortrait = false;
      } 
      // Already in landscape mode
      else {
        if (!game) {
          // No game instance exists, create one with main menu
          console.log('[KidsFight] Creating new game instance with GameModeScene');
          game = createGame('GameModeScene');
        } else {
          // Game exists and we're in landscape - check if PlayerSelectScene is incorrectly showing
          try {
            // CRITICAL BUG FIX: Force stop PlayerSelectScene if it's active after orientation change
            if (game.scene.isActive('PlayerSelectScene')) {
              console.log('[KidsFight] ⚠️ CRITICAL FIX: PlayerSelectScene detected - forcing GameModeScene');
              game.scene.stop('PlayerSelectScene');
              game.scene.start('GameModeScene');
            }
            // If no scene is active, ensure GameModeScene is shown
            else if (game.scene.getScenes(true).length === 0 || 
                    (game.scene.getScenes(true).length === 1 && 
                     game.scene.isActive('RotatePromptScene'))) {
              console.log('[KidsFight] No gameplay scenes active, starting GameModeScene');
              game.scene.stop('RotatePromptScene');
              game.scene.start('GameModeScene');
            }
          } catch (e) {
            console.error('[KidsFight] Error handling landscape scenes:', e);
          }
        }
      }
    }
  }

  // Initial scene selection
  showCorrectScene();

  // Helper: double-resize to fix mobile browser chrome issues
  function resizeWithDelay() {
    // CRITICAL FIX: Track timestamp of orientation changes globally
    window.lastOrientationChangeTime = Date.now();
    console.log('[KidsFight] Orientation change detected at timestamp:', window.lastOrientationChangeTime);
    
    showCorrectScene();
    // Only resize and update layout if in landscape
    if (game && isLandscape()) {
      resizeGame(game);
      setTimeout(() => resizeGame(game), 250);
    }
  }

  // Initialize the global timestamp tracker if it doesn't exist
  if (typeof window.lastOrientationChangeTime === 'undefined') {
    window.lastOrientationChangeTime = 0;
  }

  window.addEventListener('resize', resizeWithDelay);
  window.addEventListener('orientationchange', resizeWithDelay);
}
