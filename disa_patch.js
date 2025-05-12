// D.Isa player patch script
// This script adds D.Isa as a playable character and ensures proper WebSocket integration for online mode

// Wait for the game to initialize
window.addEventListener('load', function() {
  console.log('[D.Isa Patch] Initializing D.Isa character patch');
  
  // Wait for the game to be fully loaded
  const checkInterval = setInterval(function() {
    if (window.game && window.game.scene && window.game.scene.scenes) {
      const playerSelectScene = window.game.scene.scenes.find(scene => 
        scene.constructor.name === 'PlayerSelectScene' || 
        (scene.sys && scene.sys.settings && scene.sys.settings.key === 'PlayerSelectScene')
      );
      
      if (playerSelectScene) {
        console.log('[D.Isa Patch] PlayerSelectScene found, adding D.Isa character');
        clearInterval(checkInterval);
        
        // Add D.Isa to CHARACTER_KEYS if not already present
        if (playerSelectScene.CHARACTER_KEYS && !playerSelectScene.CHARACTER_KEYS.includes('player9')) {
          playerSelectScene.CHARACTER_KEYS.push('player9');
          console.log('[D.Isa Patch] Added player9 to CHARACTER_KEYS:', playerSelectScene.CHARACTER_KEYS);
          
          // Patch the WebSocket manager to handle player9 correctly
          if (window.wsManager) {
            console.log('[D.Isa Patch] Patching WebSocket manager for online mode');
            
            // Store the original onmessage handler
            const originalOnMessage = window.wsManager.ws ? window.wsManager.ws.onmessage : null;
            
            // Create a patched onmessage handler that understands player9
            if (window.wsManager.ws) {
              window.wsManager.ws.onmessage = function(event) {
                try {
                  const data = JSON.parse(event.data);
                  
                  // Handle character selection messages
                  if (data.type === 'character_selected') {
                    console.log('[D.Isa Patch] Received character selection via WebSocket:', data);
                    
                    // If the character index is 8 (D.Isa), make sure it's handled correctly
                    if (data.character === 8) {
                      console.log('[D.Isa Patch] Remote player selected D.Isa');
                      
                      // Update the player's selection based on which player number
                      if (data.playerNum === 1) {
                        playerSelectScene.selected.p1 = 'player9';
                      } else if (data.playerNum === 2) {
                        playerSelectScene.selected.p2 = 'player9';
                      }
                    }
                  }
                  
                  // Call the original handler
                  if (originalOnMessage) {
                    originalOnMessage.call(window.wsManager.ws, event);
                  }
                } catch (error) {
                  console.error('[D.Isa Patch] Error processing WebSocket message:', error);
                  
                  // Call the original handler even if we had an error
                  if (originalOnMessage) {
                    originalOnMessage.call(window.wsManager.ws, event);
                  }
                }
              };
            }
          }
        }
        
        // Patch the create method to properly add D.Isa to the player selection scene
        const originalCreate = playerSelectScene.create;
        playerSelectScene.create = function() {
          // Call original create method first
          originalCreate.apply(this, arguments);
          
          console.log('[D.Isa Patch] Patching player selection scene for online mode, gameMode:', this.gameMode, 'isHost:', this.isHost);
          
          // Get screen dimensions for positioning
          const screenWidth = this.cameras.main.width;
          const screenHeight = this.cameras.main.height;
          
          // Create D.Isa's spritesheet if it doesn't exist
          if (!this.textures.exists('player9')) {
            console.log('[D.Isa Patch] Creating D.Isa spritesheet');
            const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
            const frameHeight = 512;
            
            if (this.textures.exists('player9_raw')) {
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
              
              console.log('[D.Isa Patch] D.Isa spritesheet created successfully');
            } else {
              console.error('[D.Isa Patch] player9_raw texture not found');
            }
          }
          
          // Add D.Isa to the player selection grid for both P1 and P2
          const faceRadius = 32; // Circle button radius
          const faceOffsetY = this.faceOffsetY || 18; // Use the scene's faceOffsetY or default to 18
          const cropY = 15;
          const frameW = 250;
          const frameH = 350;
          const cropH = frameH / 1.3;
          
          // Get the existing grid layout from the scene
          const faceY1 = screenHeight * 0.38; // First row Y position
          const faceY2 = screenHeight * 0.52; // Second row Y position
          
          // Calculate positions for D.Isa based on existing grid
          const avatarSpacing = screenWidth * 0.08;
          const cols = 4; // Number of columns in the grid
          const middleGap = screenWidth * 0.12;
          const centerX = screenWidth / 2;
          
          // Calculate block centers for P1 and P2
          const p1BlockCenter = centerX - middleGap - screenWidth * 0.08;
          const p2BlockCenter = centerX + middleGap + screenWidth * 0.08;
          
          // Calculate X positions for the grid
          const blockWidth = avatarSpacing * (cols - 1);
          const p1FaceX = Array.from({length: 4}, (_, i) => p1BlockCenter - blockWidth / 2 + i * avatarSpacing);
          const p2FaceX = Array.from({length: 4}, (_, i) => p2BlockCenter - blockWidth / 2 + i * avatarSpacing);
          
          // Instead of adding a new position for D.Isa, let's replace an existing character
          // We'll replace the last character in the grid (Ivan) with D.Isa
          // This ensures D.Isa will be visible on all devices including mobile
          
          console.log('[D.Isa Patch] Replacing last character position with D.Isa');
          
          // Find the position of the last character (player8) in the grid
          // This is typically Ivan at position 7 in the CHARACTER_KEYS array
          const lastCharIndex = 7; // Index of player8 in CHARACTER_KEYS
          
          // Get the existing sprites for the last character
          const p1LastChar = this.p1Options[lastCharIndex];
          const p2LastChar = this.p2Options[lastCharIndex];
          
          // Use the positions of the existing sprites
          const p1DisaX = p1LastChar ? p1LastChar.x : p1FaceX[3];
          const p2DisaX = p2LastChar ? p2LastChar.x : p2FaceX[3];
          const disaY = p1LastChar ? p1LastChar.y - faceOffsetY : faceY2; // Subtract faceOffsetY to get the circle position
          
          console.log('[D.Isa Patch] D.Isa will replace character at position:', 
            { p1x: p1DisaX, p2x: p2DisaX, y: disaY, lastCharIndex: lastCharIndex });
          
          // Hide the existing character sprites that we're replacing
          if (p1LastChar) p1LastChar.setVisible(false);
          if (p2LastChar) p2LastChar.setVisible(false);
          
          // Create background circles
          const p1DisaBG = this.add.circle(p1DisaX, disaY, faceRadius, 0x222222);
          const p2DisaBG = this.add.circle(p2DisaX, disaY, faceRadius, 0x222222);
          
          // Create D.Isa sprites for both P1 and P2
          const p1DisaSprite = this.add.sprite(p1DisaX, disaY + faceOffsetY, 'player9', 0).setScale(0.18);
          p1DisaSprite.setCrop(0, cropY, frameW, cropH);
          
          const p2DisaSprite = this.add.sprite(p2DisaX, disaY + faceOffsetY, 'player9', 0).setScale(0.18);
          p2DisaSprite.setCrop(0, cropY, frameW, cropH);
          
          // Add D.Isa to the options arrays
          if (!this.p1Options.includes(p1DisaSprite)) {
            this.p1Options.push(p1DisaSprite);
          }
          
          if (!this.p2Options.includes(p2DisaSprite)) {
            this.p2Options.push(p2DisaSprite);
          }
          
          // Find and update the name labels
          // First, find the existing name labels for the character we're replacing
          const nameLabels = this.children.list.filter(child => 
            child.type === 'Text' && 
            child.text && 
            child.text === 'Ivan'
          );
          
          console.log('[D.Isa Patch] Found name labels to replace:', nameLabels.length);
          
          // Update the existing name labels to show D.Isa instead
          nameLabels.forEach(label => {
            label.setText('D.Isa');
            console.log('[D.Isa Patch] Updated name label at position:', { x: label.x, y: label.y });
          });
          
          // If we couldn't find any labels to update, create new ones
          if (nameLabels.length === 0) {
            const nameStyle = {
              fontSize: Math.round(Math.max(12, Math.min(18, screenWidth * 0.025))) + 'px',
              fill: '#ffffff',
              fontStyle: 'bold',
              align: 'center',
              backgroundColor: 'rgba(0,0,0,0.35)'
            };
            
            this.add.text(p1DisaX, disaY + 22, 'D.Isa', nameStyle).setOrigin(0.5).setAlpha(0.8);
            this.add.text(p2DisaX, disaY + 22, 'D.Isa', nameStyle).setOrigin(0.5).setAlpha(0.8);
            console.log('[D.Isa Patch] Created new name labels for D.Isa');
          }
          
          // Make D.Isa interactive based on online mode rules
          // In online mode, only host can select P1 and only client can select P2
          if (this.gameMode !== 'online' || this.isHost) {
            p1DisaSprite.setInteractive();
            p1DisaSprite.on('pointerdown', () => {
              this.selected.p1 = 'player9';
              console.log('[D.Isa Patch] P1 selected D.Isa');
              this.p1Selector.setPosition(p1DisaSprite.x, p1DisaSprite.y - faceOffsetY);
              
              if (this.gameMode === 'online' && window.wsManager && window.wsManager.send) {
                console.log('[D.Isa Patch] Sending P1 D.Isa selection via WebSocket');
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
              console.log('[D.Isa Patch] P2 selected D.Isa');
              this.p2Selector.setPosition(p2DisaSprite.x, p2DisaSprite.y - faceOffsetY);
              
              if (this.gameMode === 'online' && window.wsManager && window.wsManager.send) {
                console.log('[D.Isa Patch] Sending P2 D.Isa selection via WebSocket');
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
          
          console.log('[D.Isa Patch] Added D.Isa to player selection grid for both P1 and P2');
        }
        
        // Add D.Isa's sprite loading
        const originalPreload = playerSelectScene.preload;
        playerSelectScene.preload = function() {
          originalPreload.apply(this, arguments);
          
          // Load D.Isa's sprite if not already loaded
          if (!this.textures.exists('player9_raw')) {
            this.load.image('player9_raw', './sprites-d_isa.png');
            console.log('[D.Isa Patch] Added D.Isa sprite to preload queue');
          }
        };
        
        // Create D.Isa's spritesheet
        const originalCreateScene = playerSelectScene.createScene;
        playerSelectScene.createScene = function() {
          // Call original method first
          originalCreateScene.apply(this, arguments);
          
          // Create D.Isa's spritesheet if it doesn't exist
          if (!this.textures.exists('player9')) {
            console.log('[D.Isa Patch] Creating D.Isa spritesheet');
            const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
            const frameHeight = 512;
            
            if (this.textures.exists('player9_raw')) {
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
              
              console.log('[D.Isa Patch] D.Isa spritesheet created successfully');
              
              // Add D.Isa to the selection grid
              // This is a simplified approach - in a real implementation, 
              // we would need to add it properly to the grid
              const screenWidth = this.cameras.main.width;
              const screenHeight = this.cameras.main.height;
              
              // Create a selectable D.Isa sprite
              const disaSprite = this.add.sprite(
                screenWidth * 0.85, 
                screenHeight * 0.65, 
                'player9', 
                0
              ).setScale(0.3);
              
              // Make it interactive
              disaSprite.setInteractive();
              disaSprite.on('pointerdown', () => {
                console.log('[D.Isa Patch] D.Isa selected');
                
                // Determine which player to update based on game mode and host status
                if (this.gameMode === 'online') {
                  if (this.isHost) {
                    this.selected.p1 = 'player9';
                    if (this.p1Selector) {
                      this.p1Selector.setPosition(disaSprite.x, disaSprite.y);
                    }
                    
                    // Send WebSocket message for player 1 selecting D.Isa
                    if (window.wsManager && window.wsManager.send) {
                      console.log('[D.Isa Patch] Sending P1 D.Isa selection via WebSocket');
                      window.wsManager.send({
                        type: 'character_selected',
                        character: 8, // Index for D.Isa (after the original 8 characters)
                        playerNum: 1
                      });
                    }
                  } else {
                    this.selected.p2 = 'player9';
                    if (this.p2Selector) {
                      this.p2Selector.setPosition(disaSprite.x, disaSprite.y);
                    }
                    
                    // Send WebSocket message for player 2 selecting D.Isa
                    if (window.wsManager && window.wsManager.send) {
                      console.log('[D.Isa Patch] Sending P2 D.Isa selection via WebSocket');
                      window.wsManager.send({
                        type: 'character_selected',
                        character: 8, // Index for D.Isa (after the original 8 characters)
                        playerNum: 2
                      });
                    }
                  }
                } else {
                  // For local mode, just update P2 by default
                  this.selected.p2 = 'player9';
                  if (this.p2Selector) {
                    this.p2Selector.setPosition(disaSprite.x, disaSprite.y);
                  }
                }
              });
              
              // Add D.Isa label
              this.add.text(
                disaSprite.x, 
                disaSprite.y + 80, 
                'D.Isa', 
                {
                  fontSize: '18px',
                  fill: '#ffffff',
                  fontStyle: 'bold',
                  backgroundColor: 'rgba(0,0,0,0.35)'
                }
              ).setOrigin(0.5);
            } else {
              console.error('[D.Isa Patch] player9_raw texture not found');
            }
          }
        };
      }
      
      // Also patch the KidsFightScene to handle D.Isa
      const kidsFightScene = window.game.scene.scenes.find(scene => 
        scene.constructor.name === 'KidsFightScene' || 
        (scene.sys && scene.sys.settings && scene.sys.settings.key === 'KidsFightScene')
      );
      
      if (kidsFightScene) {
        console.log('[D.Isa Patch] KidsFightScene found, patching for D.Isa support');
        
        // Patch the preload method to load D.Isa's sprite if needed
        const originalKFPreload = kidsFightScene.preload;
        kidsFightScene.preload = function() {
          originalKFPreload.apply(this, arguments);
          
          // Load D.Isa's sprite if not already loaded
          if (!this.textures.exists('player9_raw')) {
            this.load.image('player9_raw', './sprites-d_isa.png');
            console.log('[D.Isa Patch] Added D.Isa sprite to KidsFightScene preload');
          }
        };
        
        // Patch the create method to create D.Isa's spritesheet
        const originalKFCreate = kidsFightScene.create;
        kidsFightScene.create = function() {
          // Call original method first
          originalKFCreate.apply(this, arguments);
          
          // Create D.Isa's spritesheet if it doesn't exist
          if (!this.textures.exists('player9')) {
            console.log('[D.Isa Patch] Creating D.Isa spritesheet in KidsFightScene');
            const frameWidths = [300, 300, 400, 460, 500, 400, 400, 400];
            const frameHeight = 512;
            
            if (this.textures.exists('player9_raw')) {
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
              
              console.log('[D.Isa Patch] D.Isa spritesheet created successfully in KidsFightScene');
            }
          }
          
          // Patch the player creation logic to handle player9
          if (this.p1Key === 'player9' || this.p2Key === 'player9') {
            console.log('[D.Isa Patch] D.Isa selected for gameplay, patching player creation');
            
            // Create animations for D.Isa if needed
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
              
              console.log('[D.Isa Patch] Created animations for D.Isa');
            }
          }
        };
      }
    }
  }, 100);
});
