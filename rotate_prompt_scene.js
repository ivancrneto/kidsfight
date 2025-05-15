import Phaser from 'phaser';
import GameModeScene from './game_mode_scene.js';
import OnlineModeScene from './online_mode_scene.js';
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
    // Fix the TypeScript error by using a proper check for landscape orientation
    // this handles both Phaser.Scale.LANDSCAPE and other landscape detection methods
    if (this.scale.width > this.scale.height || this.scale.orientation === Phaser.Scale.LANDSCAPE) {
      // Only execute this once per orientation change
      if (!this.scenesAdded) {
        console.log('[RotatePromptScene] 🛑 Detected landscape orientation - transitioning to main menu');
        
        // CRITICAL FIX: Use a more direct approach to ensure proper scene loading
        try {
          // First, make sure all needed scenes are registered
          if (!this.scene.get('GameModeScene')) {
            console.log('[RotatePromptScene] Adding GameModeScene');
            this.scene.add('GameModeScene', GameModeScene, false);
          }
          if (!this.scene.get('OnlineModeScene')) {
            this.scene.add('OnlineModeScene', OnlineModeScene, false);
          }
          if (!this.scene.get('PlayerSelectScene')) {
            this.scene.add('PlayerSelectScene', PlayerSelectScene, false);
          }
          if (!this.scene.get('ScenarioSelectScene')) {
            this.scene.add('ScenarioSelectScene', ScenarioSelectScene, false);
          }
          if (!this.scene.get('KidsFightScene')) {
            this.scene.add('KidsFightScene', KidsFightScene, false);
          }
          
          // Stop ALL other scenes to ensure they don't persist
          const allScenes = this.scene.manager.scenes;
          for (const scene of allScenes) {
            if (scene.scene.key !== 'RotatePromptScene') {
              console.log(`[RotatePromptScene] Stopping scene: ${scene.scene.key}`);
              this.scene.stop(scene.scene.key);
            }
          }
          
          // Prevent this code from running again
          this.scenesAdded = true;
          
          // Delay the scene transition slightly to ensure cleanup is complete
          console.log('[RotatePromptScene] 🚀 Starting GameModeScene with delay');
          this.time.delayedCall(100, () => {
            // CRITICALLY IMPORTANT: First stop this scene to prevent any interference
            this.scene.stop('RotatePromptScene');
            
            // Use a direct launch with the event system disabled to prevent interference
            try {
              this.scene.launch('GameModeScene');
              console.log('[RotatePromptScene] 🎮 GameModeScene launched successfully');
            } catch (e) {
              console.error('[RotatePromptScene] 💥 Error launching GameModeScene:', e);
              // Fallback attempt
              this.scene.start('GameModeScene');
            }
          });
        } catch (error) {
          console.error('[RotatePromptScene] 💥 Critical error during scene transition:', error);
          // Last resort emergency fallback
          try {
            this.scene.stop();
            this.scene.start('GameModeScene');
          } catch (e) {
            console.error('[RotatePromptScene] 💥 Emergency fallback failed:', e);
          }
        }
      }
    }
  }
}

export default RotatePromptScene;
