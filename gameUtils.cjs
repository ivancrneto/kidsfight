// CommonJS version of gameUtils for Jest tests

// Pure game logic utilities for KidsFightScene

// Layout update logic for scene objects
function updateSceneLayout(scene) {

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
      bg.setPosition(w / 2, h / 2);
      bg.displayWidth = w;
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
  if (!scene.player1 || typeof scene.player1 !== 'object') {
    console.warn('[KidsFight] player1 is missing or not an object:', scene.player1);
  } else if (
    typeof scene.player1.setPosition !== 'function'
  ) {
    console.warn('[KidsFight] player1.setPosition is not a function', scene.player1, typeof scene.player1);
  } else {
    scene.player1.setPosition(p1X, playerY);
  }

  // Defensive: Player 2
  if (!scene.player2 || typeof scene.player2 !== 'object') {
    console.warn('[KidsFight] player2 is missing or not an object:', scene.player2);
  } else if (
    typeof scene.player2.setPosition !== 'function'
  ) {
    console.warn('[KidsFight] player2.setPosition is not a function', scene.player2, typeof scene.player2);
  } else {
    scene.player2.setPosition(p2X, playerY);
  }

  // Platform
  // Platform should be positioned directly below the players
  // Its Y position should be such that its top is at the player's bottom
  const PLATFORM_HEIGHT = h * 0.045;
  const PLATFORM_Y = playerY + PLATFORM_HEIGHT / 2;

  // Defensive: Platform
  if (!scene.platform || typeof scene.platform !== 'object') {
    console.warn('[KidsFight] platform is missing or not an object:', scene.platform);
  } else if (
    typeof scene.platform.setPosition !== 'function' ||
    typeof scene.platform.setSize !== 'function'
  ) {
    console.warn('[KidsFight] platform.setPosition or setSize is not a function', scene.platform, typeof scene.platform);
  } else {
    scene.platform.setPosition(w / 2, PLATFORM_Y).setSize(w, PLATFORM_HEIGHT);
  }

  // Health bars
  // Defensive: Health Bar 1
  if (!scene.healthBar1 || typeof scene.healthBar1 !== 'object') {
    console.warn('[KidsFight] healthBar1 is missing or not an object:', scene.healthBar1);
  } else if (
    typeof scene.healthBar1.setPosition !== 'function' ||
    typeof scene.healthBar1.setSize !== 'function'
  ) {
    console.warn('[KidsFight] healthBar1.setPosition or setSize is not a function', scene.healthBar1, typeof scene.healthBar1);
  } else {
    const barWidth = w * 0.25;
    const barHeight = h * 0.05;
    const barY = h * 0.07;
    const bar1X = w * 0.25;
    if (scene.healthBar1 && typeof scene.healthBar1.setPosition === 'function' && typeof scene.healthBar1.setSize === 'function') {
      scene.healthBar1.setPosition(bar1X, barY).setSize(barWidth, barHeight);
    } else {
      console.error('[KidsFight] Tried to set layout on healthBar1 but it is null or invalid:', scene.healthBar1);
    }
  }

  // Defensive: Health Bar 2
  if (!scene.healthBar2 || typeof scene.healthBar2 !== 'object') {
    console.warn('[KidsFight] healthBar2 is missing or not an object:', scene.healthBar2);
  } else if (
    typeof scene.healthBar2.setPosition !== 'function' ||
    typeof scene.healthBar2.setSize !== 'function'
  ) {
    console.warn('[KidsFight] healthBar2.setPosition or setSize is not a function', scene.healthBar2, typeof scene.healthBar2);
  } else {
    const barWidth = w * 0.25;
    const barHeight = h * 0.05;
    const barY = h * 0.07;
    const bar2X = w * 0.75;
    if (scene.healthBar2 && typeof scene.healthBar2.setPosition === 'function' && typeof scene.healthBar2.setSize === 'function') {
      scene.healthBar2.setPosition(bar2X, barY).setSize(barWidth, barHeight);
    } else {
      console.error('[KidsFight] Tried to set layout on healthBar2 but it is null or invalid:', scene.healthBar2);
    }
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
        pip.setPosition(pip1X, pipY).setRadius(pipR);
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
        pip.setPosition(pip2X, pipY).setRadius(pipR);
      }
    }
  }

  // Timer text
  if (scene.timerText && typeof scene.timerText.setPosition === 'function') {
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

// Update scene layout based on screen size
function updateSceneLayout(scene) {
  if (!scene || !scene.cameras || !scene.cameras.main) return false;
  
  const cam = scene.cameras.main;
  
  // Get current screen dimensions
  const width = cam.width;
  const height = cam.height;
  
  console.log('[GameUtils] Updating scene layout for dimensions:', width, 'x', height);
  
  // Set world and camera bounds to match screen size
  if (scene.physics && scene.physics.world) {
    scene.physics.world.setBounds(0, 0, width, height);
  }
  
  cam.setBounds(0, 0, width, height);
  
  // Update touch controls if they exist
  if (typeof scene.updateControlPositions === 'function') {
    scene.updateControlPositions();
  }
  
  return true;
}

// Apply game CSS to the page
function applyGameCss() {
  if (typeof document === 'undefined') return false;
  
  // Add CSS to ensure the game canvas fills the viewport properly
  const style = document.createElement('style');
  style.textContent = `
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      overflow: hidden;
    }
    canvas {
      display: block;
      margin: 0 auto;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  `;
  document.head.appendChild(style);
  
  return true;
}

module.exports = {
  updateSceneLayout,
  applyGameCss
};
function tryAttack(scene, playerIdx, attacker, defender, now, special) {
  // Robustly determine defenderIdx
  let defenderIdx = undefined;
  if (defender === scene.player1) defenderIdx = 0;
  else if (defender === scene.player2) defenderIdx = 1;
  else {
    console.error('[TRYATTACK] Could not determine defenderIdx!', defender, scene.player1, scene.player2);
    return;
  }
  console.log('[TRYATTACK] defenderIdx:', defenderIdx, 'playerHealth before:', scene.playerHealth[defenderIdx]);
  if (!attacker || !defender) return;
  const ATTACK_RANGE = 180;
  const ATTACK_COOLDOWN = 500;
  if (!scene.lastAttackTime) scene.lastAttackTime = [0, 0];
  if (!scene.attackCount) scene.attackCount = [0, 0];
  if (now - scene.lastAttackTime[playerIdx] < ATTACK_COOLDOWN) {
    // console.log('[DEBUG] tryAttack: Attack on cooldown for player', playerIdx);
    return;
  }
  if (Math.abs(attacker.x - defender.x) > ATTACK_RANGE) {
    // console.log('[DEBUG] tryAttack: Out of range. Attacker x:', attacker.x, 'Defender x:', defender.x);
    return;
  }
  scene.lastAttackTime[playerIdx] = now;
  scene.attackCount[playerIdx]++;
  scene.playerHealth[defenderIdx] = Math.max(0, (typeof scene.playerHealth[defenderIdx] === 'number' ? scene.playerHealth[defenderIdx] : 100) - (special ? 30 : 10));
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
  
  // Simplified checkWinner method for testing
  checkWinner() {
    if (this.gameOver) return;
    
    if (this.playerHealth[0] <= 0) {
      // Player 2 won
      const winner = this.getCharacterName(this.p2SpriteKey);
      this.endGame(`${winner} Venceu!`);
      return true;
    } else if (this.playerHealth[1] <= 0) {
      // Player 1 won
      const winner = this.getCharacterName(this.p1SpriteKey);
      this.endGame(`${winner} Venceu!`);
      return true;
    } else if (this.timeLeft <= 0) {
      // Time's up - check who has more health
      if (this.playerHealth[0] > this.playerHealth[1]) {
        const winner = this.getCharacterName(this.p1SpriteKey);
        this.endGame(`${winner} Venceu!`);
      } else if (this.playerHealth[1] > this.playerHealth[0]) {
        const winner = this.getCharacterName(this.p2SpriteKey);
        this.endGame(`${winner} Venceu!`);
      } else {
        this.endGame('Empate!');
      }
      return true;
    }
    
    return false;
  }
  
  // Simplified endGame method for testing
  endGame(message) {
    this.gameOver = true;
    this.gameOverMessage = message;
    this.add.text(400, 300, message, {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5).setDepth(1000);
    
    const playAgainBtn = this.add.rectangle(400, 350, 200, 50, 0x00ff00);
    playAgainBtn.setInteractive();
    playAgainBtn.on('pointerdown', () => {
      this.scene.start('PlayerSelectScene');
    });
  }
}

// CommonJS exports
module.exports = { updateSceneLayout, applyGameCss, tryAttack, KidsFightScene };
