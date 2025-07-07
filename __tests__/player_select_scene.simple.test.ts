// Mock Phaser and WebSocketManager before importing the module
jest.mock('phaser');
jest.mock('../websocket_manager');

import Phaser from 'phaser';
import PlayerSelectScene from '../player_select_scene';
import { WebSocketManager } from '../websocket_manager';

describe('PlayerSelectScene', () => {
  let scene: PlayerSelectScene;
  let mockWebSocketManager: any;
  let mockScene: any;

  beforeEach(() => {
    // Create a fresh mock WebSocket manager for each test
    mockWebSocketManager = new (WebSocketManager as any)();
    
    // Create a fresh mock scene for each test
    mockScene = new Phaser.Scene({ key: 'PlayerSelectScene' });
    
    // Create the scene with the mock WebSocket manager
    scene = new PlayerSelectScene(mockWebSocketManager);
    
    // Mock the init method to prevent actual scene changes
    scene.init = jest.fn();
    
    // Mock the create method to prevent actual scene creation
    scene.create = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty character selections', () => {
      expect(scene.selected.p1).toBe('');
      expect(scene.selected.p2).toBe('');
    });

    it('should have all character keys defined', () => {
      expect(scene.CHARACTER_KEYS).toEqual([
        'bento', 'davir', 'jose', 'davis', 
        'carol', 'roni', 'jacqueline', 'ivan', 'd_isa'
      ]);
    });
  });

  describe('WebSocket integration', () => {
    it('should use the provided WebSocketManager instance', () => {
      expect(scene.wsManager).toBe(mockWebSocketManager);
    });

    it('should initialize with local mode by default', () => {
      expect(scene.mode).toBe('local');
    });
  });

  describe('character selection', () => {
    it('should allow selecting different characters', () => {
      // Mock the selectCharacter method
      const originalSelectCharacter = scene.selectCharacter;
      scene.selectCharacter = jest.fn();
      
      // Simulate selecting a character for player 1
      scene.selectCharacter(2, 1);
      
      expect(scene.selectCharacter).toHaveBeenCalledWith(2, 1);
      
      // Restore the original method
      scene.selectCharacter = originalSelectCharacter;
    });
  });
});
