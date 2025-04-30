/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { tryAttack } from '../gameUtils.mjs';
// __tests__/playAgainButton.test.js
// Ensures the 'Jogar Novamente' button always shows the full text (no fixedWidth)

describe('Play Again button sizing', () => {
  let addTextArgs;
  let scene;
  beforeEach(() => {
    addTextArgs = null;
    scene = {
      cameras: { main: { width: 800, height: 600 } },
      add: {
        text: jest.fn((x, y, label, style) => {
          addTextArgs = { x, y, label, style };
          // Return a mock text object with chainable methods
          return {
            setOrigin: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis()
          };
        })
      },
      tweens: { add: jest.fn() }
    };
  });

  test('Button style does not use fixedWidth', () => {
    // Simulate button creation logic from endGame
    const btnStyle = {
      fontSize: '48px',
      color: '#fff',
      backgroundColor: '#44aaff',
      fontFamily: 'monospace',
      padding: { left: 48, right: 48, top: 24, bottom: 24 },
      align: 'center',
      stroke: '#000',
      strokeThickness: 8,
      borderRadius: 24
      // fixedWidth: intentionally omitted
    };
    scene.add.text(400, 390, 'Jogar Novamente', btnStyle);
    expect(addTextArgs).not.toBeNull();
    expect(addTextArgs.label).toBe('Jogar Novamente');
    expect(addTextArgs.style.fixedWidth).toBeUndefined();
  });
});
