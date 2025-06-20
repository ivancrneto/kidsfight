console.log('LOADED: gameUtils.cjs - TOP LEVEL');

// LOADED FROM gameUtils.cjs - TEST UNIQUE LOG
console.log('LOADED FROM gameUtils.cjs - TEST UNIQUE LOG');

// CommonJS version of gameUtils for Jest tests

// Pure game logic utilities for KidsFightScene

// Layout update logic for scene objects
function updateSceneLayout(scene) {

  // DEBUG: Top-level entry log
  console.log('FUNC: Entered updateSceneLayout');

  // DEBUG: Log scale, width, height at the start
  console.log('FUNC: scene.scale:', scene.scale);
  if (scene.scale) {
    console.log('FUNC: scene.scale.width:', scene.scale.width);
    console.log('FUNC: scene.scale.height:', scene.scale.height);
  }

  // DEBUG: Log player1/player2/platform and their setPosition before layout logic
  console.log('FUNC: scene.player1:', scene.player1, 'setPosition:', scene.player1 && scene.player1.setPosition);
  console.log('FUNC: scene.player2:', scene.player2, 'setPosition:', scene.player2 && scene.player2.setPosition);
  console.log('FUNC: scene.platform:', scene.platform, 'setPosition:', scene.platform && scene.platform.setPosition, 'setSize:', scene.platform && scene.platform.setSize);

  // Defensive: Only update layout if scene is fully initialized
  if (!scene.isReady) {
    // Uncomment for debugging:
    // console.warn('[KidsFight] updateSceneLayout called before scene is ready');
    return;
  }
  const w = scene.scale.width;
  const h = scene.scale.height;
  // Background
  if (scene.children && scene.children.list) {
    const bg = scene.children.list.find(obj => obj.texture && obj.texture.key === 'scenario1');
    if (bg) {
      console.log('FUNC: Calling bg.setPosition with', w / 2, h / 2);
      bg.setPosition(w / 2, h / 2);
      console.log('FUNC: Calling bg.displayWidth with', w);
      bg.displayWidth = w;
      console.log('FUNC: Calling bg.displayHeight with', h);
      bg.displayHeight = h;
    }
  }

  // Player positions
  // Players should be positioned at 30% and 70% of screen width
  // Their Y position should be such that their bottom is at 45% of screen height
  const playerY = h * 0.45;
  const p1X = w * 0.3;
  const p2X = w * 0.7;

  // Defensive: Player 1
  if (scene.player1 && typeof scene.player1 === 'object' && typeof scene.player1.setPosition === 'function') {
    console.log('FUNC: Calling player1.setPosition with', p1X, playerY);
    scene.player1.setPosition(p1X, playerY);
  } else {
    console.log('FUNC: Skipping player1.setPosition');
  }

  // Defensive: Player 2
  if (scene.player2 && typeof scene.player2 === 'object' && typeof scene.player2.setPosition === 'function') {
    console.log('FUNC: Calling player2.setPosition with', p2X, playerY);
    scene.player2.setPosition(p2X, playerY);
  } else {
    console.log('FUNC: Skipping player2.setPosition');
  }

  // Platform
  // Platform should be positioned directly below the players
  // Its Y position should be such that its top is at the player's bottom
  const PLATFORM_HEIGHT = h * 0.045;
  const PLATFORM_Y = playerY + PLATFORM_HEIGHT / 2;

  // Defensive: Platform
  if (scene.platform && typeof scene.platform === 'object') {
    if (typeof scene.platform.setPosition === 'function') {
      console.log('FUNC: Calling platform.setPosition with', w / 2, PLATFORM_Y);
      scene.platform.setPosition(w / 2, PLATFORM_Y);
    } else {
      console.log('FUNC: Skipping platform.setPosition');
    }
    if (typeof scene.platform.setSize === 'function') {
      console.log('FUNC: Calling platform.setSize with', w, PLATFORM_HEIGHT);
      scene.platform.setSize(w, PLATFORM_HEIGHT);
    } else {
      console.log('FUNC: Skipping platform.setSize');
    }
  } else {
    console.log('FUNC: Skipping platform logic');
  }

  // Health bars
  // Defensive: Health Bar 1
  if (scene.healthBar1 && typeof scene.healthBar1 === 'object') {
    if (typeof scene.healthBar1.setPosition === 'function') {
      console.log('FUNC: Calling healthBar1.setPosition with', w * 0.25, h * 0.07);
      scene.healthBar1.setPosition(w * 0.25, h * 0.07);
    } else {
      console.log('FUNC: Skipping healthBar1.setPosition');
    }
    if (typeof scene.healthBar1.setSize === 'function') {
      console.log('FUNC: Calling healthBar1.setSize with', w * 0.25, h * 0.05);
      scene.healthBar1.setSize(w * 0.25, h * 0.05);
    } else {
      console.log('FUNC: Skipping healthBar1.setSize');
    }
  } else {
    console.log('FUNC: Skipping healthBar1 logic');
  }

  // Defensive: Health Bar 2
  if (scene.healthBar2 && typeof scene.healthBar2 === 'object') {
    if (typeof scene.healthBar2.setPosition === 'function') {
      console.log('FUNC: Calling healthBar2.setPosition with', w * 0.75, h * 0.07);
      scene.healthBar2.setPosition(w * 0.75, h * 0.07);
    } else {
      console.log('FUNC: Skipping healthBar2.setPosition');
    }
    if (typeof scene.healthBar2.setSize === 'function') {
      console.log('FUNC: Calling healthBar2.setSize with', w * 0.25, h * 0.05);
      scene.healthBar2.setSize(w * 0.25, h * 0.05);
    } else {
      console.log('FUNC: Skipping healthBar2.setSize');
    }
  } else {
    console.log('FUNC: Skipping healthBar2 logic');
  }
  // Special pips (3 per player) - match main.js create()
  if (scene.specialPips1 && Array.isArray(scene.specialPips1)) {
    const barY = h * 0.07;
    const pipY = barY - h * 0.035; // slightly above health bar
    const pipR = Math.max(10, h * 0.018); // match create()
    for (let i = 0; i < 3; i++) {
      const pip1X = w * 0.25 - pipR * 3 + i * pipR * 3;
      const pip = scene.specialPips1[i];
      if (pip && typeof pip.setPosition === 'function' && typeof pip.setRadius === 'function') {
        console.log('FUNC: Calling pip.setPosition with', pip1X, pipY);
        pip.setPosition(pip1X, pipY);
        console.log('FUNC: Calling pip.setRadius with', pipR);
        pip.setRadius(pipR);
      }
    }
  }
  if (scene.specialPips2 && Array.isArray(scene.specialPips2)) {
    const barY = h * 0.07;
    const pipY = barY - h * 0.035;
    const pipR = Math.max(10, h * 0.018);
    for (let i = 0; i < 3; i++) {
      const pip2X = w * 0.75 - pipR * 3 + i * pipR * 3;
      const pip = scene.specialPips2[i];
      if (pip && typeof pip.setPosition === 'function' && typeof pip.setRadius === 'function') {
        console.log('FUNC: Calling pip.setPosition with', pip2X, pipY);
        pip.setPosition(pip2X, pipY);
        console.log('FUNC: Calling pip.setRadius with', pipR);
        pip.setRadius(pipR);
      }
    }
  }

  // Timer text
  if (scene.timerText && typeof scene.timerText.setPosition === 'function') {
    console.log('FUNC: Calling timerText.setPosition with', w / 2, h * 0.07);
    scene.timerText.setPosition(w / 2, h * 0.07);
  }
}

// Apply CSS to game container
function applyGameCss() {
  const parent = document.getElementById('game-container');
  if (parent) {
    parent.style.position = 'fixed';
    parent.style.left = 'env(safe-area-inset-left, 0px)';
    parent.style.top = 'env(safe-area-inset-top, 0px)';
    parent.style.width = '100vw';
    parent.style.height = '100vh';
    parent.style.background = '#222';
    parent.style.overflow = 'hidden';
  }
}

/**
 * Game utilities used across different files
 */

// Removed duplicate updateSceneLayout function that was causing test issues.
// The correct version is defined earlier in this file.

// Redundant module.exports removed. The main one is at the end of the file.
function tryAttack(scene, attackerIdx, defenderIdx, now, special) {
  if (
    typeof attackerIdx !== 'number' ||
    typeof defenderIdx !== 'number' ||
    attackerIdx < 0 ||
    defenderIdx < 0 ||
    !scene.players ||
    !scene.players[attackerIdx] ||
    !scene.players[defenderIdx]
  ) {
    console.error('[TRYATTACK] Invalid indices or players', { attackerIdx, defenderIdx, players: scene.players });
    return;
  }
  const attacker = scene.players[attackerIdx];
  const defender = scene.players[defenderIdx];
  if (!attacker || !defender) {
    console.error('[TRYATTACK] Invalid attacker or defender', attackerIdx, defenderIdx, scene.players);
    return;
  }
  const ATTACK_RANGE = 180;
  const ATTACK_COOLDOWN = 500;
  if (!scene.lastAttackTime) scene.lastAttackTime = [0, 0];
  if (!scene.attackCount) scene.attackCount = [0, 0];
  if (now - scene.lastAttackTime[attackerIdx] < ATTACK_COOLDOWN) {
    return;
  }
  if (Math.abs(attacker.x - defender.x) > ATTACK_RANGE) {
    return;
  }
  scene.lastAttackTime[attackerIdx] = now;
  scene.attackCount[attackerIdx]++;
  const damage = special ? (scene.SPECIAL_DAMAGE ?? 30) : (scene.DAMAGE ?? 10);
  scene.playerHealth[defenderIdx] = Math.max(0, (typeof scene.playerHealth[defenderIdx] === 'number' ? scene.playerHealth[defenderIdx] : 100) - damage);
  console.log('[TRYATTACK] playerHealth after:', scene.playerHealth[defenderIdx]);
  if (scene.cameras && scene.cameras.main && typeof scene.cameras.main.shake === 'function') {
    scene.cameras.main.shake(special ? 250 : 100, special ? 0.03 : 0.01);
  }
}

// Mock KidsFightScene class for testing
class KidsFightScene {
  constructor() {
    this.gameOver = false;
    this.playerHealth = [100, 100];
    this.p1SpriteKey = 'player1';
    this.p2SpriteKey = 'player2';
    this.timeLeft = 60;
    this.isReady = true;
    this.scale = { width: 800, height: 600 };
    
    // Mock Phaser objects
    this.add = {
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis()
      }),
      rectangle: jest.fn().mockReturnValue({
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn()
      })
    };
    
    this.tweens = {
      add: jest.fn()
    };
    
    this.scene = {
      start: jest.fn()
    };
  }
  
  // Helper method to get character name from sprite key
  getCharacterName(spriteKey) {
    switch(spriteKey) {
      case 'player1': return 'Bento';
      case 'player2': return 'Davi R';
      case 'player3': return 'José';
      case 'player4': return 'Davi S';
      case 'player5': return 'Carol';
      case 'player6': return 'Roni';
      case 'player7': return 'Jacqueline';
      case 'player8': return 'Ivan';
      default: return 'Jogador';
    }
  }
  
  // Updated checkWinner method for test mock to match main implementation
  checkWinner() {
    if (this.gameOver) return;
    if (this.playerHealth[0] <= 0) {
      // Player 2 won
      const winner = this.getCharacterName(this.p2SpriteKey);
      this.endGame(1, `${winner} Venceu!`);
      return true;
    } else if (this.playerHealth[1] <= 0) {
      // Player 1 won
      const winner = this.getCharacterName(this.p1SpriteKey);
      this.endGame(0, `${winner} Venceu!`);
      return true;
    } else if (this.timeLeft <= 0) {
      // Time's up - check who has more health
      if (this.playerHealth[0] > this.playerHealth[1]) {
        const winner = this.getCharacterName(this.p1SpriteKey);
        this.endGame(0, `${winner} Venceu!`);
      } else if (this.playerHealth[1] > this.playerHealth[0]) {
        const winner = this.getCharacterName(this.p2SpriteKey);
        this.endGame(1, `${winner} Venceu!`);
      } else {
        this.endGame(-1, 'Empate!');
      }
      return true;
    }
    return false;
  }
  
  // Updated endGame method for test mock to match main implementation
  endGame(winnerIndex, message) {
    this.gameOver = true;
    this.gameOverMessage = message;
    // Reset velocities and set frames/angles as in main code
    if (this.players && this.players[0] && this.players[1]) {
      [0, 1].forEach(i => {
        this.players[i].setVelocityX?.(0);
        this.players[i].setVelocityY?.(0);
        this.players[i].body?.setVelocityX?.(0);
        this.players[i].body?.setVelocityY?.(0);
      });
      if (winnerIndex === 0) {
        this.players[0].setFrame?.(3);
        this.players[1].setAngle?.(90);
      } else if (winnerIndex === 1) {
        this.players[1].setFrame?.(3);
        this.players[0].setAngle?.(90);
      }
      // For draw (winnerIndex === -1), do NOT call setFrame or setAngle
    }
    if (this.add?.text) {
      this.add.text(400, 300, message, {
        fontSize: '48px',
        color: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
      }).setOrigin(0.5).setDepth(1000);
    }
    if (this.add?.rectangle) {
      const playAgainBtn = this.add.rectangle(400, 350, 200, 50, 0x00ff00);
      playAgainBtn.setInteractive?.();
      if (playAgainBtn.on && this.scene?.start) {
        playAgainBtn.on('pointerdown', () => {
          this.scene.start('PlayerSelectScene');
        });
      }
    }
  }
}

// CommonJS exports
module.exports = { updateSceneLayout, applyGameCss, tryAttack, KidsFightScene };
