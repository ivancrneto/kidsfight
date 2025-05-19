// Type definitions for Phaser 3.60.0

declare namespace Phaser {
  namespace GameObjects {
    class GameObject extends Events.EventEmitter {
      scene: Scene;
      active: boolean;
      name: string;
      type: string;
      visible: boolean;
      x: number;
      y: number;
      width: number;
      height: number;
      setPosition(x: number, y: number): this;
      setVisible(value: boolean): this;
      setActive(value: boolean): this;
      destroy(): void;
    }

    class Sprite extends GameObject {
      constructor(scene: Scene, x: number, y: number, texture: string, frame?: string | number);
      setTexture(key: string, frame?: string | number): this;
      play(key: string, ignoreIfPlaying?: boolean): this;
      setFlipX(value: boolean): this;
      setFlipY(value: boolean): this;
      setScale(x: number, y?: number): this;
      setOrigin(x?: number, y?: number): this;
      setDepth(value: number): this;
      setAlpha(value: number): this;
      setAngle(degrees: number): this;
      setRotation(radians: number): this;
      setInteractive(hitArea?: any, callback?: Function, dropZone?: boolean): this;
      on(event: string, callback: Function, context?: any): this;
      off(event: string, callback?: Function, context?: any): this;
    }

    class Text extends GameObject {
      constructor(scene: Scene, x: number, y: number, text: string, style: object);
      setText(value: string): this;
      setStyle(style: object): this;
      setFont(font: string): this;
      setFontSize(size: number): this;
      setColor(color: string): this;
      setAlign(align: string): this;
      setFixedSize(width: number, height: number): this;
      setWordWrapWidth(width: number, useAdvancedWrap?: boolean): this;
      setLineSpacing(value: number): this;
      setShadow(x: number, y: number, color: string, blur: number, shadowStroke?: boolean, shadowFill?: boolean): this;
    }
  }

  class Scene {
    constructor(config?: string | object);
    sys: any;
    anims: any;
    cache: any;
    input: any;
    load: any;
    time: any;
    tweens: any;
    physics: any;
    sound: any;
    texturemanager: any;
    game: Game;
    scene: any;
    children: any;
    events: any;
    add: any;
    make: any;
    camera: any;
    data: any;
    registry: any;
    scale: any;
    scenePlugin: any;
    sceneManager: any;

    preload(): void;
    create(): void;
    update(time: number, delta: number): void;
    shutdown(): void;
    destroy(): void;
  }

  class Game {
    constructor(config: object);
    config: object;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    isBooted: boolean;
    isRunning: boolean;
    isPaused: boolean;
    hasFocus: boolean;
    width: number;
    height: number;
    resolution: number;
    device: any;
    animationFrame: any;
    scene: any;
    sceneManager: any;
    sound: any;
    textures: any;
    cache: any;
    registry: any;
    scale: any;
    plugins: any;
    loop: any;
    renderer: any;
    canvasToTexture: any;
    debug: any;
    device: any;
    dom: any;
    events: any;
    input: any;
    load: any;
    physics: any;
    renderer: any;
    scale: any;
    sound: any;
    textures: any;
    time: any;
    tweens: any;
    version: string;

    destroy(removeCanvas: boolean, noReturn: boolean): void;
    getFrame(): number;
    getTime(): number;
    getStep(): number;
    getTimeStep(): number;
    getElapsed(): number;
    getElapsedSeconds(): number;
    getFrameRate(): number;
    getFramesDropped(): number;
    getFrameDuration(): number;
    getFrameMs(): number;
    getFrameSkip(): number;
    getFrameSkipStep(): number;
    getFrameSkipWindow(): number;
    getFrameSkipWindowMs(): number;
    getFrameSkipWindowStep(): number;
    getFrameSkipWindowMsStep(): number;
    getFrameSkipWindowMsTotal(): number;
    getFrameSkipWindowMsTotalStep(): number;
    getFrameSkipWindowMsTotalStepMs(): number;
    getFrameSkipWindowMsTotalStepMsStep(): number;
    getFrameSkipWindowMsTotalStepMsStepMs(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStep(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMs(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStep(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMs(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStep(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStepMs(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStepMsStep(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStepMsStepMs(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStepMsStepMsStep(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStepMsStepMsStepMs(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStepMsStepMsStepMsStep(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStepMsStepMsStepMsStepMs(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStepMsStepMsStepMsStepMsStep(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStepMsStepMsStepMsStepMsStepMs(): number;
    getFrameSkipWindowMsTotalStepMsStepMsStepMsStepMsStepMsStepMsStepMsStepMsStepMsStep(): number;
  }

  namespace Events {
    class EventEmitter {
      on(event: string, fn: Function, context?: any): this;
      once(event: string, fn: Function, context?: any): this;
      off(event: string, fn?: Function, context?: any, once?: boolean): this;
      emit(event: string, ...args: any[]): boolean;
      addListener(event: string, fn: Function, context?: any): this;
      removeListener(event: string, fn?: Function, context?: any, once?: boolean): this;
      removeAllListeners(event?: string): this;
      listenerCount(event: string): number;
      listeners(event: string): Function[];
      eventNames(): string[];
    }
  }
}
