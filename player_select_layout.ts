export interface CharacterGridPosition {
  x: number;
  y: number;
  circleY: number;
  nameY: number;
  spriteY: number;
}

export function getCharacterGridPosition(
  col: number,
  row: number,
  gridCols: number,
  gridRows: number,
  w: number,
  h: number,
  gridW: number,
  gridH: number,
  circleRadius: number,
  labelOffset: number
): CharacterGridPosition {
  const cellW = gridW / gridCols;
  const cellH = gridH / gridRows;
  const startX = w / 2 - gridW / 2 + cellW / 2;
  const startY = h / 2 - gridH / 2 + cellH / 2 + 20;

  const x = startX + col * cellW;
  const y = startY + row * cellH;

  // Offsets as in your latest code
  const circleYOffset = -cellH * 0.4;
  const nameYOffset = -cellH * 0.1;
  const spriteYOffset = cellH * 0.3;

  return {
    x,
    y,
    circleY: y + circleYOffset,
    nameY: y + nameYOffset + circleRadius + labelOffset + circleYOffset,
    spriteY: y + spriteYOffset + circleRadius / 2
  };
}
