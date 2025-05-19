import Phaser from 'phaser';
import GameModeScene from './game_mode_scene';
import OnlineModeScene from './online_mode_scene';
import PlayerSelectScene from './player_select_scene';
import ScenarioSelectScene from './scenario_select_scene';
import KidsFightScene from './kidsfight_scene';

class RotatePromptScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Rectangle;
  private text!: Phaser.GameObjects.Text;
  private icon!: Phaser.GameObjects.Image;
  private scenesAdded: boolean;

  constructor() {
    super({ key: 'RotatePromptScene' });
    this.scenesAdded = false;
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    
    this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 1);
    
    this.text = this.add.text(w/2, h/2, 'Por favor, gire seu dispositivo para o modo paisagem.', {
      fontSize: `${Math.max(24, Math.round(w * 0.045))}px`,
      color: '#fff',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: w * 0.8 }
    }).setOrigin(0.5);
    
    this.icon = this.add.image(w/2, h/2 - 80, 'rotate_icon')
      .setOrigin(0.5)
      .setScale(0.5);
  }

  resize(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    
    this.bg.setSize(w, h).setPosition(w/2, h/2);
    this.text.setFontSize(`${Math.max(24, Math.round(w * 0.045))}px`)
      .setPosition(w/2, h/2);
    this.icon.setPosition(w/2, h/2 - 80);
  }

  update(): void {
    // Check for landscape orientation
    if (this.scale.width > this.scale.height || this.scale.orientation === Phaser.Scale.LANDSCAPE) {
      // Only execute this once per orientation change
      if (!this.scenesAdded) {
        console.log('[RotatePromptScene] 🛑 Detected landscape orientation - transitioning to main menu');
        
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
          
          // Mark scenes as added to prevent duplicate additions
          this.scenesAdded = true;
          
          // Record the orientation change time for other scenes to reference
          (window as any).lastOrientationChangeTime = Date.now();
          
          // Start the game mode scene with a flag indicating proper navigation
          this.scene.start('GameModeScene', { fromRotatePrompt: true });
          
        } catch (error) {
          console.error('[RotatePromptScene] ❌ Error adding scenes:', error);
          // On error, try to recover by just starting GameModeScene
          this.scene.start('GameModeScene', { fromRotatePrompt: true });
        }
      }
    } else {
      // Reset the flag when back in portrait mode
      this.scenesAdded = false;
    }
  }
}

export default RotatePromptScene;
