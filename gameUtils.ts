import Phaser from 'phaser';

interface GameObject extends Phaser.GameObjects.GameObject {
  setPosition: (x: number, y: number) => void;
  health?: number;
  special?: number;
  x: number;
  y: number;
  setSize?: (width: number, height: number) => void;
  setScale?: (scale: number) => void;
  setAlpha?: (alpha: number) => void;
  setVisible?: (visible: boolean) => void;
  setTint?: (tint: number) => void;
  setTexture?: (texture: string) => void;
  setFrame?: (frame: number) => void;
}

interface GameScene extends Phaser.Scene {
  scale: Phaser.Scale.ScaleManager;
  isReady?: boolean;
  players?: GameObject[];
  platform?: GameObject;
  background?: GameObject;
  healthBarBg1?: GameObject;
  healthBarBg2?: GameObject;
  healthBar1?: GameObject;
  healthBar2?: GameObject;
  specialBarBg1?: GameObject;
  specialBarBg2?: GameObject;
  specialBar1?: GameObject;
  specialBar2?: GameObject;
  p1Name?: Phaser.GameObjects.Text;
  p2Name?: Phaser.GameObjects.Text;
  p1HealthText?: Phaser.GameObjects.Text;
  p2HealthText?: Phaser.GameObjects.Text;
  p1SpecialText?: Phaser.GameObjects.Text;
  p2SpecialText?: Phaser.GameObjects.Text;
  winnerText?: Phaser.GameObjects.Text;
  readyText?: Phaser.GameObjects.Text;
  countdownText?: Phaser.GameObjects.Text;
  playerHealth?: number[];
  playerSpecial?: number[];
}

// Function to apply CSS to the game container
export function applyGameCss(): void {
  const parent = document.getElementById('game-container');
  if (!parent) return;
  
  parent.style.position = 'fixed';
  parent.style.top = '0';
  parent.style.left = '0';
  parent.style.width = '100vw';
  parent.style.height = '100vh';
  parent.style.margin = '0';
  parent.style.padding = '0';
  parent.style.overflow = 'hidden';
  parent.style.background = '#222';
  
  // Make sure all canvas elements are properly sized
  const canvases = parent.querySelectorAll('canvas');
  if (canvases.length) {
    for (let canvas of canvases) {
      canvas.style.display = 'block';
      canvas.style.maxWidth = '100vw';
      canvas.style.maxHeight = '100vh';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.margin = '0 auto';
    }
  }
}

// Function to update scene layout
export function updateSceneLayout(scene: any): void {
  console.log('DEBUG:updateSceneLayout: called with scene:', scene);
  if (!scene || !scene.scale) {
    console.log('DEBUG:updateSceneLayout: scene or scene.scale missing');
    return;
  }
  const w = scene.scale.width;
  const h = scene.scale.height;
  console.log('DEBUG:updateSceneLayout: w,h =', w, h);
  const isLandscape = w > h;
  
  // Position players and platform based on new dimensions
  const playerY = h * 0.45;
  const platformHeight = h * 0.045;
  const platformY = playerY + platformHeight / 2;

  if (scene.players && scene.players[0] && scene.players[0].setPosition) {
    console.log('DEBUG:updateSceneLayout: calling player1.setPosition with', w * 0.3, playerY);
    scene.players[0].setPosition(w * 0.3, playerY);
  } else {
    console.log('DEBUG:updateSceneLayout: player1 or setPosition missing', scene.players);
  }
  
  if (scene.players && scene.players[1] && scene.players[1].setPosition) {
    console.log('DEBUG:updateSceneLayout: calling player2.setPosition with', w * 0.7, playerY);
    scene.players[1].setPosition(w * 0.7, playerY);
  } else {
    console.log('DEBUG:updateSceneLayout: player2 or setPosition missing', scene.players);
  }
  
  if (scene.platform && scene.platform.setPosition && scene.platform.setSize) {
    console.log('DEBUG:updateSceneLayout: calling platform.setPosition with', w / 2, platformY);
    scene.platform.setPosition(w / 2, platformY);
    console.log('DEBUG:updateSceneLayout: calling platform.setSize with', w, platformHeight);
    scene.platform.setSize?.(w, platformHeight);
  } else {
    console.log('DEBUG:updateSceneLayout: platform or setPosition/setSize missing', scene.platform);
  }
  
  // Background
  if (scene.background && scene.background.setPosition && scene.background.setScale) {
    console.log('DEBUG:updateSceneLayout: calling background.setPosition with', w/2, h/2);
    scene.background.setPosition(w/2, h/2);
    
    // Scale background to cover screen while maintaining aspect ratio
    const bgScale = Math.max(w / 800, h / 600);
    console.log('DEBUG:updateSceneLayout: calling background.setScale with', bgScale);
    scene.background.setScale?.(bgScale);
  } else {
    console.log('DEBUG:updateSceneLayout: background or setPosition/setScale missing', scene.background);
  }
  
  // Health bars
  const barWidth = Math.min(w * 0.25, 200);
  const barHeight = Math.min(h * 0.03, 20);
  const barY = h * 0.1;
  const p1X = w * 0.25;
  const p2X = w * 0.75;
  
  if (scene.healthBarBg1 && scene.healthBarBg1.setPosition && scene.healthBarBg1.setSize) {
    console.log('DEBUG:updateSceneLayout: calling healthBarBg1.setPosition with', p1X, barY);
    scene.healthBarBg1.setPosition(p1X, barY);
    console.log('DEBUG:updateSceneLayout: calling healthBarBg1.setSize with', barWidth, barHeight);
    scene.healthBarBg1.setSize?.(barWidth, barHeight);
  } else {
    console.log('DEBUG:updateSceneLayout: healthBarBg1 or setPosition/setSize missing', scene.healthBarBg1);
  }
  
  if (scene.healthBarBg2 && scene.healthBarBg2.setPosition && scene.healthBarBg2.setSize) {
    console.log('DEBUG:updateSceneLayout: calling healthBarBg2.setPosition with', p2X, barY);
    scene.healthBarBg2.setPosition(p2X, barY);
    console.log('DEBUG:updateSceneLayout: calling healthBarBg2.setSize with', barWidth, barHeight);
    scene.healthBarBg2.setSize?.(barWidth, barHeight);
  } else {
    console.log('DEBUG:updateSceneLayout: healthBarBg2 or setPosition/setSize missing', scene.healthBarBg2);
  }
  
  if (scene.healthBar1 && scene.healthBar1.setPosition && scene.healthBar1.setSize) {
    console.log('DEBUG:updateSceneLayout: calling healthBar1.setPosition with', p1X - barWidth/2 + (barWidth * (scene.players[0].health || 0))/200, barY);
    scene.healthBar1.setPosition(p1X - barWidth/2 + (barWidth * (scene.players[0].health || 0))/200, barY);
    console.log('DEBUG:updateSceneLayout: calling healthBar1.setSize with', barWidth * (scene.players[0].health || 0)/100, barHeight);
    scene.healthBar1.setSize?.(barWidth * (scene.players[0].health || 0)/100, barHeight);
  } else {
    console.log('DEBUG:updateSceneLayout: healthBar1 or setPosition/setSize missing', scene.healthBar1);
  }
  
  if (scene.healthBar2 && scene.healthBar2.setPosition && scene.healthBar2.setSize) {
    console.log('DEBUG:updateSceneLayout: calling healthBar2.setPosition with', p2X - barWidth/2 + (barWidth * (scene.players[1].health || 0))/200, barY);
    scene.healthBar2.setPosition(p2X - barWidth/2 + (barWidth * (scene.players[1].health || 0))/200, barY);
    console.log('DEBUG:updateSceneLayout: calling healthBar2.setSize with', barWidth * (scene.players[1].health || 0)/100, barHeight);
    scene.healthBar2.setSize?.(barWidth * (scene.players[1].health || 0)/100, barHeight);
  } else {
    console.log('DEBUG:updateSceneLayout: healthBar2 or setPosition/setSize missing', scene.healthBar2);
  }
  
  // Special bars
  const specialBarY = barY + barHeight + 10;
  
  if (scene.specialBarBg1 && scene.specialBarBg1.setPosition && scene.specialBarBg1.setSize) {
    console.log('DEBUG:updateSceneLayout: calling specialBarBg1.setPosition with', p1X, specialBarY);
    scene.specialBarBg1.setPosition(p1X, specialBarY);
    console.log('DEBUG:updateSceneLayout: calling specialBarBg1.setSize with', barWidth, barHeight/2);
    scene.specialBarBg1.setSize?.(barWidth, barHeight/2);
  } else {
    console.log('DEBUG:updateSceneLayout: specialBarBg1 or setPosition/setSize missing', scene.specialBarBg1);
  }
  
  if (scene.specialBarBg2 && scene.specialBarBg2.setPosition && scene.specialBarBg2.setSize) {
    console.log('DEBUG:updateSceneLayout: calling specialBarBg2.setPosition with', p2X, specialBarY);
    scene.specialBarBg2.setPosition(p2X, specialBarY);
    console.log('DEBUG:updateSceneLayout: calling specialBarBg2.setSize with', barWidth, barHeight/2);
    scene.specialBarBg2.setSize?.(barWidth, barHeight/2);
  } else {
    console.log('DEBUG:updateSceneLayout: specialBarBg2 or setPosition/setSize missing', scene.specialBarBg2);
  }
  
  if (scene.specialBar1 && scene.specialBar1.setPosition && scene.specialBar1.setSize) {
    console.log('DEBUG:updateSceneLayout: calling specialBar1.setPosition with', p1X - barWidth/2 + (barWidth * (scene.players[0].special || 0))/200, specialBarY);
    scene.specialBar1.setPosition(p1X - barWidth/2 + (barWidth * (scene.players[0].special || 0))/200, specialBarY);
    console.log('DEBUG:updateSceneLayout: calling specialBar1.setSize with', barWidth * (scene.players[0].special || 0)/100, barHeight/2);
    scene.specialBar1.setSize?.(barWidth * (scene.players[0].special || 0)/100, barHeight/2);
  } else {
    console.log('DEBUG:updateSceneLayout: specialBar1 or setPosition/setSize missing', scene.specialBar1);
  }
  
  if (scene.specialBar2 && scene.specialBar2.setPosition && scene.specialBar2.setSize) {
    console.log('DEBUG:updateSceneLayout: calling specialBar2.setPosition with', p2X - barWidth/2 + (barWidth * (scene.players[1].special || 0))/200, specialBarY);
    scene.specialBar2.setPosition(p2X - barWidth/2 + (barWidth * (scene.players[1].special || 0))/200, specialBarY);
    console.log('DEBUG:updateSceneLayout: calling specialBar2.setSize with', barWidth * (scene.players[1].special || 0)/100, barHeight/2);
    scene.specialBar2.setSize?.(barWidth * (scene.players[1].special || 0)/100, barHeight/2);
  } else {
    console.log('DEBUG:updateSceneLayout: specialBar2 or setPosition/setSize missing', scene.specialBar2);
  }
  
  // Text elements
  const fontSize = Math.max(16, Math.round(w * 0.02));
  
  if (scene.p1Name && scene.p1Name.setPosition && scene.p1Name.setFontSize) {
    console.log('DEBUG:updateSceneLayout: calling p1Name.setPosition with', p1X, barY - barHeight - 10);
    scene.p1Name.setPosition(p1X, barY - barHeight - 10);
    console.log('DEBUG:updateSceneLayout: calling p1Name.setFontSize with', fontSize);
    scene.p1Name.setFontSize(`${fontSize}px`);
  } else {
    console.log('DEBUG:updateSceneLayout: p1Name or setPosition/setFontSize missing', scene.p1Name);
  }
  
  if (scene.p2Name && scene.p2Name.setPosition && scene.p2Name.setFontSize) {
    console.log('DEBUG:updateSceneLayout: calling p2Name.setPosition with', p2X, barY - barHeight - 10);
    scene.p2Name.setPosition(p2X, barY - barHeight - 10);
    console.log('DEBUG:updateSceneLayout: calling p2Name.setFontSize with', fontSize);
    scene.p2Name.setFontSize(`${fontSize}px`);
  } else {
    console.log('DEBUG:updateSceneLayout: p2Name or setPosition/setFontSize missing', scene.p2Name);
  }
  
  if (scene.p1HealthText && scene.p1HealthText.setPosition && scene.p1HealthText.setFontSize) {
    console.log('DEBUG:updateSceneLayout: calling p1HealthText.setPosition with', p1X, barY);
    scene.p1HealthText.setPosition(p1X, barY);
    console.log('DEBUG:updateSceneLayout: calling p1HealthText.setFontSize with', fontSize);
    scene.p1HealthText.setFontSize(`${fontSize}px`);
  } else {
    console.log('DEBUG:updateSceneLayout: p1HealthText or setPosition/setFontSize missing', scene.p1HealthText);
  }
  
  if (scene.p2HealthText && scene.p2HealthText.setPosition && scene.p2HealthText.setFontSize) {
    console.log('DEBUG:updateSceneLayout: calling p2HealthText.setPosition with', p2X, barY);
    scene.p2HealthText.setPosition(p2X, barY);
    console.log('DEBUG:updateSceneLayout: calling p2HealthText.setFontSize with', fontSize);
    scene.p2HealthText.setFontSize(`${fontSize}px`);
  } else {
    console.log('DEBUG:updateSceneLayout: p2HealthText or setPosition/setFontSize missing', scene.p2HealthText);
  }
  
  if (scene.p1SpecialText && scene.p1SpecialText.setPosition && scene.p1SpecialText.setFontSize) {
    console.log('DEBUG:updateSceneLayout: calling p1SpecialText.setPosition with', p1X, specialBarY);
    scene.p1SpecialText.setPosition(p1X, specialBarY);
    console.log('DEBUG:updateSceneLayout: calling p1SpecialText.setFontSize with', Math.max(12, fontSize * 0.75));
    scene.p1SpecialText.setFontSize(`${Math.max(12, fontSize * 0.75)}px`);
  } else {
    console.log('DEBUG:updateSceneLayout: p1SpecialText or setPosition/setFontSize missing', scene.p1SpecialText);
  }
  
  if (scene.p2SpecialText && scene.p2SpecialText.setPosition && scene.p2SpecialText.setFontSize) {
    console.log('DEBUG:updateSceneLayout: calling p2SpecialText.setPosition with', p2X, specialBarY);
    scene.p2SpecialText.setPosition(p2X, specialBarY);
    console.log('DEBUG:updateSceneLayout: calling p2SpecialText.setFontSize with', Math.max(12, fontSize * 0.75));
    scene.p2SpecialText.setFontSize(`${Math.max(12, fontSize * 0.75)}px`);
  } else {
    console.log('DEBUG:updateSceneLayout: p2SpecialText or setPosition/setFontSize missing', scene.p2SpecialText);
  }
  
  // Winner text
  if (scene.winnerText && scene.winnerText.setPosition && scene.winnerText.setFontSize) {
    console.log('DEBUG:updateSceneLayout: calling winnerText.setPosition with', w/2, h * 0.4);
    scene.winnerText.setPosition(w/2, h * 0.4);
    console.log('DEBUG:updateSceneLayout: calling winnerText.setFontSize with', Math.max(32, Math.round(w * 0.04)));
    scene.winnerText.setFontSize(`${Math.max(32, Math.round(w * 0.04))}px`);
  } else {
    console.log('DEBUG:updateSceneLayout: winnerText or setPosition/setFontSize missing', scene.winnerText);
  }
  
  // Ready text
  if (scene.readyText && scene.readyText.setPosition && scene.readyText.setFontSize) {
    console.log('DEBUG:updateSceneLayout: calling readyText.setPosition with', w/2, h * 0.4);
    scene.readyText.setPosition(w/2, h * 0.4);
    console.log('DEBUG:updateSceneLayout: calling readyText.setFontSize with', Math.max(32, Math.round(w * 0.04)));
    scene.readyText.setFontSize(`${Math.max(32, Math.round(w * 0.04))}px`);
  } else {
    console.log('DEBUG:updateSceneLayout: readyText or setPosition/setFontSize missing', scene.readyText);
  }
  
  // Countdown text
  if (scene.countdownText && scene.countdownText.setPosition && scene.countdownText.setFontSize) {
    console.log('DEBUG:updateSceneLayout: calling countdownText.setPosition with', w/2, h * 0.4);
    scene.countdownText.setPosition(w/2, h * 0.4);
    console.log('DEBUG:updateSceneLayout: calling countdownText.setFontSize with', Math.max(48, Math.round(w * 0.06)));
    scene.countdownText.setFontSize(`${Math.max(48, Math.round(w * 0.06))}px`);
  } else {
    console.log('DEBUG:updateSceneLayout: countdownText or setPosition/setFontSize missing', scene.countdownText);
  }
}

interface AttackOptions {
  scene: GameScene;
  attackerIdx: number;
  defenderIdx: number;
  now: number;
  special?: boolean;
}

// Function to try an attack
export function tryAttack({
  scene,
  attackerIdx,
  defenderIdx,
  now,
  special = false
}: AttackOptions): boolean {
  if (!scene || !scene.players || !scene.players[attackerIdx] || !scene.players[defenderIdx]) {
    console.error('[TRYATTACK] scene.players or player objects are missing', scene?.players, attackerIdx, defenderIdx);
    return false;
  }
  const attacker = scene.players[attackerIdx];
  const defender = scene.players[defenderIdx];
  // Get health and special values
  const defenderHealth = defender.health;
  const attackerSpecial = attacker.special;

  // Check if attack is possible
  if (defenderHealth === undefined || defenderHealth <= 0) return false;
  if (special && (!attackerSpecial || attackerSpecial < 100)) return false;

  // Calculate attack values
  const damage = special ? 30 : 10;
  const knockback = special ? 300 : 100;

  // Only apply damage if attacker and defender are close (e.g., within 80px horizontally)
  if (typeof attacker.x === 'number' && typeof defender.x === 'number') {
    if (Math.abs(attacker.x - defender.x) > 80) {
      // Too far: no damage
      return false;
    }
  }

  // Apply damage and knockback
  defender.health = Math.max(0, defender.health - damage);
  
  // Also update the scene's playerHealth array for consistency
  if (scene.playerHealth && Array.isArray(scene.playerHealth) && scene.playerHealth.length > defenderIdx) {
    scene.playerHealth[defenderIdx] = Math.max(0, scene.playerHealth[defenderIdx] - damage);
    console.log('[TRYATTACK] Updated playerHealth array:', scene.playerHealth);
  }
  
  if (special && typeof attacker.special !== 'undefined') attacker.special = 0;

  // Optionally, apply knockback or other effects here

  return true;
}

// Make functions available globally for non-module scripts
(window as any).applyGameCss = applyGameCss;
(window as any).updateSceneLayout = updateSceneLayout;
(window as any).tryAttack = tryAttack;
