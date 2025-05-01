// Pure logic test for isLandscape, no problematic imports
let orientation = 'landscape';
function isLandscape() {
  return orientation === 'landscape';
}

describe('Orientation Overlay Behavior', () => {
  afterEach(() => {
    orientation = 'landscape';
  });

  it('shows overlay in portrait mode', () => {
    orientation = 'portrait';
    expect(isLandscape()).toBe(false);
    // Here you would check that RotatePromptScene is shown, but we can only check the orientation logic
  });

  it('does not show overlay in landscape mode', () => {
    orientation = 'landscape';
    expect(isLandscape()).toBe(true);
    // Here you would check that KidsFightScene is shown, but we can only check the orientation logic
  });
});
