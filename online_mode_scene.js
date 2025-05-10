import Phaser from 'phaser';
import wsManager from './websocket_manager';

class OnlineModeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OnlineModeScene' });
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Add background
    this.bg = this.add.rectangle(w/2, h/2, w, h, 0x222222, 1);

    // Title text
    const titleText = this.add.text(
      w/2,
      h * 0.3,
      'Modo Online',
      {
        fontSize: Math.max(24, Math.round(w * 0.045)) + 'px',
        color: '#fff',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5);

    // Button style
    const buttonStyle = {
      fontSize: Math.max(20, Math.round(w * 0.035)) + 'px',
      color: '#fff',
      fontFamily: 'monospace',
      backgroundColor: '#4a4a4a',
      padding: {
        left: Math.round(w * 0.02),
        right: Math.round(w * 0.02),
        top: Math.round(w * 0.012),
        bottom: Math.round(w * 0.012)
      }
    };

    // Create game button
    const createButton = this.add.text(
      w/2,
      h * 0.45,
      'Criar Jogo',
      buttonStyle
    ).setOrigin(0.5);
    createButton.setInteractive({ useHandCursor: true });

    // Join game button
    const joinButton = this.add.text(
      w/2,
      h * 0.55,
      'Juntar-se',
      buttonStyle
    ).setOrigin(0.5);
    joinButton.setInteractive({ useHandCursor: true });

    // Back button
    const backButton = this.add.text(
      w/2,
      h * 0.75,
      'Voltar',
      buttonStyle
    ).setOrigin(0.5);
    backButton.setInteractive({ useHandCursor: true });

    // Button hover effects
    [createButton, joinButton, backButton].forEach(button => {
      button.on('pointerover', () => button.setStyle({ backgroundColor: '#666666' }));
      button.on('pointerout', () => button.setStyle({ backgroundColor: '#4a4a4a' }));
    });

    // Status text for displaying game codes and errors
    this.statusText = this.add.text(
      w/2,
      h * 0.65,
      '',
      {
        fontSize: Math.max(16, Math.round(w * 0.03)) + 'px',
        color: '#00ff00',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5);

    // Input field and submit button for game code (hidden by default)
    this.codeInput = document.createElement('input');
    this.codeInput.style.position = 'absolute';
    this.codeInput.style.left = '-1000px'; // Hide it initially
    this.codeInput.style.top = h * 0.65 + 'px';
    this.codeInput.style.width = '150px';
    this.codeInput.style.textAlign = 'center';
    this.codeInput.style.fontSize = '18px';
    this.codeInput.style.padding = '8px';
    this.codeInput.style.border = '2px solid #4a4a4a';
    this.codeInput.style.borderRadius = '4px';
    this.codeInput.style.backgroundColor = '#333';
    this.codeInput.style.color = '#fff';
    this.codeInput.maxLength = 6; // Limit to 6 characters
    document.body.appendChild(this.codeInput);
    
    // Submit button
    this.submitButton = this.add.text(
      w/2,
      h * 0.72,
      'Entrar',
      buttonStyle
    ).setOrigin(0.5);
    this.submitButton.setInteractive({ useHandCursor: true });
    this.submitButton.setVisible(false); // Hide initially
    
    // Button hover effects for submit button
    this.submitButton.on('pointerover', () => this.submitButton.setStyle({ backgroundColor: '#666666' }));
    this.submitButton.on('pointerout', () => this.submitButton.setStyle({ backgroundColor: '#4a4a4a' }));

    // Button click handlers
    createButton.on('pointerdown', () => {
      // Generate a random 6-character game code
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      this.statusText.setText('Código do jogo: ' + gameCode + '\nAguardando outro jogador...');
      this.statusText.setColor('#00ff00');
      
      // TODO: Connect to server and wait for another player
      this.connectAsHost(gameCode);
    });

    joinButton.on('pointerdown', () => {
      // Show input field and submit button
      this.codeInput.style.left = (w/2 - 75) + 'px';
      this.statusText.setText('Digite o código do jogo:');
      this.statusText.setColor('#ffffff');
      this.codeInput.value = '';
      this.submitButton.setVisible(true);
      this.codeInput.focus();

      // Handle code submission
      const handleCode = () => {
        const code = this.codeInput.value.toUpperCase();
        if (code.length === 6) {
          this.statusText.setText('Conectando...');
          this.statusText.setColor('#00ff00');
          this.codeInput.style.left = '-1000px'; // Hide input
          this.submitButton.setVisible(false); // Hide submit button
          
          this.connectAsClient(code);
        } else {
          this.statusText.setText('O código deve ter 6 caracteres');
          this.statusText.setColor('#ff0000');
        }
      };

      // Handle Enter key
      this.codeInput.onkeyup = (e) => {
        if (e.key === 'Enter') {
          handleCode();
        }
      };

      // Handle submit button click
      this.submitButton.on('pointerdown', handleCode);
    });

    backButton.on('pointerdown', () => {
      this.codeInput.remove(); // Clean up input element
      this.submitButton.setVisible(false); // Hide submit button
      this.scene.start('GameModeScene');
    });
  }

  connectAsHost(gameCode) {
    try {
      wsManager.setHost(true);
      this.ws = wsManager.connect();

      this.ws.onopen = () => {
        // Send create game request
        this.ws.send(JSON.stringify({
          type: 'create_game',
          character: 'player1' // Default character for now
        }));
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        switch (data.type) {
          case 'game_created':
            this.statusText.setText('Código do jogo: ' + data.roomCode + '\nAguardando outro jogador...');
            this.statusText.setColor('#00ff00');
            break;

          case 'player_joined':
            this.statusText.setText('Jogador encontrado!\nEscolha seu personagem...');
            // Start the game after a short delay
            this.time.delayedCall(1000, () => {
              this.scene.start('PlayerSelectScene', { 
                mode: 'online',
                isHost: true,
                roomCode: data.roomCode
              });
            });
            break;

          case 'error':
            this.statusText.setText('Erro: ' + data.message);
            this.statusText.setColor('#ff0000');
            break;
        }
      };

      this.ws.onerror = () => {
        this.statusText.setText('Erro: Não foi possível conectar ao servidor');
        this.statusText.setColor('#ff0000');
      };

    } catch (error) {
      this.statusText.setText('Erro: Não foi possível conectar ao servidor');
      this.statusText.setColor('#ff0000');
    }
  }

  connectAsClient(gameCode) {
    try {
      wsManager.setHost(false);
      this.ws = wsManager.connect();

      this.ws.onopen = () => {
        console.log('[OnlineModeScene] Sending join game request for room:', gameCode);
        // Send join game request
        wsManager.send({
          type: 'join_game',
          roomCode: gameCode.toUpperCase(), // Ensure room code is uppercase
          character: 'player2' // Default character for now
        });
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        switch (data.type) {
          case 'game_joined':
            this.statusText.setText('Conectado!\nEscolha seu personagem...');
            // Start the character selection scene
            this.time.delayedCall(1000, () => {
              this.scene.start('PlayerSelectScene', { 
                mode: 'online',
                isHost: false,
                roomCode: data.roomCode
              });
            });
            break;

          case 'error':
            this.statusText.setText('Erro: ' + data.message);
            this.statusText.setColor('#ff0000');
            break;
        }
      };

      this.ws.onerror = () => {
        this.statusText.setText('Erro: Não foi possível conectar ao servidor');
        this.statusText.setColor('#ff0000');
      };

    } catch (error) {
      this.statusText.setText('Erro: Não foi possível conectar ao servidor');
      this.statusText.setColor('#ff0000');
    }
  }

  shutdown() {
    // Clean up input element when scene is shut down
    if (this.codeInput) {
      this.codeInput.remove();
    }
  }
}

export default OnlineModeScene;
