import { GameObject } from './types';

const MAX_HEALTH = 100;

interface HealthBar extends GameObject {
  displayWidth?: number;
  width?: number;
  x: number;
  y: number;
  originX?: number;
  originY?: number;
  setDisplaySize?: (width: number, height: number) => void;
  setSize?: (width: number, height: number) => void;
  setOrigin?: (x: number, y: number) => void;
}

interface GameScene {
  healthBar1?: HealthBar;
  healthBar2?: HealthBar;
  playerHealth: number[];
}

export function updateHealthBars(this: GameScene, playerIndex: number): void {
  console.log('[KidsFightScene] Updating health bar', {
    playerIndex,
    health: this.playerHealth,
    hasHealthBar1: !!this.healthBar1,
    hasHealthBar2: !!this.healthBar2
  });
  
  // Select the correct health bar based on player index
  const healthBar = playerIndex === 0 ? this.healthBar1 : this.healthBar2;
  if (!healthBar) {
    console.warn(`[KidsFightScene] Cannot update health bar for player ${playerIndex + 1} - bar not found`);
    return;
  }
  
  const currentHealth = this.playerHealth[playerIndex];
  const barWidth = 200; // Must match what's set in create()
  const barHeight = 20; // Must match height in create()
  
  // Calculate ratio for display
  const healthRatio = Math.max(0, currentHealth / MAX_HEALTH);
  const newWidth = barWidth * healthRatio;
  
  try {
    // Only update the width/scale properties of the health bar
    if (typeof healthBar.displayWidth !== 'undefined') {
      healthBar.displayWidth = newWidth;
    }
    if (typeof healthBar.setDisplaySize === 'function') {
      healthBar.setDisplaySize(newWidth, barHeight);
    }
    if (typeof healthBar.width === 'number') {
      healthBar.width = newWidth;
    }
    if (typeof healthBar.setSize === 'function') {
      healthBar.setSize(newWidth, barHeight);
    }
    
    // CRITICAL: Set origin and position so bar decreases from the correct side
    if (playerIndex === 0) {
      // Player 1: left edge fixed, decrease rightward
      if (typeof healthBar.setOrigin === 'function') {
        healthBar.setOrigin(0, 0.5);
      } else if (healthBar.originX !== undefined) {
        healthBar.originX = 0;
        healthBar.originY = 0.5;
      }
      // Position the bar at the left side of the screen
      healthBar.x = 100; // Must match position set in create()
    } else {
      // Player 2: right edge fixed, decrease leftward
      if (typeof healthBar.setOrigin === 'function') {
        healthBar.setOrigin(1, 0.5);
      } else if (healthBar.originX !== undefined) {
        healthBar.originX = 1;
        healthBar.originY = 0.5;
      }
      // Position the bar at the right side of the screen
      healthBar.x = 700; // Must match position set in create()
    }
    
    // Common Y position
    healthBar.y = 50; // Must match position set in create()
    
  } catch (error) {
    console.error(`[KidsFightScene] Error updating health bar for player ${playerIndex + 1}:`, error);
  }
}
