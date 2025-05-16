import Phaser from 'phaser';

class GameModeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameModeScene' });
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Add background
    this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 1);

    // Title text
    const titleText = this.add.text(
      w/2,
      h * 0.3,
      'Escolha o Modo de Jogo',
      {
        fontSize: Math.max(24, Math.round(w * 0.045)) + 'px',
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5);

    // Button style
    const buttonStyle = {
      fontSize: Math.max(20, Math.round(w * 0.035)) + 'px',
      color: '#fff',
      fontFamily: 'monospace',
      backgroundColor: '#4a4a4a',
      padding: {
        left: Math.round(w * 0.02),
        right: Math.round(w * 0.02),
        top: Math.round(w * 0.012),
        bottom: Math.round(w * 0.012)
      }
    };

    // Local play button
    const localButton = this.add.text(
      w/2,
      h * 0.5,
      'Jogar Local',
      buttonStyle
    ).setOrigin(0.5);
    localButton.setInteractive({ useHandCursor: true });

    // Online play button
    const onlineButton = this.add.text(
      w/2,
      h * 0.6,
      'Jogar Online',
      buttonStyle
    ).setOrigin(0.5);
    onlineButton.setInteractive({ useHandCursor: true });

    // Button hover effects
    [localButton, onlineButton].forEach(button => {
      button.on('pointerover', () => button.setStyle({ backgroundColor: '#666666' }));
      button.on('pointerout', () => button.setStyle({ backgroundColor: '#4a4a4a' }));
    });

    // Button click handlers
    localButton.on('pointerdown', () => {
      console.log('[GameModeScene] Local play button clicked - launching PlayerSelectScene');
      // Start loading the next scene with a marker that this was an intentional transition
      // This helps distinguish between legitimate navigation and orientation change issues
      this.scene.launch('PlayerSelectScene', { 
        mode: 'local',
        fromGameMode: true,  // Flag to indicate this is a legitimate navigation
        timestamp: Date.now() // Add timestamp for verification
      });
      
      // Keep this scene active until the next one is ready
      this.scene.get('PlayerSelectScene').events.once('create', () => {
        console.log('[GameModeScene] PlayerSelectScene created, stopping GameModeScene');
        this.scene.stop();
      });
    });

    onlineButton.on('pointerdown', () => {
      this.scene.start('OnlineModeScene');
    });
  }

  resize() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Update background
    this.bg.setSize(w, h).setPosition(w/2, h/2);
    
    // Update title text
    const titleText = /** @type {Phaser.GameObjects.Text} */ (
      this.children.list.find(child => 
        child instanceof Phaser.GameObjects.Text && child.text === 'Escolha o Modo de Jogo'
      )
    );
    if (titleText) {
      titleText.setPosition(w/2, h * 0.3)
        .setFontSize(Math.max(24, Math.round(w * 0.045)) + 'px');
    }
    
    // Update buttons
    const localButton = /** @type {Phaser.GameObjects.Text} */ (
      this.children.list.find(child => 
        child instanceof Phaser.GameObjects.Text && child.text === 'Jogar Local'
      )
    );
    const onlineButton = /** @type {Phaser.GameObjects.Text} */ (
      this.children.list.find(child => 
        child instanceof Phaser.GameObjects.Text && child.text === 'Jogar Online'
      )
    );
    
    const buttonStyle = {
      fontSize: Math.max(20, Math.round(w * 0.035)) + 'px',
      backgroundColor: '#4a4a4a',
      padding: {
        left: Math.round(w * 0.02),
        right: Math.round(w * 0.02),
        top: Math.round(w * 0.012),
        bottom: Math.round(w * 0.012)
      }
    };
    
    if (localButton) {
      localButton.setPosition(w/2, h * 0.5)
        .setStyle(buttonStyle);
    }
    
    if (onlineButton) {
      onlineButton.setPosition(w/2, h * 0.6)
        .setStyle(buttonStyle);
    }
  }
}

export default GameModeScene;
