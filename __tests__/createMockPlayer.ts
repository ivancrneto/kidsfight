export const createMockPlayer = (idOrX?: number, characterOrY?: string | number, x?: number, y?: number, health?: number, special?: number) => {
  // Support both old and new calling conventions
  let playerX = 100; // Default position that's within range
  let playerY = 300;
  
  if (typeof idOrX === 'number') {
    if (typeof characterOrY === 'string') {
      // New format: createMockPlayer(id, character, x, y, health, special)
      playerX = x || 100;
      playerY = y || 300;
    } else {
      // Format: createMockPlayer(x, y?)
      playerX = idOrX;
      playerY = characterOrY || 300;
    }
  }
  
  return {
    x: playerX,
    y: playerY,
    width: 50,
    height: 100,
    setVelocityX: jest.fn().mockReturnThis(),
    setVelocityY: jest.fn().mockReturnThis(),
    setFlipX: jest.fn().mockReturnThis(),
    setFlipY: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setFrame: jest.fn().mockReturnThis(),
    setAngle: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setDisplaySize: jest.fn().mockReturnThis(),
    setImmovable: jest.fn().mockReturnThis(),
    setBounce: jest.fn().mockReturnThis(),
    setCollideWorldBounds: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    setSize: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    body: {
      blocked: { down: true },
      velocity: { x: 0, y: 0 },
      setAllowGravity: jest.fn(),
      setImmovable: jest.fn(),
      setSize: jest.fn(),
      setOffset: jest.fn(),
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setCollideWorldBounds: jest.fn(),
      setGravityY: jest.fn(),
      touching: { down: true },
      onFloor: jest.fn().mockReturnValue(true)
    },
    anims: { play: jest.fn(), stop: jest.fn() },
    destroy: jest.fn(),
    texture: { key: 'player' },
    getData: jest.fn().mockImplementation((key) => {
      if (key === 'isAttacking') return this.isAttacking;
      if (key === 'isSpecialAttacking') return this.isSpecialAttacking;
      if (key === 'isSpecialDefending') return this.isSpecialDefending;
      return undefined;
    }),
    setData: jest.fn().mockImplementation(function(key, value) {
      this[key] = value;
    }),
    isAttacking: false,
    isSpecialAttacking: false,
    isSpecialDefending: false
  };
};
