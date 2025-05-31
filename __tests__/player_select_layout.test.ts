import { getCharacterGridPosition } from '../player_select_layout';

describe('getCharacterGridPosition', () => {
  const params = {
    gridCols: 3,
    gridRows: 3,
    w: 900,
    h: 600,
    gridW: 630, // 0.7 * 900
    gridH: 390, // 0.65 * 600
    circleRadius: 60,
    labelOffset: 10,
  };

  it('computes correct center cell positions and offsets', () => {
    // Center cell (col 1, row 1)
    const pos = getCharacterGridPosition(
      1, 1,
      params.gridCols, params.gridRows,
      params.w, params.h,
      params.gridW, params.gridH,
      params.circleRadius, params.labelOffset
    );
    expect(pos.x).toBeCloseTo(params.w / 2, 1); // x should be near center
    expect(pos.y).toBeGreaterThan(0); // y should be positive
    // Check offset application
    expect(pos.circleY).toBeLessThan(pos.y);
    expect(pos.spriteY).toBeGreaterThan(pos.y);
    expect(pos.nameY).toBeLessThan(pos.y + params.circleRadius + params.labelOffset);
  });

  it('computes correct positions for top-left cell', () => {
    const pos = getCharacterGridPosition(
      0, 0,
      params.gridCols, params.gridRows,
      params.w, params.h,
      params.gridW, params.gridH,
      params.circleRadius, params.labelOffset
    );
    expect(pos.x).toBeLessThan(params.w / 2);
    expect(pos.y).toBeLessThan(params.h / 2);
  });

  it('computes correct positions for bottom-right cell', () => {
    const pos = getCharacterGridPosition(
      2, 2,
      params.gridCols, params.gridRows,
      params.w, params.h,
      params.gridW, params.gridH,
      params.circleRadius, params.labelOffset
    );
    expect(pos.x).toBeGreaterThan(params.w / 2);
    expect(pos.y).toBeGreaterThan(params.h / 2);
  });
});
