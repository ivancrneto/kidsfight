import type { GameObjects } from "phaser";

export class MockText implements Partial<GameObjects.Text> {
  setPadding = jest.fn().mockReturnThis();
  setBackgroundColor = jest.fn().mockReturnThis();
  setText = jest.fn().mockReturnThis();
  setVisible = jest.fn().mockReturnThis();
  setTextOrigin = jest.fn().mockReturnThis();
  setScrollFactor = jest.fn().mockReturnThis();
  setDepth = jest.fn().mockReturnThis();
  setFontSize = jest.fn().mockReturnThis();
  setColor = jest.fn().mockReturnThis();
  setShadow = jest.fn().mockReturnThis();
  setAlpha = jest.fn().mockReturnThis();
  setInteractive = jest.fn().mockReturnThis();
  disableInteractive = jest.fn().mockReturnThis();
  setOrigin = jest.fn().mockReturnThis();
  destroy = jest.fn().mockReturnThis();
  on = jest.fn().mockReturnThis();
  setStyle = jest.fn().mockReturnThis();
  off = jest.fn().mockReturnThis();
  emit = jest.fn().mockReturnThis();
  once = jest.fn().mockReturnThis();
  x = 0;
  y = 0;
  setX = jest.fn().mockReturnThis();
  setY = jest.fn().mockReturnThis();
  scene = {} as Phaser.Scene;
  type = 'Text';
  name = '';
  active = true;
  data = {};
  setData = jest.fn().mockReturnThis();
  getData = jest.fn();
  setActive = jest.fn().mockReturnThis();
  setPosition = jest.fn().mockReturnThis();
  setRotation = jest.fn().mockReturnThis();
  setAngle = jest.fn().mockReturnThis();
  setScale = jest.fn().mockReturnThis();
  setBlendMode = jest.fn().mockReturnThis();
  setPipeline = jest.fn().mockReturnThis();
  setPostPipeline = jest.fn().mockReturnThis();
  setPipelineData = jest.fn().mockReturnThis();
  getPipelineName = jest.fn();
  getPostPipeline = jest.fn();
  resetPipeline = jest.fn().mockReturnThis();
  resetPostPipeline = jest.fn().mockReturnThis();
  initPipeline = jest.fn().mockReturnThis();
  refreshPipeline = jest.fn().mockReturnThis();
  getPipeline = jest.fn();
  setMask = jest.fn().mockReturnThis();
  clearMask = jest.fn().mockReturnThis();
  createBitmapMask = jest.fn().mockReturnThis();
  createGeometryMask = jest.fn().mockReturnThis();
  setTint = jest.fn().mockReturnThis();
  setTintFill = jest.fn().mockReturnThis();
  clearTint = jest.fn().mockReturnThis();
  setTexture = jest.fn().mockReturnThis();
  setFrame = jest.fn().mockReturnThis();
  setOriginFromFrame = jest.fn().mockReturnThis();
  setDisplaySize = jest.fn().mockReturnThis();
  setSize = jest.fn().mockReturnThis();
  setDisplayOrigin = jest.fn().mockReturnThis();
  setStrokeStyle = jest.fn().mockReturnThis();
  setFillStyle = jest.fn().mockReturnThis();
  setShadowStyle = jest.fn().mockReturnThis();
  setFixedSize = jest.fn().mockReturnThis();
  setWordWrapWidth = jest.fn().mockReturnThis();
  setLineSpacing = jest.fn().mockReturnThis();
  setAlign = jest.fn().mockReturnThis();
  setFont = jest.fn().mockReturnThis();
  setFontFamily = jest.fn().mockReturnThis();
  setFontStyle = jest.fn().mockReturnThis();
  setTestString = jest.fn().mockReturnThis();
  setRTL = jest.fn().mockReturnThis();
  setBaselineY = jest.fn().mockReturnThis();
  setMaxLines = jest.fn().mockReturnThis();
  setResolution = jest.fn().mockReturnThis();
  setPadding = jest.fn().mockReturnThis();
  setStyle = jest.fn().mockReturnThis();
  setShadowOffset = jest.fn().mockReturnThis();
  setShadowBlur = jest.fn().mockReturnThis();
  setShadowStroke = jest.fn().mockReturnThis();
  setShadowFill = jest.fn().mockReturnThis();
  setShadowColor = jest.fn().mockReturnThis();
  setShadowOffsetX = jest.fn().mockReturnThis();
  setShadowOffsetY = jest.fn().mockReturnThis();
  setShadowBlurRadius = jest.fn().mockReturnThis();
  setShadowStrokeEnabled = jest.fn().mockReturnThis();
  setShadowFillEnabled = jest.fn().mockReturnThis();
  setShadowColorString = jest.fn().mockReturnThis();
  setShadowOffsetXInt = jest.fn().mockReturnThis();
  setShadowOffsetYInt = jest.fn().mockReturnThis();
  setShadowBlurRadiusInt = jest.fn().mockReturnThis();
  setShadowStrokeEnabledBoolean = jest.fn().mockReturnThis();
  setShadowFillEnabledBoolean = jest.fn().mockReturnThis();
  setShadowColorStringString = jest.fn().mockReturnThis();
  setShadowOffsetXNumber = jest.fn().mockReturnThis();
  setShadowOffsetYNumber = jest.fn().mockReturnThis();
  setShadowBlurRadiusNumber = jest.fn().mockReturnThis();
  setShadowStrokeEnabledBooleanBoolean = jest.fn().mockReturnThis();
  setShadowFillEnabledBooleanBoolean = jest.fn().mockReturnThis();
  setShadowColorStringStringString = jest.fn().mockReturnThis();
  setShadowOffsetXNumberNumber = jest.fn().mockReturnThis();
  setShadowOffsetYNumberNumber = jest.fn().mockReturnThis();
  setShadowBlurRadiusNumberNumber = jest.fn().mockReturnThis();
  setShadowStrokeEnabledBooleanBooleanBoolean = jest.fn().mockReturnThis();
  setShadowFillEnabledBooleanBooleanBoolean = jest.fn().mockReturnThis();
}

export class MockTime {
  addEvent = jest.fn();
  now = 0;
  delayedCall = jest.fn();
  removeAllEvents = jest.fn();
  removeAllEventsAfter = jest.fn();
  clearPendingEvents = jest.fn();
  getElapsed = jest.fn();
  getElapsedSeconds = jest.fn();
  getTime = jest.fn();
  getDuration = jest.fn();
  getDurationSeconds = jest.fn();
  getStartTime = jest.fn();
  getStartTimeSeconds = jest.fn();
  getRemaining = jest.fn();
  getRemainingSeconds = jest.fn();
  getProgress = jest.fn();
  getProgressDecimal = jest.fn();
  getOverallProgress = jest.fn();
  getOverallProgressDecimal = jest.fn();
  getTotalElapsed = jest.fn();
  getTotalElapsedSeconds = jest.fn();
  getTotalDuration = jest.fn();
  getTotalDurationSeconds = jest.fn();
  getTotalRemaining = jest.fn();
  getTotalRemainingSeconds = jest.fn();
  getTotalProgress = jest.fn();
  getTotalProgressDecimal = jest.fn();
  getTotalOverallProgress = jest.fn();
  getTotalOverallProgressDecimal = jest.fn();
  getEvents = jest.fn();
  getPendingEvents = jest.fn();
  getActiveEvents = jest.fn();
  getEventCount = jest.fn();
  getPendingCount = jest.fn();
  getActiveCount = jest.fn();
  getTotalCount = jest.fn();
  getTotalElapsedCount = jest.fn();
  getTotalDurationCount = jest.fn();
  getTotalRemainingCount = jest.fn();
  getTotalProgressCount = jest.fn();
  getTotalOverallProgressCount = jest.fn();
  getTotalElapsedSecondsCount = jest.fn();
  getTotalDurationSecondsCount = jest.fn();
  getTotalRemainingSecondsCount = jest.fn();
  getTotalProgressDecimalCount = jest.fn();
  getTotalOverallProgressDecimalCount = jest.fn();
  getTotalElapsedDecimal = jest.fn();
  getTotalDurationDecimal = jest.fn();
  getTotalRemainingDecimal = jest.fn();
  getTotalProgressDecimalDecimal = jest.fn();
  getTotalOverallProgressDecimalDecimal = jest.fn();
  getTotalElapsedSecondsDecimal = jest.fn();
  getTotalDurationSecondsDecimal = jest.fn();
  getTotalRemainingSecondsDecimal = jest.fn();
  getTotalProgressDecimalDecimalDecimal = jest.fn();
  getTotalOverallProgressDecimalDecimalDecimal = jest.fn();
}

export class MockTimerEvent {
  paused = false;
  remove = jest.fn();
  destroy = jest.fn();
  delay = 0;
  elapsed = 0;
  loop = false;
  callback = jest.fn();
  callbackScope = {};
  args: any[] = [];
  timeScale = 1;
  startAt = 0;
  repeat = 0;
  repeatCount = 0;
  hasDispatched = false;
  pausedAt = 0;
  dispatch = jest.fn();
  getOverallProgress = jest.fn();
  getOverallRemaining = jest.fn();
  getProgress = jest.fn();
  getRemaining = jest.fn();
  getRepeatCount = jest.fn();
  getElapsed = jest.fn();
  getElapsedSeconds = jest.fn();
  getRemainingSeconds = jest.fn();
  getProgressDecimal = jest.fn();
  getOverallProgressDecimal = jest.fn();
  getOverallRemainingSeconds = jest.fn();
  getDuration = jest.fn();
  getDurationSeconds = jest.fn();
  getStartAt = jest.fn();
  getStartAtSeconds = jest.fn();
  getTimeScale = jest.fn();
  setTimeScale = jest.fn();
  reset = jest.fn();
  pause = jest.fn();
  resume = jest.fn();
}

// Add a comprehensive Phaser.Scene.prototype.add mock for all scene tests
export function patchPhaserAddMock(target: any) {
  target.add = {
    text: jest.fn(() => new MockText()),
    image: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setTexture: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setBackgroundColor: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    })),
    graphics: jest.fn(() => ({
      setDepth: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setFillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn().mockReturnThis(),
      fillCircle: jest.fn().mockReturnThis(),
      clear: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    })),
    rectangle: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setFillStyle: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    })),
    circle: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setStrokeStyle: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    })),
    sprite: jest.fn(() => ({
      setScale: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setCrop: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    })),
  };
  // Add other common scene properties used in tests
  target.scale = { on: jest.fn() };
  target.sound = { add: jest.fn(() => ({ play: jest.fn(), stop: jest.fn() })) };
  target.scene = { start: jest.fn(), stop: jest.fn(), get: jest.fn() };
  target.input = { keyboard: { createCursorKeys: jest.fn() } };
  target.tweens = { add: jest.fn(), create: jest.fn() };
  target.time = { addEvent: jest.fn() };
  target.cameras = { main: { width: 800, height: 600 } };
  target.load = { image: jest.fn(), spritesheet: jest.fn() };
  target.events = { on: jest.fn(), once: jest.fn() };
  target.game = { config: { width: 800, height: 600 } };
}

// Add a mock for staticGroup in physics.add for scene tests
export function createMockPhysicsAdd() {
  return {
    sprite: jest.fn(() => ({
      setCollideWorldBounds: jest.fn().mockReturnThis(),
      setBounce: jest.fn().mockReturnThis(),
      setVelocity: jest.fn().mockReturnThis()
    })),
    group: jest.fn(() => ({
      createMultiple: jest.fn().mockReturnThis(),
      getChildren: jest.fn().mockReturnValue([])
    })),
    staticGroup: jest.fn(() => ({
      create: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      getChildren: jest.fn().mockReturnValue([])
    }))
  };
}
