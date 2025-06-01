// Game logic tests - independent of Phaser

describe('Game Logic', () => {
  // Mock player interface for testing
  interface TestPlayer {
    health: number;
    special: number;
    lastAttackTime: number;
    lastSpecialTime: number;
  }

  // Game constants
  const ATTACK_DAMAGE = 5;
  const SPECIAL_DAMAGE = 10;
  const MAX_HEALTH = 100;
  const ATTACK_COOLDOWN = 500; // ms
  const SPECIAL_COOLDOWN = 1000; // ms
  const SPECIAL_COST = 3;

  // Helper function to create a test player
  const createPlayer = (initialHealth = MAX_HEALTH): TestPlayer => ({
    health: initialHealth,
    special: 0,
    lastAttackTime: 0,
    lastSpecialTime: 0
  });

  // Test attack logic
  const tryAttack = (
    attacker: TestPlayer,
    target: TestPlayer,
    currentTime: number,
    isSpecial: boolean
  ): boolean => {
    // Check cooldown
    const lastAttackTime = isSpecial ? attacker.lastSpecialTime : attacker.lastAttackTime;
    const cooldown = isSpecial ? SPECIAL_COOLDOWN : ATTACK_COOLDOWN;
    
    if (currentTime - lastAttackTime < cooldown) {
      return false; // Still on cooldown
    }

    // Check special attack requirements
    if (isSpecial && attacker.special < SPECIAL_COST) {
      return false; // Not enough special
    }

    // Apply damage
    const damage = isSpecial ? SPECIAL_DAMAGE : ATTACK_DAMAGE;
    target.health = Math.max(0, target.health - damage);

    // Update cooldowns and special
    if (isSpecial) {
      attacker.lastSpecialTime = currentTime;
      attacker.special -= SPECIAL_COST;
    } else {
      attacker.lastAttackTime = currentTime;
    }

    return true;
  };

  // Test win condition
  const checkWinner = (player1: TestPlayer, player2: TestPlayer): number | null => {
    if (player1.health <= 0) return 1; // Player 2 wins
    if (player2.health <= 0) return 0; // Player 1 wins
    return null; // No winner yet
  };

  // Tests
  describe('Basic Combat', () => {
    let player1: TestPlayer;
    let player2: TestPlayer;
    let currentTime: number;

    beforeEach(() => {
      player1 = createPlayer();
      player2 = createPlayer();
      currentTime = 1000; // Start at 1 second
    });

    it('should apply normal attack damage', () => {
      const result = tryAttack(player1, player2, currentTime, false);
      expect(result).toBe(true);
      expect(player2.health).toBe(MAX_HEALTH - ATTACK_DAMAGE);
    });

    it('should apply special attack damage', () => {
      player1.special = SPECIAL_COST; // Give enough special
      const result = tryAttack(player1, player2, currentTime, true);
      expect(result).toBe(true);
      expect(player2.health).toBe(MAX_HEALTH - SPECIAL_DAMAGE);
      expect(player1.special).toBe(0); // Should consume special
    });

    it('should respect attack cooldown', () => {
      // First attack should succeed
      expect(tryAttack(player1, player2, currentTime, false)).toBe(true);
      
      // Second attack immediately after should fail (cooldown)
      expect(tryAttack(player1, player2, currentTime + 100, false)).toBe(false);
      
      // After cooldown, should succeed
      expect(tryAttack(player1, player2, currentTime + 600, false)).toBe(true);
    });

    it('should respect special attack cooldown', () => {
      player1.special = SPECIAL_COST * 2; // Give enough special for multiple attacks
      
      // First special attack should succeed
      expect(tryAttack(player1, player2, currentTime, true)).toBe(true);
      
      // Second special attack immediately after should fail (cooldown)
      expect(tryAttack(player1, player2, currentTime + 500, true)).toBe(false);
      
      // After cooldown, should succeed
      expect(tryAttack(player1, player2, currentTime + 1100, true)).toBe(true);
    });

    it('should require special points for special attacks', () => {
      player1.special = 0; // No special points
      expect(tryAttack(player1, player2, currentTime, true)).toBe(false);
      expect(player2.health).toBe(MAX_HEALTH); // No damage should be dealt
    });

    it('should not allow health to go below 0', () => {
      player2.health = 3; // Very low health
      tryAttack(player1, player2, currentTime, false);
      expect(player2.health).toBe(0);
    });
  });

  describe('Win Conditions', () => {
    let player1: TestPlayer;
    let player2: TestPlayer;

    beforeEach(() => {
      player1 = createPlayer();
      player2 = createPlayer();
    });

    it('should detect player 1 win when player 2 health reaches 0', () => {
      player2.health = 0;
      expect(checkWinner(player1, player2)).toBe(0); // Player 1 wins
    });

    it('should detect player 2 win when player 1 health reaches 0', () => {
      player1.health = 0;
      expect(checkWinner(player1, player2)).toBe(1); // Player 2 wins
    });

    it('should return null when no player has won', () => {
      expect(checkWinner(player1, player2)).toBeNull();
    });
  });

  describe('Full Game Simulation', () => {
    it('should take 20 normal hits to win', () => {
      const player1 = createPlayer();
      const player2 = createPlayer();
      let currentTime = 0;
      
      // Simulate 20 normal attacks from player 1 to player 2
      for (let i = 0; i < 20; i++) {
        currentTime += ATTACK_COOLDOWN;
        tryAttack(player1, player2, currentTime, false);
      }
      
      expect(player2.health).toBe(0);
      expect(checkWinner(player1, player2)).toBe(0); // Player 1 wins
    });

    it('should take 10 special hits to win', () => {
      const player1 = createPlayer();
      const player2 = createPlayer();
      let currentTime = 0;
      
      // Simulate 10 special attacks from player 1 to player 2
      for (let i = 0; i < 10; i++) {
        player1.special = SPECIAL_COST; // Replenish special each time
        currentTime += SPECIAL_COOLDOWN;
        tryAttack(player1, player2, currentTime, true);
      }
      
      expect(player2.health).toBe(0);
      expect(checkWinner(player1, player2)).toBe(0); // Player 1 wins
    });
  });
});
