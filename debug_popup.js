// This file contains debugging functions for the rematch popup functionality

// Function to be called from the browser console to test the popup
function testReplayPopup() {
  try {
    // Get the current scene
    const currentScene = window.game.scene.scenes.find(scene => scene.scene.key === 'KidsFightScene');
    
    if (!currentScene) {
      console.error('[DEBUG] KidsFightScene not found');
      return;
    }
    
    console.log('[DEBUG] Found KidsFightScene, forcing popup to appear');
    
    // Create a fake request data object
    const fakeRequestData = {
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
function checkWebSocketConnection() {
  try {
    // Get the current scene
    const currentScene = window.game.scene.scenes.find(scene => scene.scene.key === 'KidsFightScene');
    
    if (!currentScene) {
      console.error('[DEBUG] KidsFightScene not found');
      return;
    }
    
    if (!currentScene.wsManager) {
      console.error('[DEBUG] wsManager not found');
      return;
    }
    
    console.log('[DEBUG] WebSocket connection status:', {
      isConnected: currentScene.wsManager.isConnected(),
      wsExists: !!currentScene.wsManager.ws,
      readyState: currentScene.wsManager.ws ? currentScene.wsManager.ws.readyState : 'N/A',
      isHost: currentScene.wsManager.isHost,
      roomCode: currentScene.roomCode
    });
  } catch (error) {
    console.error('[DEBUG] Error checking WebSocket connection:', error);
  }
}

// Function to send a test replay request via WebSocket
function sendTestReplayRequest() {
  try {
    // Get the current scene
    const currentScene = window.game.scene.scenes.find(scene => scene.scene.key === 'KidsFightScene');
    
    if (!currentScene) {
      console.error('[DEBUG] KidsFightScene not found');
      return;
    }
    
    if (!currentScene.wsManager || !currentScene.wsManager.isConnected()) {
      console.error('[DEBUG] WebSocket not connected');
      return;
    }
    
    // Create a test request
    const testRequest = {
      type: 'replay_request',
      action: 'replay_same_players',
      p1: currentScene.selected?.p1 || 'player1',
      p2: currentScene.selected?.p2 || 'player2',
      scenario: currentScene.selectedScenario || 'default',
      roomCode: currentScene.roomCode,
      timestamp: Date.now()
    };
    
    console.log('[DEBUG] Sending test replay request:', testRequest);
    currentScene.wsManager.send(testRequest);
  } catch (error) {
    console.error('[DEBUG] Error sending test replay request:', error);
  }
}

// Add these functions to the window object so they can be called from the console
window.testReplayPopup = testReplayPopup;
window.checkWebSocketConnection = checkWebSocketConnection;
window.sendTestReplayRequest = sendTestReplayRequest;

console.log('[DEBUG] Debug popup functions loaded. You can now use the following functions in the browser console:');
console.log('  - testReplayPopup() - Test the replay popup directly');
console.log('  - checkWebSocketConnection() - Check the WebSocket connection status');
console.log('  - sendTestReplayRequest() - Send a test replay request via WebSocket');
