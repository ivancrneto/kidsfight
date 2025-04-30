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
  // Timer text
  if (scene.timerText) {
    scene.timerText.setPosition(w / 2, 50);
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
  if (!attacker || !defender) return;
  const ATTACK_RANGE = 100;
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
  defender.health -= special ? 30 : 10;
  // console.log('[DEBUG] tryAttack: Defender health after attack:', defender.health);
  if (scene.cameras && scene.cameras.main && typeof scene.cameras.main.shake === 'function') {
    scene.cameras.main.shake(special ? 250 : 100, special ? 0.03 : 0.01);
  }
}

module.exports = {
  updateSceneLayout,
  applyGameCss,
  tryAttack,
};
