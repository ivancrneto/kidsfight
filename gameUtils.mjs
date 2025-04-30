// Pure game logic utilities for KidsFightScene

// Layout update logic for scene objects
function updateSceneLayout(scene) {
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
  if (scene.children && scene.children.list) {
    const platformRect = scene.children.list.find(obj => obj.type === 'Rectangle' && obj.fillColor === 0x8B5A2B);
    if (platformRect) {
      platformRect.setPosition(w / 2, 230 + 20 / 2);
      platformRect.displayWidth = w;
    }
  }
  // Camera and world bounds
  if (scene.cameras && scene.cameras.main && scene.physics && scene.physics.world) {
    scene.cameras.main.setBounds(0, 0, w, h);
    scene.physics.world.setBounds(0, 0, w, h);
  }
  // Touch controls
  if (typeof scene.updateControlPositions === 'function') {
    scene.updateControlPositions();
  }
  // Health bars
  if (scene.healthBar1 && scene.healthBar2 && scene.healthBar1Border && scene.healthBar2Border) {
    // Bar width: 25% of screen width, height: 5% of height
    const barWidth = w * 0.25;
    const barHeight = h * 0.05;
    const barY = h * 0.07;
    const bar1X = w * 0.25;
    const bar2X = w * 0.75;
    scene.healthBar1Border.setPosition(bar1X, barY).setSize(barWidth + 4, barHeight + 4);
    scene.healthBar2Border.setPosition(bar2X, barY).setSize(barWidth + 4, barHeight + 4);
    scene.healthBar1.setPosition(bar1X, barY).setSize(barWidth, barHeight);
    scene.healthBar2.setPosition(bar2X, barY).setSize(barWidth, barHeight);
  }
  // Special pips (3 per player) - match main.js create()
  if (scene.specialPips1 && scene.specialPips2) {
    const barY = h * 0.07;
    const pipY = barY - h * 0.035; // slightly above health bar
    const pipR = Math.max(10, h * 0.018); // match create()
    // Player 1: left, spaced 30px apart at 800px width
    for (let i = 0; i < 3; i++) {
      const pip1X = w * 0.25 - pipR * 3 + i * pipR * 3;
      if (scene.specialPips1[i]) scene.specialPips1[i].setPosition(pip1X, pipY).setRadius(pipR);
    }
    // Player 2: right, spaced 30px apart at 800px width
    for (let i = 0; i < 3; i++) {
      const pip2X = w * 0.75 - pipR * 3 + i * pipR * 3;
      if (scene.specialPips2[i]) scene.specialPips2[i].setPosition(pip2X, pipY).setRadius(pipR);
    }
  }
  // Special ready circles (big S) - match main.js create()
  if (scene.specialReady1 && scene.specialReadyText1) {
    const r = Math.max(20, h * 0.045);
    const x = w * 0.25;
    const y = h * 0.13;
    scene.specialReady1.setPosition(x, y).setRadius(r);
    scene.specialReadyText1.setPosition(x, y);
  }
  if (scene.specialReady2 && scene.specialReadyText2) {
    const r = Math.max(20, h * 0.045);
    const x = w * 0.75;
    const y = h * 0.13;
    scene.specialReady2.setPosition(x, y).setRadius(r);
    scene.specialReadyText2.setPosition(x, y);
  }
  // Timer text
  if (scene.timerText) {
    // Font size: min 32px, but scale up for large screens (e.g. 4vw)
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

// tryAttack logic (simplified for testability)
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
  scene.playerHealth[defenderIdx] = (typeof scene.playerHealth[defenderIdx] === 'number' ? scene.playerHealth[defenderIdx] : 100) - (special ? 30 : 10);
  console.log('[TRYATTACK] playerHealth after:', scene.playerHealth[defenderIdx]);
  if (scene.cameras && scene.cameras.main && typeof scene.cameras.main.shake === 'function') {
    scene.cameras.main.shake(special ? 250 : 100, special ? 0.03 : 0.01);
  }
}

export { updateSceneLayout, applyGameCss, tryAttack };
