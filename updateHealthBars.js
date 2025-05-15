// Update the health bar for a player
updateHealthBars(playerIndex) {
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
    
    // Ensure the health bar is visible
    if (typeof healthBar.setVisible === 'function') {
      healthBar.setVisible(true);
    }
    if (typeof healthBar.setAlpha === 'function') {
      healthBar.setAlpha(1);
    }
    
    console.log(`✅ Health bar update successful for player ${playerIndex + 1} with ratio: ${healthRatio}`);
  } catch (error) {
    console.error(`🔥 Error updating health bar for player ${playerIndex + 1}:`, error);
  }
  
  // Add detailed logging about health bar update
  if (DEV) {
    const barStatus = {
      width: healthBar.width,
      displayWidth: healthBar.displayWidth,
      originX: healthBar.originX,
      x: healthBar.x,
      newWidth: newWidth,
      ratio: healthRatio,
      currentHealth,
      maxHealth: MAX_HEALTH,
      correctOrigin: playerIndex === 0 ? healthBar.originX === 0 : healthBar.originX === 1,
      correctX: playerIndex === 0 ? healthBar.x === 100 : healthBar.x === 700
    };
    
    console.log(`[HEALTHBAR-UPDATE] Player ${playerIndex + 1} health bar:`, barStatus);
  }
}
