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
          // The scenes are already registered in main.ts, so we don't need to add them here
          // Just mark that we've handled the orientation change
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
