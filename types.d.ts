// Type definitions for image files
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

// Shared game interfaces
export interface GameObject extends Phaser.GameObjects.GameObject {
  setPosition: (x: number, y: number) => void;
  setSize?: (width: number, height: number) => void;
  setScale?: (scale: number) => void;
  setAlpha?: (alpha: number) => void;
  setVisible?: (visible: boolean) => void;
  setTint?: (tint: number) => void;
  setTexture?: (texture: string) => void;
  setFrame?: (frame: number) => void;
  displayWidth?: number;
  width?: number;
  x: number;
  y: number;
  originX?: number;
  originY?: number;
  setDisplaySize?: (width: number, height: number) => void;
  setOrigin?: (x: number, y: number) => void;
}


export interface GameScene extends Phaser.Scene {
  scale: Phaser.Scale.ScaleManager;
  isReady?: boolean;
  player1?: Player;
  player2?: Player;
  platform?: GameObject;
  background?: GameObject;
  healthBar1?: GameObject;
  healthBar2?: GameObject;
  healthBarBg1?: GameObject;
  healthBarBg2?: GameObject;
  specialBar1?: GameObject;
  specialBar2?: GameObject;
  specialBarBg1?: GameObject;
  specialBarBg2?: GameObject;
  p1Health?: number;
  p2Health?: number;
  p1Special?: number;
  p2Special?: number;
  p1Name?: Phaser.GameObjects.Text;
  p2Name?: Phaser.GameObjects.Text;
  p1HealthText?: Phaser.GameObjects.Text;
  p2HealthText?: Phaser.GameObjects.Text;
  p1SpecialText?: Phaser.GameObjects.Text;
  p2SpecialText?: Phaser.GameObjects.Text;
  winnerText?: Phaser.GameObjects.Text;
  readyText?: Phaser.GameObjects.Text;
  countdownText?: Phaser.GameObjects.Text;
  wsManager?: {
    isConnected: () => boolean;
    send: (data: any) => void;
    setRoomCode: (code: string) => void;
    isHost: boolean;
  };
  selected?: {
    p1: string;
    p2: string;
  };
  selectedScenario?: string;
  roomCode?: string;
  gameOver?: boolean;
}

export interface SceneData {
  mode?: 'local' | 'online';
  fromGameMode?: boolean;
  roomCode?: string;
  isHost?: boolean;
  selected?: {
    p1: string;
    p2: string;
  };
  scenario?: string;
}
