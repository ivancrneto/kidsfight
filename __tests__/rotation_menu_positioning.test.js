/** @jest-environment jsdom */
/// <reference types="jest" />

import Phaser from 'phaser';
import RotatePromptScene from '../rotate_prompt_scene';
import GameModeScene from '../game_mode_scene';

jest.mock('phaser', () => {
  return {
    Scene: class {
      constructor() {
        this.sys = {
          settings: { data: {} }
        };
        this.scale = {
          width: 800,
          height: 600,
          orientation: undefined
        };
        this.cameras = {
          main: {
            width: 800,
            height: 600
          }
        };
        this.children = {
          list: []
        };
        this.time = {
          delayedCall: jest.fn((delay, callback) => callback())
        };
        this.scene = {
          get: jest.fn(),
          add: jest.fn(),
          stop: jest.fn(),
          launch: jest.fn(),
          start: jest.fn(),
          manager: {
            scenes: []
          }
        };
      }
      add = {
        rectangle: jest.fn(() => ({
          setPosition: jest.fn().mockReturnThis(),
          setSize: jest.fn().mockReturnThis()
        })),
        text: jest.fn(() => ({
          setOrigin: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setStyle: jest.fn().mockReturnThis(),
          setFontSize: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis()
        })),
        image: jest.fn(() => ({
          setOrigin: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis()
        }))
      };
    },
    GameObjects: {
      Text: class {
        constructor(scene, x, y, text, style) {
          this.scene = scene;
          this.x = x;
          this.y = y;
          this.text = text;
          this.style = style;
        }
      }
    }
  };
});

describe('RotatePromptScene', () => {
  let scene;

  beforeEach(() => {
    scene = new RotatePromptScene();
    scene.create();
  });

  describe('create', () => {
    it('should create background, text and icon with correct positions', () => {
      const w = scene.scale.width;
      const h = scene.scale.height;

      expect(scene.add.rectangle).toHaveBeenCalledWith(w/2, h/2, w, h, 0x222222, 1);
      expect(scene.add.text).toHaveBeenCalledWith(
        w/2,
        h/2,
        'Por favor, gire seu dispositivo para o modo paisagem.',
        expect.objectContaining({
          fontSize: Math.max(24, Math.round(w * 0.045)) + 'px'
        })
      );
      expect(scene.add.image).toHaveBeenCalledWith(w/2, h/2 - 80, 'rotate_icon');
    });
  });

  describe('update', () => {
    it('should transition to GameModeScene when in landscape', () => {
      scene.scale.width = 800;
      scene.scale.height = 400; // Landscape mode
      scene.update();

      expect(scene.scene.stop).toHaveBeenCalledWith('RotatePromptScene');
      expect(scene.scene.launch).toHaveBeenCalledWith('GameModeScene');
    });

    it('should not transition when already in landscape mode and scenes added', () => {
      scene.scale.width = 800;
      scene.scale.height = 400;
      scene.scenesAdded = true;
      scene.update();

      expect(scene.scene.launch).not.toHaveBeenCalled();
    });
  });
});

describe('GameModeScene', () => {
  let scene;
  beforeEach(() => {
    scene = new GameModeScene();
    scene.create();
  });

  describe('create', () => {
    it('should create menu elements with correct initial positions', () => {
      const w = scene.cameras.main.width;
      const h = scene.cameras.main.height;

      expect(scene.add.rectangle).toHaveBeenCalledWith(w/2, h/2, w, h, 0x222222, 1);
      expect(scene.add.text).toHaveBeenCalledWith(
        w/2,
        h * 0.3,
        'Escolha o Modo de Jogo',
        expect.objectContaining({
          fontSize: Math.max(24, Math.round(w * 0.045)) + 'px'
        })
      );
    });
  });

  describe('resize', () => {
    it('should update all UI elements when screen size changes', () => {
      // Mock the text elements that would be found
      const mockTitleText = new Phaser.GameObjects.Text(scene, 0, 0, 'Escolha o Modo de Jogo', {});
      /** @type {jest.Mock} */
      const mockTitleSetPosition = jest.fn().mockReturnThis();
      /** @type {jest.Mock} */
      const mockTitleSetFontSize = jest.fn().mockReturnThis();
      /** @type {jest.Mock} */
      const mockTitleSetStyle = jest.fn().mockReturnThis();
      Object.assign(mockTitleText, {
        setPosition: mockTitleSetPosition,
        setFontSize: mockTitleSetFontSize,
        setStyle: mockTitleSetStyle
      });
      
      const mockLocalButton = new Phaser.GameObjects.Text(scene, 0, 0, 'Jogar Local', {});
      /** @type {jest.Mock} */
      const mockLocalSetPosition = jest.fn().mockReturnThis();
      /** @type {jest.Mock} */
      const mockLocalSetStyle = jest.fn().mockReturnThis();
      /** @type {jest.Mock} */
      const mockLocalSetFontSize = jest.fn().mockReturnThis();
      Object.assign(mockLocalButton, {
        setPosition: mockLocalSetPosition,
        setStyle: mockLocalSetStyle,
        setFontSize: mockLocalSetFontSize
      });
      
      const mockOnlineButton = new Phaser.GameObjects.Text(scene, 0, 0, 'Jogar Online', {});
      /** @type {jest.Mock} */
      const mockOnlineSetPosition = jest.fn().mockReturnThis();
      /** @type {jest.Mock} */
      const mockOnlineSetStyle = jest.fn().mockReturnThis();
      /** @type {jest.Mock} */
      const mockOnlineSetFontSize = jest.fn().mockReturnThis();
      Object.assign(mockOnlineButton, {
        setPosition: mockOnlineSetPosition,
        setStyle: mockOnlineSetStyle,
        setFontSize: mockOnlineSetFontSize
      });

      // Create bg mock
      scene.bg = {
        setSize: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis()
      };

      // Setup the children list with our mock elements and find implementation
      scene.children.list = [mockTitleText, mockLocalButton, mockOnlineButton];
      scene.children.list.find = jest.fn(predicate => {
        return scene.children.list.filter(child => predicate(child))[0];
      });

      // Create bg mock
      scene.bg = {
        setSize: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis()
      };

      // Change screen size and trigger resize
      scene.scale = {
        width: 1024,
        height: 768
      };
      scene.resize();

      // Verify background was updated
      expect(scene.bg.setSize).toHaveBeenCalledWith(1024, 768);
      expect(scene.bg.setPosition).toHaveBeenCalledWith(512, 384);

      // Verify title was updated
      const titleCall = mockTitleSetPosition.mock.calls[0];
      expect(titleCall[0]).toBe(512);
      expect(titleCall[1]).toBeCloseTo(768 * 0.3, 5);
      expect(mockTitleSetFontSize).toHaveBeenCalledWith(
        Math.max(24, Math.round(1024 * 0.045)) + 'px'
      );

      // Verify buttons were updated
      const localCall = mockLocalSetPosition.mock.calls[0];
      expect(localCall[0]).toBe(512);
      expect(localCall[1]).toBeCloseTo(768 * 0.5, 5);

      const onlineCall = mockOnlineSetPosition.mock.calls[0];
      expect(onlineCall[0]).toBe(512);
      expect(onlineCall[1]).toBeCloseTo(768 * 0.6, 5);

      // Verify button styles were updated with correct font size
      const expectedButtonStyle = {
        fontSize: Math.max(20, Math.round(1024 * 0.035)) + 'px',
        backgroundColor: '#4a4a4a',
        padding: {
          left: Math.round(1024 * 0.02),
          right: Math.round(1024 * 0.02),
          top: Math.round(1024 * 0.012),
          bottom: Math.round(1024 * 0.012)
        }
      };
      expect(mockLocalButton.setStyle).toHaveBeenCalledWith(expectedButtonStyle);
      expect(mockOnlineButton.setStyle).toHaveBeenCalledWith(expectedButtonStyle);
    });

    it('should handle missing UI elements gracefully', () => {
      // Setup empty children list
      scene.children.list = [];

      // This should not throw an error
      expect(() => {
        scene.resize();
      }).not.toThrow();
    });
  });
});
