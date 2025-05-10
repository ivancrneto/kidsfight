import { isLandscape, stretchBackgroundToFill } from '../kidsfight_scene.js';

describe('Utility functions', () => {
  describe('isLandscape', () => {
    // Save original window dimensions
    let originalWindow;
    
    beforeAll(() => {
      // Save original window if we're in a browser environment
      if (typeof window !== 'undefined') {
        originalWindow = {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight
        };
      }
    });
    
    afterAll(() => {
      // Restore original window dimensions if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.innerWidth = originalWindow.innerWidth;
        window.innerHeight = originalWindow.innerHeight;
      }
    });

    it('should return true if window is undefined (test environment)', () => {
      // Create a mock environment without window
      const originalWindow = global.window;
      global.window = undefined;
      
      expect(isLandscape()).toBe(true);
      
      // Restore the original window
      global.window = originalWindow;
    });

    it('should return true if width > height', () => {
      // Mock window dimensions for landscape
      if (typeof window !== 'undefined') {
        window.innerWidth = 1000;
        window.innerHeight = 500;
        expect(isLandscape()).toBe(true);
      }
    });

    it('should return false if width <= height', () => {
      // Mock window dimensions for portrait
      if (typeof window !== 'undefined') {
        window.innerWidth = 500;
        window.innerHeight = 1000;
        expect(isLandscape()).toBe(false);
        
        // Test equal dimensions (should return false)
        window.innerWidth = 500;
        window.innerHeight = 500;
        expect(isLandscape()).toBe(false);
      }
    });
  });

  describe('stretchBackgroundToFill', () => {
    it('should set displayWidth and displayHeight to match the given area', () => {
      const mockBg = { displayWidth: 0, displayHeight: 0 };
      stretchBackgroundToFill(mockBg, 1234, 567);
      expect(mockBg.displayWidth).toBe(1234);
      expect(mockBg.displayHeight).toBe(567);
    });

    it('should do nothing if bg is null or undefined', () => {
      expect(() => stretchBackgroundToFill(null, 100, 100)).not.toThrow();
      expect(() => stretchBackgroundToFill(undefined, 100, 100)).not.toThrow();
    });
  });
});
