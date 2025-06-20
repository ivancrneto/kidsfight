import Phaser from 'phaser';
import scenario1Img from './scenario1.png';
import scenario2Img from './scenario2.png';
import player1RawImg from './sprites-bento3.png';
import player2RawImg from './sprites-davir3.png';
import player3RawImg from './sprites-jose3.png';
import player4RawImg from './sprites-davis3.png';
import player5RawImg from './sprites-carol3.png';
import player6RawImg from './sprites-roni3.png';
import player7RawImg from './sprites-jacqueline3.png';
import player8RawImg from './sprites-ivan3.png';
import player9RawImg from './sprites-d_isa.png';
import { WebSocketManager } from './websocket_manager'; // This is a singleton instance, not a class
import { tryAttack } from './gameUtils';
import { time } from 'console';
import { SCENARIOS } from './scenario_select_scene';
const getCharacterName = 'getCharacterName';

interface PlayerProps {
  isAttacking: boolean;
  isBlocking: boolean;
  health: number;
  special: number;
  direction: 'left' | 'right';
  walkAnimData?: {
    frameTime: number;
    currentFrame: number;
    frameDelay: number;
  };
}

// Combined Player type with both our properties and Phaser sprite properties
interface Player extends Phaser.Physics.Arcade.Sprite, PlayerProps {
  // Add any additional methods or properties specific to Player
  health: number;
  special: number;
  isBlocking: boolean;
  isAttacking: boolean;
  direction: 'left' | 'right';
  walkAnimData?: {
    frameTime: number;
    currentFrame: number;
    frameDelay: number;
  };
}

interface SceneData {
  selected: { p1: string; p2: string };
  p1: string;
  p2: string;
  p1Char?: string;
  p2Char?: string;
  selectedScenario: string; // Always a string key
  scenario?: string; // Always a string key if present
  roomCode?: string;
  isHost?: boolean;
  gameMode: 'single' | 'online';
  wsManager?: any;
}

// --- Replay/Restart Data Types ---
interface ReplayData {
  action: string;
  [key: string]: any;
}

// Utility: Detect if the screen is in landscape orientation
export function isLandscape(): boolean {
  // In test, window may not exist
  if (typeof window === 'undefined') return true;
  return window.innerWidth > window.innerHeight;
}

// Extracted: Utility to stretch a background image to fill a given area
export function stretchBackgroundToFill(bg: any, width: number, height: number): void {
  if (!bg) return;
  const sprite = bg as Phaser.GameObjects.Sprite;
  sprite.displayWidth = width;
  sprite.displayHeight = height;
}

// Adds a variable width spritesheet to the Phaser texture manager
// Useful for character animations where each frame may have a different width
export function addVariableWidthSpritesheet(
  scene: Phaser.Scene,
  key: string,
  rawKey: string,
  frameWidths: number[],
  frameHeight: number
): void {
  let x = 0;
  // Remove any existing texture with this key
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  // Get the actual image from the cache
  const image = scene.textures.get(rawKey).getSourceImage();
  // Add the raw image as a new texture
  scene.textures.addImage(key, image);
  // Add custom frames
  frameWidths.forEach((width, idx) => {
    scene.textures.get(key).add(idx, 0, x, 0, width, frameHeight);
    x += width;
  });
}

// Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 480;
const MAX_HEALTH = 100; // Each health bar represents this amount of health
const TOTAL_HEALTH = MAX_HEALTH; // Total health per player
const SECONDS_BETWEEN_ATTACKS = 0.5;
const ATTACK_DAMAGE = 5; // Reduced to make game longer (20 hits to win)
const SPECIAL_DAMAGE = 10; // Reduced to maintain 2x ratio
const ATTACK_COOLDOWN = 500; // ms
const SPECIAL_COOLDOWN = 1000; // ms
const SPECIAL_ANIMATION_DURATION = 900; // ms
const REGULAR_ANIMATION_DURATION = 200; // ms
const DEV = true; // Debug mode flag

// Accept Phaser as a constructor parameter for testability
interface GameObject extends Phaser.GameObjects.GameObject {
  text?: string;
  setText?: (text: string) => void;
  setColor?: (color: string) => void;
  setAlpha?: (alpha: number) => void;
  setVisible?: (visible: boolean) => void;
}

interface RemoteAction {
  type: string;
  playerIndex: number;
  direction?: number;
  x?: number;
  y?: number;
  velocityX?: number;
  velocityY?: number;
  flipX?: boolean;
  frame?: number;
  cause?: string;
  knockbackX?: number;
  knockbackY?: number;
  active?: boolean;
  animation?: string;
  health?: number;
}

interface ReplayData {
  // Add any replay-specific data here
}

// Extend WebSocketManager type to include our custom property
declare module './websocket_manager' {
  interface WebSocketManager {
    _cascade_prevScenarioCallback: ((event: MessageEvent) => void) | null;
  }
}

// Add Phaser type declaration to fix TypeScript errors
declare module 'phaser' {
  namespace Phaser {
    interface Scene {
      add: InstanceType<typeof Phaser.GameObjects.GameObjectFactory>;
      physics: InstanceType<typeof Phaser.Physics.Arcade.ArcadePhysics>;
      input: InstanceType<typeof Phaser.Input.InputPlugin>;
      sys: any;
      load: InstanceType<typeof Phaser.Loader.LoaderPlugin>;
    }
  }
}

class KidsFightScene extends Phaser.Scene {
  public ATTACK_DAMAGE: number = 5;
  public SPECIAL_DAMAGE: number = 10;
  playersReady: boolean = false;
  public players: [ (Phaser.Physics.Arcade.Sprite & PlayerProps)?, (Phaser.Physics.Arcade.Sprite & PlayerProps)? ] = [undefined, undefined];
  private platform?: Phaser.GameObjects.Rectangle
  private mainPlatform?: Phaser.GameObjects.Rectangle;
  private background?: Phaser.GameObjects.Image;
  private healthBarBg1?: Phaser.GameObjects.Rectangle;
  private healthBarBg2?: Phaser.GameObjects.Rectangle;
  private healthBar1?: Phaser.GameObjects.Graphics;
  private healthBar2?: Phaser.GameObjects.Graphics;
  private specialPips1: Phaser.GameObjects.Graphics[] = [];
  private specialPips2: Phaser.GameObjects.Graphics[] = [];
  private specialReadyText1?: Phaser.GameObjects.Text;
  private specialReadyText2?: Phaser.GameObjects.Text;
  private wsManager: WebSocketManager = WebSocketManager.getInstance(); // Use the singleton instance
  private selected!: { p1: string; p2: string };
  p1: string = '';
  p2: string = '';
  private selectedScenario!: string;
  private roomCode?: string;
  private isHost?: boolean;
  gameOver: boolean = false;
  private isReady: boolean = false;
  gameMode!: 'single' | 'online';
  private roundStartTime!: number;
  private roundEndTime!: number;
  private lastUpdateTime!: number;
  playerHealth: number[] = [MAX_HEALTH, MAX_HEALTH];
  private playerSpecial: number[] = [0, 0];
  playerDirection: ('left' | 'right')[] = ['right', 'left'];
  isAttacking: boolean[] = [false, false];
  playerBlocking: boolean[] = [false, false];
  lastAttackTime: number[] = [0, 0];
  private lastSpecialTime: number[] = [0, 0];
  private hitEffects: Phaser.GameObjects.Arc[] = [];
  private replayPopupElements: Phaser.GameObjects.GameObject[] = [];
  private touchControlsVisible: boolean = false;
  private touchStartY: number = 0;
  private localPlayerIndex: number = 0;
  private _lastSentPosition: any = null;
  private timeLeft?: number;
  private restarting: boolean = false;
  private replayPopupShown: boolean = false;
  public cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private createTouchControls(): void {
    // Implement the logic to create touch controls
    console.log('Touch controls created');
  }

  private createHitEffect(x: number, y: number): void {
    // Implement the logic to create a hit effect
    console.log('Hit effect created at', x, y);
  }

  // Health bar update method implementation moved to line ~720

  private endGame(winnerIndex: number, message: string = ''): void {
    // Implement the logic to end the game
    console.log('Game ended with winner', winnerIndex, 'and message', message);
  }

  private handleRemoteAction(action: any): void {
    // Handle remote actions from other players
    if (!action) return;
    
    console.log('[KidsFightScene] Handling remote action:', action);
    
    // Get the remote player index (the opposite of our local player)
    const remotePlayerIndex = this.localPlayerIndex === 0 ? 1 : 0;
    
    switch (action.type) {
      case 'move':
        if (this.players[remotePlayerIndex] && action.direction) {
          const velocity = action.direction === 'left' ? -160 : 160;
          this.players[remotePlayerIndex].body.velocity.x = velocity;
          this.players[remotePlayerIndex].flipX = action.direction === 'left';
        }
        break;
        
      case 'jump':
        if (this.players[remotePlayerIndex] && this.players[remotePlayerIndex].body.blocked.down) {
          this.players[remotePlayerIndex].body.velocity.y = -330;
        }
        break;
        
      case 'attack':
        this.tryAction(remotePlayerIndex, 'attack');
        break;
        
      case 'special':
        if (this.playerSpecial[remotePlayerIndex] >= 3) {
          this.tryAction(remotePlayerIndex, 'special');
        }
        break;
        
      case 'block':
        if (this.players[remotePlayerIndex]) {
          this.players[remotePlayerIndex].isBlocking = true;
        }
        break;
        
      case 'position_update':
        if (action.data && this.players[remotePlayerIndex]) {
          const player = this.players[remotePlayerIndex];
          
          // Update position
          if (typeof action.data.x === 'number' && typeof action.data.y === 'number') {
            player.x = action.data.x;
            player.y = action.data.y;
          }
          
          // Update velocity
          if (action.data.velocityX !== undefined && action.data.velocityY !== undefined) {
            player.body.velocity.x = action.data.velocityX;
            player.body.velocity.y = action.data.velocityY;
          }
          
          // Update flip state
          if (action.data.flipX !== undefined) {
            player.flipX = action.data.flipX;
          }
          
          // Update animation if provided
          if (action.data.animKey && player.anims) {
            player.anims.play(action.data.animKey, true);
            
            // If frame is provided, set it
            if (action.data.frame !== undefined && player.anims.currentAnim) {
              player.anims.currentAnim.setCurrentFrame(
                player.anims.currentAnim.frames[action.data.frame] || player.anims.currentAnim.frames[0]
              );
            }
          }
        }
        break;
        
      case 'health_update':
        if (action.data && action.data.playerIndex !== undefined && action.data.health !== undefined) {
          this.playerHealth[action.data.playerIndex] = action.data.health;
          const targetPlayer = this.players[action.data.playerIndex];
          if (targetPlayer) {
            targetPlayer.health = action.data.health;
          }
          this.updateHealthBar(action.data.playerIndex);
        }
        break;
        
      case 'replay_request':
        this.showReplayRequestPopup();
        break;
        
      case 'replay_response':
        if (action.accepted) {
          this.scene.restart();
        }
        break;
    }
  }
  
  private showReplayRequestPopup(): void {
    if (this.replayPopupShown) return;
    this.replayPopupShown = true;
    
    // Create a semi-transparent background
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      400,
      200,
      0x000000,
      0.7
    );
    
    // Add text
    const text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 40,
      'Opponent wants to play again',
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5);
    
    // Add buttons
    const acceptButton = this.add.text(
      this.cameras.main.width / 2 - 60,
      this.cameras.main.height / 2 + 20,
      'Accept',
      { fontSize: '20px', color: '#00ff00', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
    ).setOrigin(0.5).setInteractive();
    
    const declineButton = this.add.text(
      this.cameras.main.width / 2 + 60,
      this.cameras.main.height / 2 + 20,
      'Decline',
      { fontSize: '20px', color: '#ff0000', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
    ).setOrigin(0.5).setInteractive();
    
    // Add event listeners
    acceptButton.on('pointerdown', () => {
      if (this.wsManager) {
        this.wsManager.sendReplayResponse('rematch', true);
      }
      this.scene.restart();
    });
    
    declineButton.on('pointerdown', () => {
      if (this.wsManager) {
        this.wsManager.sendReplayResponse('rematch', false);
      }
      this.hideReplayPopup();
    });
    
    // Store elements to hide them later
    this.replayPopupElements = [bg, text, acceptButton, declineButton];
  }
  
  private hideReplayPopup(): void {
    this.replayPopupElements.forEach(element => element.destroy());
    this.replayPopupElements = [];
    this.replayPopupShown = false;
  }
  
  private handleKeyboardInput(): void {
    if (!this.players[this.localPlayerIndex]) return;
    
    const player = this.players[this.localPlayerIndex];
    const keyboard = this.input.keyboard;
    if (!keyboard || !keyboard.createCursorKeys) return;
    
    const cursors = keyboard.createCursorKeys();
    
    // Handle horizontal movement
    if (this.players[this.localPlayerIndex]) {
      const player = this.players[this.localPlayerIndex];

      // Left movement
      if (this.cursors && this.cursors.left && this.cursors.left.isDown && player && player.body) {
        player.body.velocity.x = -160;
        player.flipX = true;
        
        // Send WebSocket message for online gameplay
        if (this.gameMode === 'online' && this.wsManager) {
          this.wsManager.sendGameAction('move', {direction: 'left'});
        }
      }
      // Right movement
      else if (this.cursors && this.cursors.right && this.cursors.right.isDown && player && player.body) {
        player.body.velocity.x = 160;
        player.flipX = false;
        
        // Send WebSocket message for online gameplay
        if (this.gameMode === 'online' && this.wsManager) {
          this.wsManager.sendGameAction('move', {direction: 'right'});
        }
      }
      // Stop if no horizontal movement
      else if (player && player.body) {
        player.body.velocity.x = 0;
      }
      
      // Jump
      if (this.cursors && this.cursors.up && this.cursors.up.isDown && player && player.body && player.body.blocked && player.body.blocked.down) {
        player.body.velocity.y = -330;
        
        // Send WebSocket message for online gameplay
        if (this.gameMode === 'online' && this.wsManager) {
          this.wsManager.sendGameAction('jump', {});
        }
      }
    }
  }
  
  update(time: number, delta: number): void {
    // Check for a winner
    this.checkWinner();

    // --- Player cross logic ---
    if (this.players[0] && this.players[1]) {
      // If player1 is to the right of player2, swap their directions and flipX
      if ((this.players[0].x ?? 0) > (this.players[1].x ?? 0)) {
        this.players[0].setFlipX(true);
        this.players[1].setFlipX(false);
        this.playerDirection[0] = 'left';
        this.playerDirection[1] = 'right';
      } else {
        this.players[0].setFlipX(false);
        this.players[1].setFlipX(true);
        this.playerDirection[0] = 'right';
        this.playerDirection[1] = 'left';
      }
    }
    
    if (this.gameMode === 'online' && this.wsManager && this.players[this.localPlayerIndex]) {
      const player = this.players[this.localPlayerIndex];
      if (!player) return; // Safety check
      
      // Create position update with null checks
      const curr = {
        x: player.x,
        y: player.y,
        velocityX: player.body?.velocity.x || 0,
        velocityY: player.body?.velocity.y || 0,
        flipX: player.flipX || false,
        frame: (typeof player.frame === 'object' && player.frame !== null && 'name' in player.frame)
          ? player.frame.name
          : (typeof player.frame === 'string' || typeof player.frame === 'number')
            ? player.frame
            : (player.anims?.getFrameName?.() || null),
      };

      if (!this._lastSentPosition ||
        (curr && this._lastSentPosition && (
          curr.x !== this._lastSentPosition.x ||
          curr.y !== this._lastSentPosition.y ||
          curr.velocityX !== this._lastSentPosition.velocityX ||
          curr.velocityY !== this._lastSentPosition.velocityY ||
          curr.flipX !== this._lastSentPosition.flipX ||
          curr.frame !== this._lastSentPosition.frame
        ))) {
        // Use the proper sendPositionUpdate method which ensures reliable sync
        this.wsManager.sendPositionUpdate(
          this.localPlayerIndex,
          curr.x,
          curr.y,
          curr.velocityX,
          curr.velocityY,
          curr.flipX,
          typeof curr.frame === 'number' ? curr.frame : 0
        );
        this._lastSentPosition = { ...curr };
      }
    }
    
    // Handle keyboard input
    this.handleKeyboardInput();
    
    // Update player animations
    if (this.players[0]) {
      this.updatePlayerAnimation(this.players[0], 0);
    }
    
    if (this.players[1]) {
      this.updatePlayerAnimation(this.players[1], 1);
    }
    
    // Reset blocking state each frame
    if (this.players[0]) this.players[0].isBlocking = false;
    if (this.players[1]) this.players[1].isBlocking = false;
  }
  
  private tryAction(playerIndex: number, actionType: string): void {
    // Check if player exists
    if (!this.players[playerIndex]) {
      console.error('[KidsFightScene][tryAction] Player does not exist at index:', playerIndex);
      return;
    }
    
    const now = this.time.now;
    const opponentIndex = playerIndex === 0 ? 1 : 0;
    
    switch(actionType) {
      case 'attack':
        // Check cooldown
        if (now - this.lastAttackTime[playerIndex] < 500) {
          return; // Attack on cooldown
        }
        
        this.lastAttackTime[playerIndex] = now;
        this.players[playerIndex].isAttacking = true;
        
        // Send WebSocket message for online gameplay
        if (this.gameMode === 'online' && playerIndex === this.localPlayerIndex) {
          this.wsManager.sendGameAction('attack', {});
        }
        
        // Perform attack logic
        this.tryAttack(playerIndex, opponentIndex, now, false);
        break;
        
      case 'special':
        // Check if player has enough special meter
        if (this.playerSpecial[playerIndex] < 3) {
          return; // Not enough special meter
        }
        
        this.lastAttackTime[playerIndex] = now;
        if (this.players[playerIndex]) {
          this.players[playerIndex].isAttacking = true;
        }
        
        // Send WebSocket message for online gameplay
        if (this.gameMode === 'online' && playerIndex === this.localPlayerIndex) {
          this.wsManager.sendGameAction('special', {});
        }
        
        // Perform special attack logic
        this.tryAttack(playerIndex, opponentIndex, now, true);
        break;
        
      case 'block':
        // Enable blocking for this player
        const player = this.players[playerIndex];
        if (player) {
          player.isBlocking = true;
        
          // Send WebSocket message for online gameplay
          if (this.gameMode === 'online' && playerIndex === this.localPlayerIndex) {
            this.wsManager.sendGameAction('block', {});
          }
        }
        break;
    }
  }
  
  // Private helper method to check for winner
  // Consolidated checkWinner method
  private checkWinner(): boolean {
    if (this.gameOver) return false;
    const timeLeft = this.timeLeft ?? 0;
    
    if (this.playerHealth[0] <= 0) {
      // Player 2 wins
      this.handleGameEnd(1);
      return true;
    } else if (this.playerHealth[1] <= 0) {
      // Player 1 wins
      this.handleGameEnd(0);
      return true;
    } else if (timeLeft <= 0) {
      // Time's up - determine winner based on health
      if (this.playerHealth[0] > this.playerHealth[1]) {
        // Player 1 wins
        this.handleGameEnd(0);
      } else if (this.playerHealth[1] > this.playerHealth[0]) {
        // Player 2 wins
        this.handleGameEnd(1);
      } else {
        // Draw
        this.handleGameEnd(-1);
      }
      return true;
    }
    return false;
  }
  
  private handleGameEnd(winnerIndex: number): void {
    // Game over logic
    this.gameOver = true;
    
    // Display winner message
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    let message: string;
    if (winnerIndex === -1) {
      message = "It's a draw!";
    } else {
      const winnerName = winnerIndex === 0 ? this.p1 : this.p2;
      message = `${winnerName} wins!`;
    }
    
    // Create game over display
    const overlay = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7);
    
    const winnerText = this.add.text(centerX, centerY - 30, message, {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Add replay button
    if (this.gameMode === 'online') {
      const replayButton = this.add.text(centerX, centerY + 30, 'Request Rematch', {
        fontSize: '24px',
        backgroundColor: '#222222',
        color: '#ffffff',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }).setOrigin(0.5).setInteractive();
      
      replayButton.on('pointerdown', () => {
        if (this.wsManager) {
          this.wsManager.sendReplayRequest('game', 'player', {});
        }
      });
    } else {
      const replayButton = this.add.text(centerX, centerY + 30, 'Play Again', {
        fontSize: '24px',
        backgroundColor: '#222222',
        color: '#ffffff',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }).setOrigin(0.5).setInteractive();
      
      replayButton.on('pointerdown', () => {
        this.scene.restart();
      });
    }
  }
  
  private tryAttack(attackerIndex: number, defenderIndex: number, timestamp: number, isSpecial: boolean): void {
    // Ensure both players exist
    if (!this.players[attackerIndex] || !this.players[defenderIndex]) return;
    
    const attacker = this.players[attackerIndex];
    const defender = this.players[defenderIndex];
    
    // Calculate distance between players
    const distance = Phaser.Math.Distance.Between(attacker.x, attacker.y, defender.x, defender.y);
    
    // Determine attack range
    const attackRange = isSpecial ? 150 : 100;
    
    // Check if in range
    if (distance > attackRange) {
      console.log('Attack out of range');
      return;
    }
    
    // Calculate damage
    let damage = isSpecial ? this.SPECIAL_DAMAGE : this.ATTACK_DAMAGE;
    
    // Check if defender is blocking
    if (defender.isBlocking) {
      // Blocking reduces damage
      damage = Math.floor(damage * 0.3);
    }
    
    // Apply damage
    this.applyDamage(defenderIndex, damage);
    
    // Handle special meter update
    if (isSpecial) {
      // Reset special meter after using special attack
      this.playerSpecial[attackerIndex] = 0;
    } else {
      // Regular attacks build special meter
      this.playerSpecial[attackerIndex] = Math.min(3, this.playerSpecial[attackerIndex] + 0.5);
    }
    
    // Send health update in online mode
    if (this.gameMode === 'online' && this.wsManager && attackerIndex === this.localPlayerIndex) {
      this.wsManager.sendHealthUpdate(defenderIndex, this.playerHealth[defenderIndex]);
    }
  }
  
  private applyDamage(playerIndex: number, damage: number): void {
    // Apply damage to player health
    this.playerHealth[playerIndex] = Math.max(0, this.playerHealth[playerIndex] - damage);
    
    // Update health bar display
    this.updateHealthBar(playerIndex);
    
    // Check for game end
    this.checkWinner();
  }
  
  private updateHealthBar(playerIndex: number): void {
    // Update the health bar UI based on current health
    const healthBar = playerIndex === 0 ? this.healthBar1 : this.healthBar2;
    const healthPercent = this.playerHealth[playerIndex] / MAX_HEALTH;
    
    if (healthBar) {
      healthBar.clear();
      healthBar.fillStyle(0xff0000, 1);
      
      // Draw the health bar (assuming 200 is the width of the full health bar)
      const barWidth = 200 * healthPercent;
      healthBar.fillRect(0, 0, barWidth, 20);
    }
  }
  
  private updatePlayerAnimation(player: Phaser.Physics.Arcade.Sprite, playerIndex: number): void {
    if (!player || !player.body) return;
    
    // Determine player state
    const isMoving = Math.abs(player.body.velocity.x) > 10;
    const isJumping = player.body && player.body.blocked ? !player.body.blocked.down : false;
    const isAttacking = this.isAttacking[playerIndex];
    const isBlocking = this.playerBlocking[playerIndex];
    
    // Apply appropriate animation based on state
    if (isAttacking && player.anims) {
      player.anims.play(`player${playerIndex+1}_attack`, true);
    } else if (isBlocking && player.anims) {
      player.anims.play(`player${playerIndex+1}_block`, true);
    } else if (isJumping && player.anims) {
      player.anims.play(`player${playerIndex+1}_jump`, true);
    } else if (isMoving && player.anims) {
      player.anims.play(`player${playerIndex+1}_run`, true);
    } else if (player.anims) {
      player.anims.play(`player${playerIndex+1}_idle`, true);
    }
  }
  // Only one checkWinner implementation - duplicate removed
  
  private getCharacterName(key: string): string {
    // TODO: Replace with real mapping if you have a display name map
    return key;
  }
  
  private handleGameEnd(winnerIndex: number): void {
    // Game over logic
    this.gameOver = true;
    
    // Display winner message
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    let message: string;
    if (winnerIndex === -1) {
      message = "It's a draw!";
    } else {
      const winnerName = winnerIndex === 0 ? this.p1 : this.p2;
      message = `${winnerName} wins!`;
    }
    
    // Create game over display
    const overlay = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7);
    
    const winnerText = this.add.text(centerX, centerY - 30, message, {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Add replay button
    if (this.gameMode === 'online') {
      const replayButton = this.add.text(centerX, centerY + 30, 'Request Rematch', {
        fontSize: '24px',
        backgroundColor: '#222222',
        color: '#ffffff',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }).setOrigin(0.5).setInteractive();
      
      replayButton.on('pointerdown', () => {
        if (this.wsManager) {
          this.wsManager.sendReplayRequest('game', 'player', {});
        }
      });
    } else {
      const replayButton = this.add.text(centerX, centerY + 30, 'Play Again', {
        fontSize: '24px',
        backgroundColor: '#222222',
        color: '#ffffff',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }).setOrigin(0.5).setInteractive();
      
      replayButton.on('pointerdown', () => {
        this.scene.restart();
      });
    }
  }
}

export default KidsFightScene;