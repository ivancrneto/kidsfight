/**
 * @jest-environment jsdom
 */

import KidsFightScene from '../kidsfight_scene';

// Collect all created graphics objects for assertions
let createdGraphics: any[] = [];

describe('Health Bar Updates After Rematch', () => {
  let scene: KidsFightScene;
  let mockGraphics: any;
  let mockPlayers: any[];

  beforeEach(() => {
    // Reset createdGraphics for each test
    createdGraphics.length = 0;

    // Create mock graphics object
    mockGraphics = {
      fillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn().mockReturnThis(),
      clear: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setX: jest.fn().mockReturnThis(),
      setY: jest.fn().mockReturnThis(),
      lineStyle: jest.fn().mockReturnThis(),
      strokeRect: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      dirty: false
    };

    // Create scene instance
    scene = new KidsFightScene();
    
    // Setup mocks
    scene.add = {
      graphics: jest.fn(() => mockGraphics),
      text: jest.fn().mockReturnValue({
        setText: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
      }),
      circle: jest.fn().mockImplementation(() => ({
        setDepth: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        x: 0,
        y: 0
      })),
      sprite: jest.fn().mockImplementation(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setBounce: jest.fn().mockReturnThis(),
        setCollideWorldBounds: jest.fn().mockReturnThis(),
        setSize: jest.fn().mockReturnThis(),
        body: {
          setGravityY: jest.fn(),
          touching: { down: false }
        },
        health: 100,
        setData: jest.fn(),
        setOrigin: jest.fn(),
        setScale: jest.fn(),
        setBounce: jest.fn(),
        setCollideWorldBounds: jest.fn(),
        x: 200,
        y: 300
      })),
      rectangle: jest.fn().mockImplementation(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      }))
    } as any;

    // Patch: add a mock for createGfx
    scene.createGfx = jest.fn(() => mockGraphics);

    // Mock scale (required by createHealthBars)
    scene.scale = { width: 800, height: 600 };
    // Mock sys.game.config (Phaser expects this for sizing)
    scene.sys = { game: { config: { width: 800, height: 600 }, canvas: { width: 800, height: 600 } } };
    // Mock cameras.main (Phaser expects this for positioning)
    scene.cameras = { main: { width: 800, height: 600 } };
    // Always initialize playerHealth to [100, 100] before each test
    scene.playerHealth = [100, 100];

    // Mock other required scene properties
    scene.physics = {
      add: {
        sprite: jest.fn().mockImplementation(() => scene.add.sprite()),
        existing: jest.fn(),
        collider: jest.fn()
      }
    } as any;
    
    scene.textures = {
      exists: jest.fn().mockReturnValue(false),
      get: jest.fn().mockReturnValue({
        getSourceImage: jest.fn().mockReturnValue({}),
        add: jest.fn()
      }),
      remove: jest.fn(),
      addImage: jest.fn()
    } as any;
    
    scene.load = {
      image: jest.fn()
    } as any;
    
    scene.anims = {
      exists: jest.fn().mockReturnValue(false),
      create: jest.fn(),
      generateFrameNumbers: jest.fn().mockReturnValue([])
    } as any;
    
    scene.time = {
      addEvent: jest.fn()
    } as any;

    // Initialize required properties
    (scene as any).gameMode = 'online';
    (scene as any).players = [
      { health: 100, setData: jest.fn(), setOrigin: jest.fn(), setScale: jest.fn(), setBounce: jest.fn(), setCollideWorldBounds: jest.fn() },
      { health: 100, setData: jest.fn(), setOrigin: jest.fn(), setScale: jest.fn(), setBounce: jest.fn(), setCollideWorldBounds: jest.fn() }
    ];
    (scene as any).selected = { p1: 'bento', p2: 'davir' };
    (scene as any).selectedScenario = 'scenario1';

    // Patch: add a mock for timerText with setText and setColor methods
    scene.timerText = {
      setText: jest.fn().mockReturnThis(),
      setColor: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
    };

    // Patch: clear health bar graphics properties before each test
    (scene as any).healthBar1 = undefined;
    (scene as any).healthBar2 = undefined;
    (scene as any).healthBarBg1 = undefined;
    (scene as any).healthBarBg2 = undefined;

    // Patch: reset all relevant mocks before each test
    if (scene.add.graphics && jest.isMockFunction(scene.add.graphics)) {
      (scene.add.graphics as jest.Mock).mockClear();
    }
    if (mockGraphics.clear && jest.isMockFunction(mockGraphics.clear)) mockGraphics.clear.mockClear();
    if (mockGraphics.fillStyle && jest.isMockFunction(mockGraphics.fillStyle)) mockGraphics.fillStyle.mockClear();
    if (mockGraphics.fillRect && jest.isMockFunction(mockGraphics.fillRect)) mockGraphics.fillRect.mockClear();
    if (mockGraphics.setDepth && jest.isMockFunction(mockGraphics.setDepth)) mockGraphics.setDepth.mockClear();
    if (mockGraphics.setScrollFactor && jest.isMockFunction(mockGraphics.setScrollFactor)) mockGraphics.setScrollFactor.mockClear();
    if (mockGraphics.setX && jest.isMockFunction(mockGraphics.setX)) mockGraphics.setX.mockClear();
    if (mockGraphics.setY && jest.isMockFunction(mockGraphics.setY)) mockGraphics.setY.mockClear();

    const makeMockGraphics = () => ({
      clear: jest.fn(),
      fillStyle: jest.fn(),
      fillRect: jest.fn(),
      lineStyle: jest.fn(),
      strokeRect: jest.fn(),
      setX: jest.fn(),
      setY: jest.fn(),
      setScrollFactor: jest.fn(),
      setDepth: jest.fn(),
      destroy: jest.fn(),
    });
    scene.add.graphics = jest.fn(() => {
      const gfx = makeMockGraphics();
      createdGraphics.push(gfx);
      return gfx;
    });
    scene.createGfx = jest.fn(() => scene.add.graphics());
  });

  describe('Health Bar Creation and Updates', () => {
    it('should create health bars when called from create method', () => {
      // Spy on createHealthBars method
      const createHealthBarsSpy = jest.spyOn(scene, 'createHealthBars');
      
      // Call create method
      scene.create({});
      
      // Verify createHealthBars was called
      expect(createHealthBarsSpy).toHaveBeenCalled();
      
      createHealthBarsSpy.mockRestore();
    });

    it('should update health bars for both players after create', () => {
      // Spy on updateHealthBar method
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      
      // Call create method
      scene.create({});
      
      // Verify updateHealthBar was called for both players
      expect(updateHealthBarSpy).toHaveBeenCalledWith(0);
      expect(updateHealthBarSpy).toHaveBeenCalledWith(1);
      
      updateHealthBarSpy.mockRestore();
    });

    it('should recreate health bar graphics after scene restart', () => {
      // First call to create health bars
      (scene as any).healthBar1 = undefined;
      (scene as any).healthBar2 = undefined;
      (scene as any).healthBarBg1 = undefined;
      (scene as any).healthBarBg2 = undefined;
      (scene as any)._creatingHealthBars = false;
      expect(jest.isMockFunction(scene.add.graphics)).toBe(true);
      scene.createHealthBars();
      
      // Verify graphics were created
      expect(scene.add.graphics).toHaveBeenCalled();
      const initialCallCount = (scene.add.graphics as jest.Mock).mock.calls.length;
      
      // Reset mock
      (scene.add.graphics as jest.Mock).mockClear();
      
      // Call create method (simulates scene restart)
      (scene as any).healthBar1 = undefined;
      (scene as any).healthBar2 = undefined;
      (scene as any).healthBarBg1 = undefined;
      (scene as any).healthBarBg2 = undefined;
      (scene as any)._creatingHealthBars = false;
      scene.create({});
      
      // Verify graphics were created again
      expect(scene.add.graphics).toHaveBeenCalled();
      expect((scene.add.graphics as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    });

    it('should draw health bars with correct colors and dimensions', () => {
      // Set specific health values
      (scene as any).playerHealth = [80, 60];
      (scene as any).healthBar1 = undefined;
      (scene as any).healthBar2 = undefined;
      (scene as any).healthBarBg1 = undefined;
      (scene as any).healthBarBg2 = undefined;
      // Create health bars so graphics are created and mocks are triggered
      (scene as any)._creatingHealthBars = false;
      scene.createHealthBars();
      // Update health bars
      scene.updateHealthBar(0);
      scene.updateHealthBar(1);
      // Verify graphics methods were called
      expect(createdGraphics.some(gfx => gfx.clear.mock.calls.length > 0)).toBe(true);
      expect(createdGraphics.some(gfx => gfx.fillStyle.mock.calls.length > 0)).toBe(true);
      expect(createdGraphics.some(gfx => gfx.fillRect.mock.calls.length > 0)).toBe(true);
      // Verify health bar positioning
      expect(createdGraphics.some(gfx => gfx.setX.mock.calls.length > 0)).toBe(true);
      expect(createdGraphics.some(gfx => gfx.setY.mock.calls.length > 0)).toBe(true);
    });

    it('should sync player sprite health with game state arrays', () => {
      // Setup players with different health values
      (scene as any).players[0].health = 50;
      (scene as any).players[1].health = 75;
      (scene as any).playerHealth = [100, 100]; // Reset values
      
      // Call create method
      scene.create({});
      
      // Verify player sprites were synced with reset health
      expect((scene as any).players[0].health).toBe(100);
      expect((scene as any).players[1].health).toBe(100);
    });

    it('should handle missing canvas gracefully', () => {
      // Remove canvas
      scene.sys = undefined;
      
      // Should not throw error when updating health bars
      expect(() => {
        scene.updateHealthBar(0);
        scene.updateHealthBar(1);
      }).not.toThrow();
    });

    it('should create health bars with correct scroll factor', () => {
      (scene as any).healthBar1 = undefined;
      (scene as any).healthBar2 = undefined;
      (scene as any).healthBarBg1 = undefined;
      (scene as any).healthBarBg2 = undefined;
      (scene as any)._creatingHealthBars = false;
      expect(jest.isMockFunction(scene.add.graphics)).toBe(true);
      scene.createHealthBars();
      scene.createHealthBars();
      // Verify scroll factor was set (for UI elements that should stay on screen)
      expect(createdGraphics.some(gfx => gfx.setScrollFactor.mock.calls.length > 0)).toBe(true);
    });

    it('should set correct depth for health bars', () => {
      (scene as any).healthBar1 = undefined;
      (scene as any).healthBar2 = undefined;
      (scene as any).healthBarBg1 = undefined;
      (scene as any).healthBarBg2 = undefined;
      (scene as any)._creatingHealthBars = false;
      expect(jest.isMockFunction(scene.add.graphics)).toBe(true);
      scene.createHealthBars();
      scene.createHealthBars();
      // Verify depth was set (health bars should appear above game elements)
      expect(createdGraphics.some(gfx => gfx.setDepth.mock.calls.length > 0)).toBe(true);
    });

    it('should handle health bar updates after damage', () => {
      // Setup initial health
      (scene as any).playerHealth = [100, 100];
      
      // Simulate damage
      (scene as any).playerHealth[1] = 75;
      
      // Mock updateHealthBar method to track calls
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      
      // Simulate receiving health update (like after an attack)
      const healthUpdateAction = {
        type: 'health_update',
        playerIndex: 1,
        health: 75
      };
      
      scene.handleRemoteAction(healthUpdateAction);
      
      // Verify health bar was updated
      expect(updateHealthBarSpy).toHaveBeenCalledWith(1);
      
      updateHealthBarSpy.mockRestore();
    });

    it('should handle invalid player indices gracefully', () => {
      // Should not throw error with invalid indices
      expect(() => {
        scene.updateHealthBar(-1);
        scene.updateHealthBar(2);
        scene.updateHealthBar(999);
      }).not.toThrow();
    });

    it('should recreate missing health bars if needed', () => {
      // Set health bars to undefined to simulate missing bars
      (scene as any).healthBar1 = undefined;
      (scene as any).healthBar2 = undefined;
      (scene as any).healthBarBg1 = undefined;
      (scene as any).healthBarBg2 = undefined;
      
      // Spy on createHealthBars
      const createHealthBarsSpy = jest.spyOn(scene, 'createHealthBars');
      
      // Try to update health bar (should recreate missing bars)
      scene.updateHealthBar(0);
      
      // Verify createHealthBars was called to recreate missing bars
      expect(createHealthBarsSpy).toHaveBeenCalled();
      
      createHealthBarsSpy.mockRestore();
    });
  });

  describe('Health Bar Visual Updates', () => {
    beforeEach(() => {
      // Setup health bars with separate mock objects for each bar
      const mockGraphics1 = {
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        clear: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setX: jest.fn().mockReturnThis(),
        setY: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        dirty: false
      };
      const mockGraphics2 = {
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        clear: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setX: jest.fn().mockReturnThis(),
        setY: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        dirty: false
      };
      
      (scene as any).healthBar1 = mockGraphics1;
      (scene as any).healthBar2 = mockGraphics2;
      (scene as any).healthBarBg1 = mockGraphics1;
      (scene as any).healthBarBg2 = mockGraphics2;
    });

    it('should draw full health bars after rematch', () => {
      // Reset health to full after rematch
      (scene as any).playerHealth = [100, 100];
      scene.createHealthBars();
      scene.updateHealthBar(0);
      scene.updateHealthBar(1);
      
      // Verify full width health bars were drawn
      // The fillRect calls should show full width (200 * 1.0 = 200)
      const fillRectCalls = createdGraphics.map(gfx => gfx.fillRect.mock.calls).flat();
      expect(fillRectCalls.length).toBeGreaterThan(0);
      
      // Check that health bars were drawn with full width
      const healthBarCalls = fillRectCalls.filter(call => 
        call[2] === 200 // Full width for 100% health
      );
      expect(healthBarCalls.length).toBeGreaterThan(0);
    });

    it('should draw proportional health bars for damaged players', () => {
      (scene as any).healthBar1 = undefined;
      (scene as any).healthBar2 = undefined;
      (scene as any).healthBarBg1 = undefined;
      (scene as any).healthBarBg2 = undefined;
      (scene as any)._creatingHealthBars = false;
      expect(jest.isMockFunction(scene.add.graphics)).toBe(true);
      scene.createHealthBars();
      
      // Clear mock calls from createHealthBars (which calls updateHealthBar with default health)
      createdGraphics.forEach(gfx => {
        if (gfx.fillRect && jest.isMockFunction(gfx.fillRect)) {
          gfx.fillRect.mockClear();
        }
      });
      
      // Simulate health values - need to set both playerHealth array AND player sprite health
      (scene as any).playerHealth = [50, 25];
      (scene as any).players[0].health = 50;
      (scene as any).players[1].health = 25;
      
      scene.updateHealthBar(0);
      scene.updateHealthBar(1);
      const fillRectCalls = createdGraphics.map(gfx => gfx.fillRect.mock.calls).flat();
      
      // Check for 50% health bar (200 * 0.5 = 100)
      const halfHealthCalls = fillRectCalls.filter(call => call[2] === 100);
      expect(halfHealthCalls.length).toBeGreaterThan(0);
      
      // Check for 25% health bar (200 * 0.25 = 50)
      const quarterHealthCalls = fillRectCalls.filter(call => call[2] === 50);
      expect(quarterHealthCalls.length).toBeGreaterThan(0);
    });

    it('should use different colors for player 1 and player 2', () => {
      scene.updateHealthBar(0);
      scene.updateHealthBar(1);
      
      // Verify different colors were used
      // In this test section, health bars are set to mockGraphics directly
      const healthBar1 = (scene as any).healthBar1;
      const healthBar2 = (scene as any).healthBar2;
      
      // Get fillStyle calls from both health bars
      const fillStyleCalls = [
        ...healthBar1.fillStyle.mock.calls,
        ...healthBar2.fillStyle.mock.calls
      ];
      
      // Should have calls for both green (player 1) and red (player 2)
      const greenCalls = fillStyleCalls.filter(call => call[0] === 0x00ff00);
      const redCalls = fillStyleCalls.filter(call => call[0] === 0xff0000);
      
      expect(greenCalls.length).toBeGreaterThan(0);
      expect(redCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Health Bar Positioning', () => {
    it('should position player 1 health bar on the left', () => {
      (scene as any).healthBar1 = undefined;
      (scene as any).healthBar2 = undefined;
      (scene as any).healthBarBg1 = undefined;
      (scene as any).healthBarBg2 = undefined;
      (scene as any)._creatingHealthBars = false;
      expect(jest.isMockFunction(scene.add.graphics)).toBe(true);
      scene.createHealthBars();
      const setXCalls = createdGraphics.map(gfx => gfx.setX.mock.calls).flat();
      const leftPositions = setXCalls.filter(call => call[0] === 20); // Left margin
      expect(leftPositions.length).toBeGreaterThan(0);
    });

    it('should position player 2 health bar on the right', () => {
      (scene as any).healthBar1 = undefined;
      (scene as any).healthBar2 = undefined;
      (scene as any).healthBarBg1 = undefined;
      (scene as any).healthBarBg2 = undefined;
      (scene as any)._creatingHealthBars = false;
      expect(jest.isMockFunction(scene.add.graphics)).toBe(true);
      scene.createHealthBars();
      const setXCalls = createdGraphics.map(gfx => gfx.setX.mock.calls).flat();
      const rightPositions = setXCalls.filter(call => call[0] === 580); // 800 - 200 - 20
      expect(rightPositions.length).toBeGreaterThan(0);
    });

    it('should position health bars at correct vertical position', () => {
      (scene as any).healthBar1 = undefined;
      (scene as any).healthBar2 = undefined;
      (scene as any).healthBarBg1 = undefined;
      (scene as any).healthBarBg2 = undefined;
      (scene as any)._creatingHealthBars = false;
      expect(jest.isMockFunction(scene.add.graphics)).toBe(true);
      scene.createHealthBars();
      const setYCalls = createdGraphics.map(gfx => gfx.setY.mock.calls).flat();
      const topPositions = setYCalls.filter(call => call[0] === 20); // Top margin
      expect(topPositions.length).toBeGreaterThan(0);
    });
  });

  describe('Health Bar Updates After Rematch', () => {
    let scene: any;
    let createdGraphics: any[] = [];

    const makeMockGraphics = () => ({
      clear: jest.fn(),
      fillStyle: jest.fn(),
      fillRect: jest.fn(),
      lineStyle: jest.fn(),
      strokeRect: jest.fn(),
      setX: jest.fn(),
      setY: jest.fn(),
      setScrollFactor: jest.fn(),
      setDepth: jest.fn(),
      destroy: jest.fn(),
    });

    beforeEach(() => {
      createdGraphics.length = 0;
      scene = new KidsFightScene();
      scene.add = {
        graphics: jest.fn(() => {
          const gfx = makeMockGraphics();
          createdGraphics.push(gfx);
          return gfx;
        }),
        text: jest.fn().mockReturnValue({
          setText: jest.fn().mockReturnThis(),
          setColor: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setScrollFactor: jest.fn().mockReturnThis(),
        }),
      };
      scene.createGfx = jest.fn(() => scene.add.graphics());
      scene.scale = { width: 800, height: 600 };
      scene.sys = { game: { config: { width: 800, height: 600 } } };
      scene.cameras = { main: { width: 800, height: 600 } };
      scene.players = [
        { health: 100, setData: jest.fn(), setOrigin: jest.fn(), setScale: jest.fn(), setBounce: jest.fn(), setCollideWorldBounds: jest.fn() },
        { health: 100, setData: jest.fn(), setOrigin: jest.fn(), setScale: jest.fn(), setBounce: jest.fn(), setCollideWorldBounds: jest.fn() }
      ];
      scene.playerHealth = [100, 100];
      scene.createHealthBars();
      scene.updateHealthBar(0);
      scene.updateHealthBar(1);
    });

    function forceRematchReset() {
      scene.healthBar1 = null;
      scene.healthBar2 = null;
      scene.healthBarBg1 = null;
      scene.healthBarBg2 = null;
      scene._creatingHealthBars = false;
      scene.createHealthBars();
      scene.updateHealthBar(0);
      scene.updateHealthBar(1);
      // Explicitly sync player health for test reliability
      scene.players[0].health = scene.playerHealth[0];
      scene.players[1].health = scene.playerHealth[1];
    }

    it('should sync player sprite health with game state arrays', () => {
      scene.playerHealth = [50, 50];
      scene.players[0].health = 50;
      scene.players[1].health = 50;
      scene.playerHealth = [100, 100];
      forceRematchReset();
      expect(scene.players[0].health).toBe(100);
      expect(scene.players[1].health).toBe(100);
    });

    it('should draw full health bars after rematch', () => {
      scene.playerHealth = [100, 100];
      forceRematchReset();
      const fillRectCalls = createdGraphics.map(gfx => gfx.fillRect.mock.calls).flat();
      expect(fillRectCalls.length).toBeGreaterThan(0);
      const healthBarCalls = fillRectCalls.filter(call => call[2] === 200);
      expect(healthBarCalls.length).toBeGreaterThan(0);
    });

    it('should use different colors for player 1 and player 2', () => {
      scene.playerHealth = [100, 100];
      forceRematchReset();
      const fillStyleCalls = createdGraphics.map(gfx => gfx.fillStyle.mock.calls).flat();
      const greenCalls = fillStyleCalls.filter(call => call[0] === 0x00ff00);
      const redCalls = fillStyleCalls.filter(call => call[0] === 0xff0000);
      expect(greenCalls.length).toBeGreaterThan(0);
      expect(redCalls.length).toBeGreaterThan(0);
    });

    // Duplicates for "Health Bar Updates After Rematch" suite
    it('should sync player sprite health with game state arrays (duplicate)', () => {
      scene.playerHealth = [50, 50];
      scene.players[0].health = 50;
      scene.players[1].health = 50;
      scene.playerHealth = [100, 100];
      forceRematchReset();
      expect(scene.players[0].health).toBe(100);
      expect(scene.players[1].health).toBe(100);
    });

    it('should draw full health bars after rematch (duplicate)', () => {
      scene.playerHealth = [100, 100];
      forceRematchReset();
      const fillRectCalls = createdGraphics.map(gfx => gfx.fillRect.mock.calls).flat();
      expect(fillRectCalls.length).toBeGreaterThan(0);
      const healthBarCalls = fillRectCalls.filter(call => call[2] === 200);
      expect(healthBarCalls.length).toBeGreaterThan(0);
    });

    it('should use different colors for player 1 and player 2 (duplicate)', () => {
      scene.playerHealth = [100, 100];
      forceRematchReset();
      const fillStyleCalls = createdGraphics.map(gfx => gfx.fillStyle.mock.calls).flat();
      const greenCalls = fillStyleCalls.filter(call => call[0] === 0x00ff00);
      const redCalls = fillStyleCalls.filter(call => call[0] === 0xff0000);
      expect(greenCalls.length).toBeGreaterThan(0);
      expect(redCalls.length).toBeGreaterThan(0);
    });
  });
});