export const createMockPlayer = () => ({
  x: 0,
  y: 0,
  width: 50,
  height: 100,
  setVelocityX: jest.fn().mockReturnThis(),
  setVelocityY: jest.fn().mockReturnThis(),
  setFlipX: jest.fn().mockReturnThis(),
  setFlipY: jest.fn().mockReturnThis(),
  setPosition: jest.fn().mockReturnThis(),
  setDepth: jest.fn().mockReturnThis(),
  setOrigin: jest.fn().mockReturnThis(),
  setDisplaySize: jest.fn().mockReturnThis(),
  setImmovable: jest.fn().mockReturnThis(),
  setBounce: jest.fn().mockReturnThis(),
  setCollideWorldBounds: jest.fn().mockReturnThis(),
  setInteractive: jest.fn().mockReturnThis(),
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
    touching: { down: true },
    onFloor: jest.fn().mockReturnValue(true)
  },
  anims: { play: jest.fn() },
  destroy: jest.fn(),
  texture: { key: 'player' },
  getData: jest.fn().mockImplementation((key) => {
    const data = {
      isHit: false,
      isAttacking: false,
      isBlocking: false
    };
    return data[key as keyof typeof data];
  }),
  setData: jest.fn()
});
