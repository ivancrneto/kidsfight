// Script to add D.Isa as a new player
// This script should be included in index.html after player_select_scene.js

// Extend the PlayerSelectScene to add D.Isa
(function() {
  // Wait for the game to be initialized and PlayerSelectScene to be available
  window.addEventListener('DOMContentLoaded', function() {
    // Check if the game is loaded every 100ms
    const checkInterval = setInterval(function() {
      if (window.game && window.game.scene && window.game.scene.scenes) {
        // Find the PlayerSelectScene instance
        const playerSelectScene = window.game.scene.scenes.find(scene => scene.constructor.name === 'PlayerSelectScene');
        
        if (playerSelectScene) {
          console.log('[D.Isa] PlayerSelectScene found, adding D.Isa character');
          clearInterval(checkInterval);
          addDIsaCharacter(playerSelectScene.constructor);
        }
      }
    }, 100);
  });
  
  function addDIsaCharacter(PlayerSelectScene) {
    // Store the original preload method
    const originalPreload = PlayerSelectScene.prototype.preload;
  
  // Override the preload method to add D.Isa's sprite
  PlayerSelectScene.prototype.preload = function() {
    // Call the original preload method
    originalPreload.call(this);
    
    // Load D.Isa's sprite
    this.load.image('player9_raw', './sprites-d_isa.png');
    console.log('[PlayerSelectScene] Added D.Isa sprite to preload queue');
  };
  
  // Store the original createScene method
  const originalCreateScene = PlayerSelectScene.prototype.createScene;
  
  // Override the createScene method to add D.Isa to the character selection
  PlayerSelectScene.prototype.createScene = function() {
    // Add D.Isa to CHARACTER_KEYS array if not already present
    if (!this.CHARACTER_KEYS.includes('player9')) {
      this.CHARACTER_KEYS.push('player9');
      console.log('[PlayerSelectScene] Added D.Isa to CHARACTER_KEYS:', this.CHARACTER_KEYS);
    }
    
    // Call the original createScene method
    originalCreateScene.call(this);
    
    // Create D.Isa's spritesheet if it doesn't exist yet
    if (!this.textures.exists('player9')) {
      console.log('[PlayerSelectScene] Creating D.Isa spritesheet');
      const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
      const frameHeight = 512;
      const player9Texture = this.textures.get('player9_raw').getSourceImage();
      this.textures.addSpriteSheet('player9', player9Texture, {
        frameWidth: 400,
        frameHeight: frameHeight,
        startFrame: 0,
        endFrame: frameWidths.length - 1
      });
      const tex = this.textures.get('player9');
      tex.frames = { __BASE: tex.frames['__BASE'] };
      let x = 0;
      for (let i = 0; i < frameWidths.length; i++) {
        tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
        x += frameWidths[i];
      }
    }
    
    // Add D.Isa to the player names array
    const playerNamesElements = this.children.list.filter(child => 
      child.type === 'Text' && 
      ['Bento', 'Davi R', 'José', 'Davi S', 'Carol', 'Roni', 'Jacque', 'Ivan'].includes(child.text)
    );
    
    // Find the last row of player names
    const lastRowNames = playerNamesElements.filter(text => 
      text.y > this.cameras.main.height * 0.5
    );
    
    if (lastRowNames.length > 0) {
      // Calculate position for D.Isa's name
      const lastNameX = lastRowNames[lastRowNames.length - 1].x + 80;
      const lastNameY = lastRowNames[lastRowNames.length - 1].y;
      
      // Add D.Isa's name
      const nameStyle = {
        fontSize: Math.round(Math.max(12, Math.min(18, this.cameras.main.width * 0.025))) + 'px',
        fill: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)'
      };
      
      this.add.text(lastNameX, lastNameY, 'D.Isa', nameStyle).setOrigin(0.5).setAlpha(0.8);
      
      // Add D.Isa's sprite
      const faceRadius = 30;
      const faceOffsetY = -5;
      const cropY = 50;
      const frameW = 300;
      const cropH = 200;
      
      // Add background circle
      const bgCircle = this.add.circle(lastNameX, lastNameY - 22, faceRadius, 0x222222);
      
      // Add D.Isa's sprite
      let disaSprite = this.add.sprite(lastNameX, lastNameY - 22 + faceOffsetY, 'player9', 0).setScale(0.18);
      disaSprite.setCrop(0, cropY, frameW, cropH);
      
      // Make it interactive
      disaSprite.setInteractive();
      disaSprite.on('pointerdown', () => {
        // Handle player selection
        const playerIndex = this.CHARACTER_KEYS.indexOf('player9');
        
        // Determine if this is for player 1 or player 2 based on position
        if (lastNameX < this.cameras.main.width / 2) {
          // Player 1 selection
          this.selected.p1 = 'player9';
          console.log('[PlayerSelectScene] P1 selected: D.Isa');
          
          // Update selector position
          if (this.p1Selector) {
            this.p1Selector.setPosition(disaSprite.x, disaSprite.y - faceOffsetY);
          }
          
          // Send selection to server if in online mode
          if (this.gameMode === 'online' && this.isHost) {
            wsManager.send({
              type: 'character_selected',
              character: playerIndex,
              playerNum: 1
            });
          }
        } else {
          // Player 2 selection
          this.selected.p2 = 'player9';
          console.log('[PlayerSelectScene] P2 selected: D.Isa');
          
          // Update selector position
          if (this.p2Selector) {
            this.p2Selector.setPosition(disaSprite.x, disaSprite.y - faceOffsetY);
          }
          
          // Send selection to server if in online mode
          if (this.gameMode === 'online' && !this.isHost) {
            wsManager.send({
              type: 'character_selected',
              character: playerIndex,
              playerNum: 2
            });
          }
        }
      });
    };
  };

  })();
