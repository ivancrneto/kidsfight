import type { GameObjects } from "phaser";

export class MockText implements Partial<GameObjects.Text> {
  setText = jest.fn();
  setVisible = jest.fn();
  setTextOrigin = jest.fn();
  setScrollFactor = jest.fn();
  setDepth = jest.fn();
  setFontSize = jest.fn();
  setColor = jest.fn();
  setShadow = jest.fn();
  setAlpha = jest.fn();
  setInteractive = jest.fn();
  on = jest.fn();
  x = 0;
  y = 0;
  scene = {} as Phaser.Scene;
  type = 'Text';
  name = '';
  active = true;
  data = {};
  destroy = jest.fn();
  setData = jest.fn();
  getData = jest.fn();
  setActive = jest.fn();
  setPosition = jest.fn();
  setRotation = jest.fn();
  setAngle = jest.fn();
  setScale = jest.fn();
  setOrigin = jest.fn();
  setBlendMode = jest.fn();
  setPipeline = jest.fn();
  setPostPipeline = jest.fn();
  setPipelineData = jest.fn();
  getPipelineName = jest.fn();
  getPostPipeline = jest.fn();
  resetPipeline = jest.fn();
  resetPostPipeline = jest.fn();
  initPipeline = jest.fn();
  refreshPipeline = jest.fn();
  getPipeline = jest.fn();
  setMask = jest.fn();
  clearMask = jest.fn();
  createBitmapMask = jest.fn();
  createGeometryMask = jest.fn();
  setTint = jest.fn();
  setTintFill = jest.fn();
  clearTint = jest.fn();
  setTexture = jest.fn();
  setFrame = jest.fn();
  setOriginFromFrame = jest.fn();
  setDisplaySize = jest.fn();
  setSize = jest.fn();
  setDisplayOrigin = jest.fn();
  setStrokeStyle = jest.fn();
  setFillStyle = jest.fn();
  setShadowStyle = jest.fn();
  setFixedSize = jest.fn();
  setWordWrapWidth = jest.fn();
  setLineSpacing = jest.fn();
  setAlign = jest.fn();
  setFont = jest.fn();
  setFontFamily = jest.fn();
  setFontStyle = jest.fn();
  setTestString = jest.fn();
  setRTL = jest.fn();
  setBaselineY = jest.fn();
  setMaxLines = jest.fn();
  setResolution = jest.fn();
  setPadding = jest.fn();
  setStyle = jest.fn();
  setShadowOffset = jest.fn();
  setShadowBlur = jest.fn();
  setShadowStroke = jest.fn();
  setShadowFill = jest.fn();
  setShadowColor = jest.fn();
  setShadowOffsetX = jest.fn();
  setShadowOffsetY = jest.fn();
  setShadowBlurRadius = jest.fn();
  setShadowStrokeEnabled = jest.fn();
  setShadowFillEnabled = jest.fn();
  setShadowColorString = jest.fn();
  setShadowOffsetXInt = jest.fn();
  setShadowOffsetYInt = jest.fn();
  setShadowBlurRadiusInt = jest.fn();
  setShadowStrokeEnabledBoolean = jest.fn();
  setShadowFillEnabledBoolean = jest.fn();
  setShadowColorStringString = jest.fn();
  setShadowOffsetXNumber = jest.fn();
  setShadowOffsetYNumber = jest.fn();
  setShadowBlurRadiusNumber = jest.fn();
  setShadowStrokeEnabledBooleanBoolean = jest.fn();
  setShadowFillEnabledBooleanBoolean = jest.fn();
  setShadowColorStringStringString = jest.fn();
  setShadowOffsetXNumberNumber = jest.fn();
  setShadowOffsetYNumberNumber = jest.fn();
  setShadowBlurRadiusNumberNumber = jest.fn();
  setShadowStrokeEnabledBooleanBooleanBoolean = jest.fn();
  setShadowFillEnabledBooleanBooleanBoolean = jest.fn();
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
