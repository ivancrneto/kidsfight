// Unit test for special pips visibility logic
// This test uses Jest-like syntax. If you use another runner, adapt as needed.

// Mock objects to simulate Phaser objects
function createMockPip() {
  return {
    visible: true,
    color: 0x888888,
    setFillStyle: function(color) { this.color = color; return this; },
    setVisible: function(v) { this.visible = v; return this; }
  };
}

function createMockScene() {
  return {
    attackCount: [0, 0],
    specialPips1: [createMockPip(), createMockPip(), createMockPip()],
    specialPips2: [createMockPip(), createMockPip(), createMockPip()],
    specialReady1: { visible: false, setVisible: function(v) { this.visible = v; return this; } },
    specialReady2: { visible: false, setVisible: function(v) { this.visible = v; return this; } },
    specialReadyText1: { visible: false, setVisible: function(v) { this.visible = v; return this; } },
    specialReadyText2: { visible: false, setVisible: function(v) { this.visible = v; return this; } }
  };
}

// Extracted helper from main.js for testing
function updateSpecialPips(scene, playerIdx) {
  const attackCount = scene.attackCount?.[playerIdx] || 0;
  const pips = playerIdx === 0 ? scene.specialPips1 : scene.specialPips2;
  const specialReady = playerIdx === 0 ? scene.specialReady1 : scene.specialReady2;
  const specialReadyText = playerIdx === 0 ? scene.specialReadyText1 : scene.specialReadyText2;
  if (attackCount >= 3) {
    for (let i = 0; i < 3; i++) {
      if (pips[i]) pips[i].setVisible(false);
    }
    if (specialReady) specialReady.setVisible(true);
    if (specialReadyText) specialReadyText.setVisible(true);
  } else {
    for (let i = 0; i < 3; i++) {
      if (pips[i]) {
        pips[i].setFillStyle(i < attackCount ? 0xffd700 : 0x888888).setVisible(true);
      }
    }
    if (specialReady) specialReady.setVisible(false);
    if (specialReadyText) specialReadyText.setVisible(false);
  }
}

describe('Special pips UI logic', () => {
  it('shows correct pips for 0, 1, 2 attacks and hides all after 3', () => {
    const scene = createMockScene();
    for (let count = 0; count <= 4; count++) {
      scene.attackCount[0] = count;
      updateSpecialPips(scene, 0);
      if (count < 3) {
        // Pips: only [0,count) are yellow, all visible
        for (let i = 0; i < 3; i++) {
          expect(scene.specialPips1[i].visible).toBe(true);
          if (i < count) {
            expect(scene.specialPips1[i].color).toBe(0xffd700);
          } else {
            expect(scene.specialPips1[i].color).toBe(0x888888);
          }
        }
        expect(scene.specialReady1.visible).toBe(false);
        expect(scene.specialReadyText1.visible).toBe(false);
      } else {
        // All pips hidden, special indicator visible
        for (let i = 0; i < 3; i++) {
          expect(scene.specialPips1[i].visible).toBe(false);
        }
        expect(scene.specialReady1.visible).toBe(true);
        expect(scene.specialReadyText1.visible).toBe(true);
      }
    }
    // Simulate using the special: reset attackCount to 0
    scene.attackCount[0] = 0;
    updateSpecialPips(scene, 0);
    // All pips should reappear, all gray, indicator hidden
    for (let i = 0; i < 3; i++) {
      expect(scene.specialPips1[i].visible).toBe(true);
      expect(scene.specialPips1[i].color).toBe(0x888888);
    }
    expect(scene.specialReady1.visible).toBe(false);
    expect(scene.specialReadyText1.visible).toBe(false);

  });
});
