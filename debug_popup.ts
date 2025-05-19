interface ReplayRequestData {
  type: string;
  action: string;
  p1: string;
  p2: string;
  scenario: string;
  roomCode: string;
  timestamp: number;
}

interface KidsFightScene extends Phaser.Scene {
  scene: Phaser.Scenes.ScenePlugin & { key: string };
  selected?: {
    p1: string;
    p2: string;
  };
  selectedScenario?: string;
  roomCode?: string;
  gameOver: boolean;
  showReplayRequestPopup: (data: ReplayRequestData) => void;
  wsManager?: {
    isConnected: () => boolean;
    send: (data: any) => void;
  };
}

interface GameInstance extends Phaser.Game {
  scene: {
    scenes: KidsFightScene[];
  };
}

declare global {
  interface Window {
    game: GameInstance;
    testReplayPopup: () => void;
    checkWebSocketConnection: () => void;
    sendTestReplayRequest: () => void;
  }
}

// Function to be called from the browser console to test the popup
export function testReplayPopup(): void {
  try {
    // Get the current scene
    const currentScene = window.game.scene.scenes.find(scene => scene.scene.key === 'KidsFightScene');
    
    if (!currentScene) {
      console.error('[DEBUG] KidsFightScene not found');
      return;
    }
    
    console.log('[DEBUG] Found KidsFightScene, forcing popup to appear');
    
    // Create a fake request data object
    const fakeRequestData: ReplayRequestData = {
      type: 'replay_request',
      action: 'replay_same_players',
      p1: currentScene.selected?.p1 || 'player1',
      p2: currentScene.selected?.p2 || 'player2',
      scenario: currentScene.selectedScenario || 'default',
      roomCode: currentScene.roomCode || 'debug-room',
      timestamp: Date.now()
    };
    
    // Force the gameOver state if it's not already set
    if (!currentScene.gameOver) {
      console.log('[DEBUG] Setting gameOver to true');
      currentScene.gameOver = true;
    }
    
    // Force show the popup
    if (typeof currentScene.showReplayRequestPopup === 'function') {
      console.log('[DEBUG] Calling showReplayRequestPopup');
      currentScene.showReplayRequestPopup(fakeRequestData);
    } else {
      console.error('[DEBUG] showReplayRequestPopup is not a function');
    }
  } catch (error) {
    console.error('[DEBUG] Error testing popup:', error);
  }
}

// Function to check the WebSocket connection
export function checkWebSocketConnection(): void {
  try {
    // Get the current scene
    const currentScene = window.game.scene.scenes.find(scene => scene.scene.key === 'KidsFightScene');
    
    if (!currentScene) {
      console.error('[DEBUG] KidsFightScene not found');
      return;
    }
    
    if (!currentScene.wsManager) {
      console.error('[DEBUG] WebSocket manager not found');
      return;
    }
    
    const isConnected = currentScene.wsManager.isConnected();
    console.log('[DEBUG] WebSocket connection status:', isConnected ? 'Connected' : 'Disconnected');
  } catch (error) {
    console.error('[DEBUG] Error checking WebSocket connection:', error);
  }
}

// Function to send a test replay request via WebSocket
export function sendTestReplayRequest(): void {
  try {
    // Get the current scene
    const currentScene = window.game.scene.scenes.find(scene => scene.scene.key === 'KidsFightScene');
    
    if (!currentScene) {
      console.error('[DEBUG] KidsFightScene not found');
      return;
    }
    
    if (!currentScene.wsManager) {
      console.error('[DEBUG] WebSocket manager not found');
      return;
    }
    
    // Create a test replay request
    const testRequest = {
      type: 'replay_request',
      action: 'replay_same_players',
      p1: currentScene.selected?.p1 || 'player1',
      p2: currentScene.selected?.p2 || 'player2',
      scenario: currentScene.selectedScenario || 'default',
      roomCode: currentScene.roomCode || 'debug-room',
      timestamp: Date.now()
    };
    
    // Send the request via WebSocket
    currentScene.wsManager.send(testRequest);
    console.log('[DEBUG] Sent test replay request:', testRequest);
  } catch (error) {
    console.error('[DEBUG] Error sending test replay request:', error);
  }
}

// Add these functions to the window object so they can be called from the console
window.testReplayPopup = testReplayPopup;
window.checkWebSocketConnection = checkWebSocketConnection;
window.sendTestReplayRequest = sendTestReplayRequest;
