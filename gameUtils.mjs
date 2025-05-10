
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
  // Platform
  // --- PLAYER RESIZE & REPOSITION ---
  // Responsive player scale based on height (max 28% of screen height)
  const playerMaxHeight = 0.28; // 28% of screen height
  const frameHeight = 512;
  let scale = (h * playerMaxHeight) / frameHeight;
  // Clamp scale to not exceed 1 (prevents upscaling on small screens)
  if (scale > 1) scale = 1;
  // Adjust platform/player Y for landscape
  let PLATFORM_Y, PLAYER_PLATFORM_OFFSET;
  // Place player bottoms at 45% of screen height (above middle)
  const playerY = h * 0.45;
  const PLATFORM_HEIGHT = h * 0.045;
  PLATFORM_Y = playerY + PLATFORM_HEIGHT / 2 // Platform top edge at player feet
  PLAYER_PLATFORM_OFFSET = w > h ? 50 : 20;


  // Player X positions (spread further apart)
  const p1X = w * 0.18;
  const p2X = w * 0.82;
  const PLAYER_VERTICAL_OFFSET = 0;





  // Platform
  if (scene.children && scene.children.list) {
    const platformRect = scene.children.list.find(obj => obj.type === 'Rectangle' && obj.fillColor === 0x8B5A2B);
    if (platformRect) {
      if (typeof platformRect.setPosition === 'function' && typeof platformRect.setSize === 'function') {
        platformRect.setPosition(w / 2, PLATFORM_Y);
        platformRect.setSize(w, PLATFORM_HEIGHT);
      } else {
        console.error('[KidsFight] platformRect is missing setPosition or setSize:', platformRect);
      }
      platformRect.displayWidth = w;
      platformRect.displayHeight = PLATFORM_HEIGHT;
    }
    // Also update static physics platform if present
    if (scene.physics && scene.physics.world && scene.physics.world.staticBodies) {
      // Debug: log platform group and children
      console.log('[KidsFight] scene.platform:', scene.platform);
      if (scene.platform && typeof scene.platform.getChildren === 'function') {
        const children = scene.platform.getChildren();
        console.log('[KidsFight] scene.platform children:', children);
        if (children.length === 0) {
          console.error('[KidsFight] scene.platform has no children');
        }
        const plat = children[0];
        if (plat) {
          plat.setDisplaySize(w, PLATFORM_HEIGHT);
          plat.setPosition(w / 2, PLATFORM_Y);
          if (typeof plat.refreshBody === 'function') plat.refreshBody();
          if (plat.body) {
            console.log('[KidsFight] platform.y:', plat.y, 'platform.body.y:', plat.body.y, 'displayHeight:', plat.displayHeight);
          } else {
            console.error('[KidsFight] Platform body missing after refreshBody');
          }
        } else {
          console.error('[KidsFight] No platform child found');
        }
      } else {
        console.error('[KidsFight] scene.platform missing or getChildren not a function');
      }
    }
  }
  // Camera and world bounds
  if (scene.cameras && scene.cameras.main && scene.physics && scene.physics.world) {
    scene.cameras.main.setBounds(0, 0, w, h);
    scene.physics.world.setBounds(0, 0, w, h);
  }

  // Calculate min spacing based on scaled width
  const minSpacing = 0.1 * w + (scene.player1 && scene.player1.displayWidth ? scene.player1.displayWidth : 0);

  if (scene.player1 && typeof scene.player1.setScale === 'function' && typeof scene.player1.setOrigin === 'function') {
    scene.player1.setScale(scale);
    scene.player1.setOrigin(0.5, 1);
    if (scene.player1.body) {
      if (typeof scene.player1.body.setSize === 'function') scene.player1.body.setSize(scene.player1.displayWidth, scene.player1.displayHeight);
      if (typeof scene.player1.body.setOffset === 'function') scene.player1.body.setOffset(0, -scene.player1.displayHeight);
      if (typeof scene.player1.body.updateFromGameObject === 'function') scene.player1.body.updateFromGameObject();
    }
    scene.player1.x = p1X;
    scene.player1.y = playerY;
    console.log('[KidsFight][updateSceneLayout] After setPosition: player1.y:', scene.player1.y, 'player1.body.y:', scene.player1.body && scene.player1.body.y);
    if (scene.player1.body && typeof scene.player1.body.updateFromGameObject === 'function') {
      scene.player1.body.updateFromGameObject();
      console.log('[KidsFight] player1.y:', scene.player1.y, 'player1.body.y:', scene.player1.body.y);
    }
  }
  if (scene.player2 && typeof scene.player2.setScale === 'function' && typeof scene.player2.setOrigin === 'function') {
    scene.player2.setScale(scale);
    scene.player2.setOrigin(0.5, 1);
    if (scene.player2.body) {
      if (typeof scene.player2.body.setSize === 'function') scene.player2.body.setSize(scene.player2.displayWidth, scene.player2.displayHeight);
      if (typeof scene.player2.body.setOffset === 'function') scene.player2.body.setOffset(0, -scene.player2.displayHeight);
      if (typeof scene.player2.body.updateFromGameObject === 'function') scene.player2.body.updateFromGameObject();
    }
    scene.player2.x = p2X;
    scene.player2.y = playerY;
    console.log('[KidsFight][updateSceneLayout] After setPosition: player2.y:', scene.player2.y, 'player2.body.y:', scene.player2.body && scene.player2.body.y);
    if (scene.player2.body && typeof scene.player2.body.updateFromGameObject === 'function') {
      scene.player2.body.updateFromGameObject();
      console.log('[KidsFight] player2.y:', scene.player2.y, 'player2.body.y:', scene.player2.body.y);
    }
    // Ensure players never overlap (optional safety)
    if (scene.player1 && typeof scene.player2.x === 'number' && typeof scene.player1.x === 'number' && Math.abs(scene.player2.x - scene.player1.x) < minSpacing) {
      scene.player2.x = scene.player1.x + minSpacing;
    }
  }
  // Touch controls
  if (typeof scene.updateControlPositions === 'function') {
    scene.updateControlPositions();
  }
  // Health bars
  // Defensive: Health Bar 1 Border
  if (!scene.healthBar1Border || typeof scene.healthBar1Border !== 'object') {
    console.warn('[KidsFight] healthBar1Border is missing or not an object:', scene.healthBar1Border);
  } else if (
    typeof scene.healthBar1Border.setPosition !== 'function' ||
    typeof scene.healthBar1Border.setSize !== 'function'
  ) {
    console.warn('[KidsFight] healthBar1Border.setPosition or setSize is not a function', scene.healthBar1Border, typeof scene.healthBar1Border);
  } else {
    const barWidth = w * 0.25;
    const barHeight = h * 0.05;
    const barY = h * 0.07;
    const bar1X = w * 0.25;
    if (
      scene.healthBar1Border &&
      typeof scene.healthBar1Border.setPosition === 'function' &&
      typeof scene.healthBar1Border.setSize === 'function'
    ) {
      scene.healthBar1Border.setPosition(bar1X, barY).setSize(barWidth + 4, barHeight + 4);
    } else {
      console.error('[KidsFight] Tried to set layout on healthBar1Border but it is null or invalid:', scene.healthBar1Border);
      // Prevent crash: do not call setSize
    }
  }

  // Defensive: Health Bar 2 Border
  if (!scene.healthBar2Border || typeof scene.healthBar2Border !== 'object') {
    console.warn('[KidsFight] healthBar2Border is missing or not an object:', scene.healthBar2Border);
  } else if (
    typeof scene.healthBar2Border.setPosition !== 'function' ||
    typeof scene.healthBar2Border.setSize !== 'function'
  ) {
    console.warn('[KidsFight] healthBar2Border.setPosition or setSize is not a function', scene.healthBar2Border, typeof scene.healthBar2Border);
  } else {
    const barWidth = w * 0.25;
    const barHeight = h * 0.05;
    const barY = h * 0.07;
    const bar2X = w * 0.75;
    if (
      scene.healthBar2Border &&
      typeof scene.healthBar2Border.setPosition === 'function' &&
      typeof scene.healthBar2Border.setSize === 'function'
    ) {
      scene.healthBar2Border.setPosition(bar2X, barY).setSize(barWidth + 4, barHeight + 4);
    } else {
      console.error('[KidsFight] Tried to set layout on healthBar2Border but it is null or invalid:', scene.healthBar2Border);
      // Prevent crash: do not call setSize
    }
  }

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
  // Special ready circles (big S) - match main.js create()
  if (scene.specialReady1 && typeof scene.specialReady1.setPosition === 'function' && typeof scene.specialReady1.setRadius === 'function') {
    const r = Math.max(20, h * 0.045);
    const x = w * 0.25;
    const y = h * 0.13;
    scene.specialReady1.setPosition(x, y).setRadius(r);
  }
  if (scene.specialReadyText1 && typeof scene.specialReadyText1.setPosition === 'function') {
    const x = w * 0.25;
    const y = h * 0.13;
    scene.specialReadyText1.setPosition(x, y);
  }
  if (scene.specialReady2 && typeof scene.specialReady2.setPosition === 'function' && typeof scene.specialReady2.setRadius === 'function') {
    const r = Math.max(20, h * 0.045);
    const x = w * 0.75;
    const y = h * 0.13;
    scene.specialReady2.setPosition(x, y).setRadius(r);
  }
  if (scene.specialReadyText2 && typeof scene.specialReadyText2.setPosition === 'function') {
    const x = w * 0.75;
    const y = h * 0.13;
    scene.specialReadyText2.setPosition(x, y);
  }
  // Timer text
  if (scene.timerText && typeof scene.timerText.setFontSize === 'function' && typeof scene.timerText.setPosition === 'function') {
    const fontSize = Math.max(32, Math.round(w * 0.045));
    scene.timerText.setFontSize(fontSize + 'px');
    scene.timerText.setPosition(w / 2, h * 0.11);
  }
}

// CSS application logic for game canvas and parent
function applyGameCss() {
  const canvas = document.querySelector('canvas');
  const parent = document.getElementById('game-container');
  if (canvas) {
    canvas.style.position = 'fixed';
    canvas.style.left = 'env(safe-area-inset-left, 0px)';
    canvas.style.top = 'env(safe-area-inset-top, 0px)';
    canvas.style.width = 'calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))';
    canvas.style.height = 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))';
    canvas.style.maxWidth = '100vw';
    canvas.style.maxHeight = '100vh';
    canvas.style.objectFit = 'contain';
    canvas.style.background = '#222';
  }
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
 * Game utilities used across different files (ESM version)
 */

// Update scene layout based on screen size
export function updateSceneLayout(scene) {
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
export function applyGameCss() {
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

// Export the functions - ES modules only
export { updateSceneLayout, applyGameCss, tryAttack };
