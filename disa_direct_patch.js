// D.Isa Direct Patch - Simplified version for online mobile mode
// This script adds D.Isa directly to the player selection screen

// Wait for the game to initialize
window.addEventListener('load', function() {
  console.log('[D.Isa Direct Patch] Initializing...');
  
  // Load D.Isa's sprite
  const disaImg = new Image();
  disaImg.src = './sprites-d_isa.png';
  disaImg.onload = function() {
    console.log('[D.Isa Direct Patch] D.Isa sprite loaded successfully');
  };
  
  // Wait for the game to be fully loaded and check every 100ms
  const checkInterval = setInterval(function() {
    if (window.game && window.game.scene && window.game.scene.scenes) {
      // Try to find the PlayerSelectScene
      const playerSelectScene = window.game.scene.scenes.find(scene => 
        scene.constructor.name === 'PlayerSelectScene' || 
        (scene.sys && scene.sys.settings && scene.sys.settings.key === 'PlayerSelectScene')
      );
      
      if (playerSelectScene) {
        console.log('[D.Isa Direct Patch] PlayerSelectScene found, applying direct patch');
        clearInterval(checkInterval);
        
        // Directly modify the CHARACTER_KEYS array
        if (playerSelectScene.CHARACTER_KEYS) {
          if (!playerSelectScene.CHARACTER_KEYS.includes('player9')) {
            playerSelectScene.CHARACTER_KEYS.push('player9');
            console.log('[D.Isa Direct Patch] Added player9 to CHARACTER_KEYS:', playerSelectScene.CHARACTER_KEYS);
          }
        }
        
        // Create a texture for D.Isa if it doesn't exist
        if (!playerSelectScene.textures.exists('player9')) {
          // Create a canvas to draw the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = disaImg.width;
          canvas.height = disaImg.height;
          ctx.drawImage(disaImg, 0, 0);
          
          // Add the texture to the game
          playerSelectScene.textures.addCanvas('player9_raw', canvas);
          console.log('[D.Isa Direct Patch] Created player9_raw texture from loaded image');
          
          // Create the spritesheet
          const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
          const frameHeight = 512;
          
          playerSelectScene.textures.addSpriteSheet('player9', canvas, {
            frameWidth: 400,
            frameHeight: frameHeight,
            startFrame: 0,
            endFrame: frameWidths.length - 1
          });
          
          const tex = playerSelectScene.textures.get('player9');
          tex.frames = { __BASE: tex.frames['__BASE'] };
          let x = 0;
          for (let i = 0; i < frameWidths.length; i++) {
            tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
            x += frameWidths[i];
          }
          
          console.log('[D.Isa Direct Patch] Created player9 spritesheet');
        }
        
        // Override the createScene method to add D.Isa to the player selection grid
        const originalCreateScene = playerSelectScene.createScene;
        playerSelectScene.createScene = function() {
          // Call the original method first
          originalCreateScene.apply(this, arguments);
          
          console.log('[D.Isa Direct Patch] Adding D.Isa to player selection grid');
          
          // Get screen dimensions
          const screenWidth = this.cameras.main.width;
          const screenHeight = this.cameras.main.height;
          
          // Calculate positions for the grid
          const faceRadius = 32; // Circle button radius
          const faceOffsetY = this.faceOffsetY || 18;
          const cropY = 15;
          const frameW = 250;
          const frameH = 350;
          const cropH = frameH / 1.3;
          
          // Calculate grid positions
          const centerX = screenWidth / 2;
          const middleGap = screenWidth * 0.12;
          const p1BlockCenter = centerX - middleGap - screenWidth * 0.08;
          const p2BlockCenter = centerX + middleGap + screenWidth * 0.08;
          
          // Position D.Isa in the first row, first position for maximum visibility
          const p1DisaX = p1BlockCenter - screenWidth * 0.08;
          const p2DisaX = p2BlockCenter - screenWidth * 0.08;
          const disaY = screenHeight * 0.38; // First row
          
          // Create D.Isa sprites
          const p1DisaBG = this.add.circle(p1DisaX, disaY, faceRadius, 0x222222);
          const p1DisaSprite = this.add.sprite(p1DisaX, disaY + faceOffsetY, 'player9', 0).setScale(0.18);
          p1DisaSprite.setCrop(0, cropY, frameW, cropH);
          
          const p2DisaBG = this.add.circle(p2DisaX, disaY, faceRadius, 0x222222);
          const p2DisaSprite = this.add.sprite(p2DisaX, disaY + faceOffsetY, 'player9', 0).setScale(0.18);
          p2DisaSprite.setCrop(0, cropY, frameW, cropH);
          
          // Add D.Isa to the options arrays
          if (!this.p1Options.includes(p1DisaSprite)) {
            this.p1Options.push(p1DisaSprite);
          }
          
          if (!this.p2Options.includes(p2DisaSprite)) {
            this.p2Options.push(p2DisaSprite);
          }
          
          // Add D.Isa name labels
          const nameStyle = {
            fontSize: Math.round(Math.max(12, Math.min(18, screenWidth * 0.025))) + 'px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            backgroundColor: 'rgba(0,0,0,0.35)'
          };
          
          this.add.text(p1DisaX, disaY + 22, 'D.Isa', nameStyle).setOrigin(0.5).setAlpha(0.8);
          this.add.text(p2DisaX, disaY + 22, 'D.Isa', nameStyle).setOrigin(0.5).setAlpha(0.8);
          
          // Make D.Isa interactive based on online mode rules
          if (this.gameMode !== 'online' || this.isHost) {
            p1DisaSprite.setInteractive();
            p1DisaSprite.on('pointerdown', () => {
              this.selected.p1 = 'player9';
              console.log('[D.Isa Direct Patch] P1 selected D.Isa');
              this.p1Selector.setPosition(p1DisaSprite.x, p1DisaSprite.y - faceOffsetY);
              
              if (this.gameMode === 'online' && window.wsManager && window.wsManager.send) {
                console.log('[D.Isa Direct Patch] Sending P1 D.Isa selection via WebSocket');
                window.wsManager.send({
                  type: 'character_selected',
                  character: 8, // Index for D.Isa (after the original 8 characters)
                  playerNum: 1
                });
              }
            });
          } else {
            p1DisaSprite.setAlpha(0.5); // Dim if not selectable in online mode
          }
          
          if (this.gameMode !== 'online' || !this.isHost) {
            p2DisaSprite.setInteractive();
            p2DisaSprite.on('pointerdown', () => {
              this.selected.p2 = 'player9';
              console.log('[D.Isa Direct Patch] P2 selected D.Isa');
              this.p2Selector.setPosition(p2DisaSprite.x, p2DisaSprite.y - faceOffsetY);
              
              if (this.gameMode === 'online' && window.wsManager && window.wsManager.send) {
                console.log('[D.Isa Direct Patch] Sending P2 D.Isa selection via WebSocket');
                window.wsManager.send({
                  type: 'character_selected',
                  character: 8, // Index for D.Isa (after the original 8 characters)
                  playerNum: 2
                });
              }
            });
          } else {
            p2DisaSprite.setAlpha(0.5); // Dim if not selectable in online mode
          }
          
          console.log('[D.Isa Direct Patch] D.Isa added to player selection grid');
        };
        
        // Patch the KidsFightScene to handle D.Isa in gameplay
        const kidsFightScene = window.game.scene.scenes.find(scene => 
          scene.constructor.name === 'KidsFightScene' || 
          (scene.sys && scene.sys.settings && scene.sys.settings.key === 'KidsFightScene')
        );
        
        if (kidsFightScene) {
          console.log('[D.Isa Direct Patch] KidsFightScene found, patching for D.Isa support');
          
          // Override the create method to add D.Isa animations
          const originalKFCreate = kidsFightScene.create;
          kidsFightScene.create = function() {
            // Call original method first
            originalKFCreate.apply(this, arguments);
            
            // Create D.Isa's spritesheet if it doesn't exist
            if (!this.textures.exists('player9') && this.textures.exists('player9_raw')) {
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
              
              console.log('[D.Isa Direct Patch] D.Isa spritesheet created in KidsFightScene');
            }
            
            // Create animations for D.Isa
            if (!this.anims.exists('player9_idle')) {
              this.anims.create({
                key: 'player9_idle',
                frames: [{ key: 'player9', frame: 0 }],
                frameRate: 10,
                repeat: -1
              });
              
              this.anims.create({
                key: 'player9_walk',
                frames: [{ key: 'player9', frame: 1 }, { key: 'player9', frame: 2 }],
                frameRate: 10,
                repeat: -1
              });
              
              this.anims.create({
                key: 'player9_punch',
                frames: [{ key: 'player9', frame: 3 }, { key: 'player9', frame: 4 }],
                frameRate: 10,
                repeat: 0
              });
              
              this.anims.create({
                key: 'player9_kick',
                frames: [{ key: 'player9', frame: 5 }, { key: 'player9', frame: 6 }],
                frameRate: 10,
                repeat: 0
              });
              
              this.anims.create({
                key: 'player9_hit',
                frames: [{ key: 'player9', frame: 7 }],
                frameRate: 10,
                repeat: 0
              });
              
              console.log('[D.Isa Direct Patch] Created animations for D.Isa in KidsFightScene');
            }
          };
        }
      }
    }
  }, 100);
});
