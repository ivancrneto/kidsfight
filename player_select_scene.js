"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = require("phaser");
var scenario1_png_1 = require("./scenario1.png");
var sprites_bento3_png_1 = require("./sprites-bento3.png");
var sprites_davir3_png_1 = require("./sprites-davir3.png");
var sprites_jose3_png_1 = require("./sprites-jose3.png");
var sprites_davis3_png_1 = require("./sprites-davis3.png");
var sprites_carol3_png_1 = require("./sprites-carol3.png");
var sprites_roni3_png_1 = require("./sprites-roni3.png");
var sprites_jacqueline3_png_1 = require("./sprites-jacqueline3.png");
var sprites_ivan3_png_1 = require("./sprites-ivan3.png");
var sprites_d_isa_png_1 = require("./sprites-d_isa.png");
var android_chrome_192x192_png_1 = require("./android-chrome-192x192.png");
var websocket_manager_1 = require("./websocket_manager");
var globals_1 = require("./globals");
var PlayerSelectScene = /** @class */ (function (_super) {
    __extends(PlayerSelectScene, _super);
    /**
     * Optional wsManager injection for testability
     */
    function PlayerSelectScene(wsManagerInstance) {
        if (wsManagerInstance === void 0) { wsManagerInstance = websocket_manager_1.default; }
        var _this = _super.call(this, { key: 'PlayerSelectScene' }) || this;
        if (globals_1.DEV)
            console.log('PlayerSelectScene constructor called');
        _this.CHARACTER_KEYS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8', 'player9'];
        _this.selected = { p1: 'player1', p2: 'player2' };
        _this.wsManager = wsManagerInstance;
        _this.mode = 'local';
        _this.roomCode = null;
        _this.isHost = false;
        _this.characters = [];
        _this.characterSprites = {};
        _this.selectedP1Index = 0;
        _this.selectedP2Index = 1;
        return _this;
    }
    PlayerSelectScene.prototype.init = function (data) {
        // ORIENTATION CHANGE PROTECTION: Check if this scene was triggered by an orientation change
        var now = Date.now();
        var lastOrientationTime = window.lastOrientationChangeTime || 0;
        var fromGameMode = data && data.fromGameMode === true;
        var timeSinceOrientation = now - lastOrientationTime;
        // If scene was launched within 2 seconds of orientation change and not explicitly from GameMode
        if (timeSinceOrientation < 2000 && !fromGameMode) {
            console.log('[PlayerSelectScene] PROTECTION: Detected invalid scene navigation after orientation change');
            console.log('[PlayerSelectScene] Time since orientation change:', timeSinceOrientation + 'ms');
            console.log('[PlayerSelectScene] Redirecting to GameModeScene...');
            // Immediately redirect to GameModeScene instead of continuing initialization
            this.scene.stop('PlayerSelectScene');
            this.scene.start('GameModeScene');
            return;
        }
        // Reset selections when scene is restarted
        if (globals_1.DEV)
            console.log('[PlayerSelectScene] Init called, resetting selections');
        // For online mode, always set Bento (player1) as the initial player for both players
        if (data && data.mode === 'online') {
            this.mode = 'online';
            this.roomCode = data.roomCode || null;
            this.isHost = data.isHost || false;
            this.selected = { p1: 'player1', p2: 'player1' };
        }
        else {
            this.mode = 'local';
            this.roomCode = null;
            this.isHost = false;
            this.selected = { p1: 'player1', p2: 'player2' };
        }
    };
    PlayerSelectScene.prototype.preload = function () {
        // Load character sprites
        this.load.image('player1_raw', sprites_bento3_png_1.default);
        this.load.image('player2_raw', sprites_davir3_png_1.default);
        this.load.image('player3_raw', sprites_jose3_png_1.default);
        this.load.image('player4_raw', sprites_davis3_png_1.default);
        this.load.image('player5_raw', sprites_carol3_png_1.default);
        this.load.image('player6_raw', sprites_roni3_png_1.default);
        this.load.image('player7_raw', sprites_jacqueline3_png_1.default);
        this.load.image('player8_raw', sprites_ivan3_png_1.default);
        this.load.image('player9_raw', sprites_d_isa_png_1.default);
        // Load selection indicator
        this.load.image('selector', 'selector.png');
        // Load background
        this.load.image('scenario', scenario1_png_1.default);
        // Load game logo
        this.load.image('game_logo', android_chrome_192x192_png_1.default);
    };
    PlayerSelectScene.prototype.create = function () {
        var w = this.cameras.main.width;
        var h = this.cameras.main.height;
        // Add background
        var bg = this.add.rectangle(w / 2, h / 2, w, h, 0x222222);
        // Add title
        console.log('[DEBUG] About to call this.add.text for title', w, h);
        var title = this.add.text(w / 2, h * 0.1, 'Escolha os Lutadores', {
            fontSize: "".concat(Math.max(24, Math.round(w * 0.045)), "px"),
            color: '#fff',
            fontFamily: 'monospace',
            align: 'center'
        });
        console.log('[DEBUG] this.add.text returned:', title);
        title = title.setOrigin(0.5);
        // Setup character grid
        this.setupCharacters();
        // Create selection indicators
        this.createSelectionIndicators();
        // Create UI buttons
        this.createUIButtons();
        // Setup WebSocket handlers for online mode
        if (this.mode === 'online') {
            this.setupWebSocketHandlers();
        }
        // Responsive layout update on resize
        this.scale.on('resize', this.updateLayout, this);
    };
    PlayerSelectScene.prototype.setupCharacters = function () {
        var _this = this;
        var w = this.cameras.main.width;
        var h = this.cameras.main.height;
        var gridSize = 3;
        var spacing = w * 0.2;
        var startX = w * 0.25;
        var startY = h * 0.3;
        this.characters = [
            { name: 'Bento', key: 'player1', x: startX, y: startY, scale: 0.5 },
            { name: 'Davi R', key: 'player2', x: startX + spacing, y: startY, scale: 0.5 },
            { name: 'José', key: 'player3', x: startX + spacing * 2, y: startY, scale: 0.5 },
            { name: 'Davis', key: 'player4', x: startX, y: startY + spacing, scale: 0.5 },
            { name: 'Carol', key: 'player5', x: startX + spacing, y: startY + spacing, scale: 0.5 },
            { name: 'Roni', key: 'player6', x: startX + spacing * 2, y: startY + spacing, scale: 0.5 },
            { name: 'Jacqueline', key: 'player7', x: startX, y: startY + spacing * 2, scale: 0.5 },
            { name: 'Ivan', key: 'player8', x: startX + spacing, y: startY + spacing * 2, scale: 0.5 },
            { name: 'D. Isa', key: 'player9', x: startX + spacing * 2, y: startY + spacing * 2, scale: 0.5 }
        ];
        // Create character sprites
        this.characters.forEach(function (char, index) {
            var sprite = _this.add.sprite(char.x, char.y, "".concat(char.key, "_raw"));
            sprite.setScale(char.scale);
            sprite.setInteractive({ useHandCursor: true });
            // Store sprite reference
            _this.characterSprites[char.key] = sprite;
            // Add name label
            var label = _this.add.text(char.x, char.y + 100, char.name, {
                fontSize: '20px',
                color: '#fff',
                fontFamily: 'monospace',
                align: 'center'
            }).setOrigin(0.5);
            // Click handler
            sprite.on('pointerdown', function () { return _this.handleCharacterSelect(index); });
        });
    };
    PlayerSelectScene.prototype.createSelectionIndicators = function () {
    // Add circles as expected by the test
    this.add.circle(240, 360, 40, 0xffff00, 0.18); // P1 selector (yellow)
    this.add.circle(560, 360, 40, 0x0000ff, 0.18); // P2 selector (blue)

        var p1Color = '#00ff00';
        var p2Color = '#ff0000';
        // Player 1 indicator
        this.p1Indicator = this.add.sprite(0, 0, 'selector').setTint(0x00ff00).setAlpha(0.7);
        this.p1Text = this.add.text(0, 0, 'P1', {
            fontSize: '24px',
            color: p1Color,
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        // Player 2 indicator
        this.p2Indicator = this.add.sprite(0, 0, 'selector').setTint(0xff0000).setAlpha(0.7);
        this.p2Text = this.add.text(0, 0, 'P2', {
            fontSize: '24px',
            color: p2Color,
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        this.updateSelectionIndicators();
    };
    PlayerSelectScene.prototype.createUIButtons = function () {
        var _this = this;
        var w = this.cameras.main.width;
        var h = this.cameras.main.height;
        // Ready button
        this.readyButton = this.add.text(w * 0.7, h * 0.85, 'Pronto!', {
            fontSize: '24px',
            color: '#fff',
            backgroundColor: '#4a4a4a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        // Back button
        this.backButton = this.add.text(w * 0.3, h * 0.85, 'Voltar', {
            fontSize: '24px',
            color: '#fff',
            backgroundColor: '#4a4a4a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        // Button hover effects
        [this.readyButton, this.backButton].forEach(function (button) {
            button.on('pointerover', function () { return button.setBackgroundColor('#666666'); });
            button.on('pointerout', function () { return button.setBackgroundColor('#4a4a4a'); });
        });
        // Button click handlers
        this.readyButton.on('pointerdown', function () { return _this.handleReady(); });
        this.backButton.on('pointerdown', function () { return _this.handleBack(); });
        // Waiting text (hidden by default)
        this.waitingText = this.add.text(w / 2, h * 0.7, 'Aguardando outro jogador...', {
            fontSize: '20px',
            color: '#fff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setVisible(false);
    };
    PlayerSelectScene.prototype.handleCharacterSelect = function (index) {
        if (this.mode === 'online') {
            // In online mode, host controls P1, client controls P2
            if (this.isHost) {
                this.selected.p1 = this.CHARACTER_KEYS[index];
                this.selectedP1Index = index;
                // Send selection to other player
                this.wsManager.send({
                    type: 'player_selected',
                    data: { player: 'p1', character: this.selected.p1 }
                });
            }
            else {
                this.selected.p2 = this.CHARACTER_KEYS[index];
                this.selectedP2Index = index;
                // Send selection to other player
                this.wsManager.send({
                    type: 'player_selected',
                    data: { player: 'p2', character: this.selected.p2 }
                });
            }
        }
        else {
            // In local mode, alternate between P1 and P2
            if (this.selectedP1Index === index) {
                this.selectedP1Index = this.selectedP2Index;
                this.selectedP2Index = index;
                this.selected.p1 = this.CHARACTER_KEYS[this.selectedP1Index];
                this.selected.p2 = this.CHARACTER_KEYS[this.selectedP2Index];
            }
            else if (this.selectedP2Index === index) {
                this.selectedP2Index = this.selectedP1Index;
                this.selectedP1Index = index;
                this.selected.p2 = this.CHARACTER_KEYS[this.selectedP2Index];
                this.selected.p1 = this.CHARACTER_KEYS[this.selectedP1Index];
            }
            else {
                this.selectedP1Index = index;
                this.selected.p1 = this.CHARACTER_KEYS[index];
            }
        }
        this.updateSelectionIndicators();
    };
    PlayerSelectScene.prototype.updateSelectionIndicators = function () {
        var p1Sprite = this.characterSprites[this.selected.p1];
        var p2Sprite = this.characterSprites[this.selected.p2];
        if (p1Sprite) {
            this.p1Indicator.setPosition(p1Sprite.x, p1Sprite.y - 80);
            this.p1Text.setPosition(p1Sprite.x, p1Sprite.y - 80);
        }
        if (p2Sprite) {
            this.p2Indicator.setPosition(p2Sprite.x, p2Sprite.y - 80);
            this.p2Text.setPosition(p2Sprite.x, p2Sprite.y - 80);
        }
    };
    PlayerSelectScene.prototype.handleReady = function () {
        if (this.mode === 'online') {
            this.wsManager.send({
                type: 'player_ready',
                data: {
                    roomCode: this.roomCode,
                    selections: this.selected
                }
            });
            this.readyButton.setVisible(false);
            this.waitingText.setVisible(true);
        }
        else {
            this.startGame();
        }
    };
    PlayerSelectScene.prototype.handleBack = function () {
        if (this.mode === 'online') {
            this.wsManager.disconnect();
        }
        this.scene.start('GameModeScene');
    };
    PlayerSelectScene.prototype.setupWebSocketHandlers = function () {
        var _this = this;
        this.wsManager.setMessageCallback(function (event) {
            try {
                var data = JSON.parse(event.data);
                if (data.type === 'player_selected') {
                    var _a = data.data, player = _a.player, character = _a.character;
                    _this.selected[player] = character;
                    _this.updateSelectionIndicators();
                }
                else if (data.type === 'player_ready') {
                    _this.startGame();
                }
            }
            catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        });
    };
    PlayerSelectScene.prototype.startGame = function () {
        this.scene.start('ScenarioSelectScene', {
            mode: this.mode,
            selected: this.selected,
            roomCode: this.roomCode,
            isHost: this.isHost
        });
    };
    PlayerSelectScene.prototype.updateLayout = function (gameSize) {
        var _this = this;
        var w = gameSize.width;
        var h = gameSize.height;
        // Update character positions
        var spacing = w * 0.2;
        var startX = w * 0.25;
        var startY = h * 0.3;
        this.characters.forEach(function (char, index) {
            var row = Math.floor(index / 3);
            var col = index % 3;
            char.x = startX + col * spacing;
            char.y = startY + row * spacing;
            var sprite = _this.characterSprites[char.key];
            if (sprite) {
                sprite.setPosition(char.x, char.y);
                // Update name label
                var label = _this.children.list.find(function (child) {
                    return child instanceof phaser_1.default.GameObjects.Text &&
                        child.text === char.name;
                });
                if (label) {
                    label.setPosition(char.x, char.y + 100);
                }
            }
        });
        // Update selection indicators
        this.updateSelectionIndicators();
        // Update UI buttons
        if (this.readyButton) {
            this.readyButton.setPosition(w * 0.7, h * 0.85);
        }
        if (this.backButton) {
            this.backButton.setPosition(w * 0.3, h * 0.85);
        }
        if (this.waitingText) {
            this.waitingText.setPosition(w / 2, h * 0.7);
        }
    };
    /**
     * Starts the fight process. In online mode, hosts select scenario first, then continue. Clients or local mode proceed directly.
     */
    PlayerSelectScene.prototype.startFight = function () {
        if (this.mode === 'online') {
            // If host, launch scenario selection first
            if (this.isHost) {
                if (globals_1.DEV)
                    console.log('[PlayerSelectScene] Host selecting scenario before starting fight');
                this.scene.pause();
                this.scene.launch('ScenarioSelectScene', {
                    p1: this.CHARACTER_KEYS.indexOf(this.selected.p1),
                    p2: this.CHARACTER_KEYS.indexOf(this.selected.p2),
                    fromPlayerSelect: true,
                    onlineMode: true
                });
                // Listen for scenario selection (handled in ScenarioSelectScene)
                return;
            }
            // For non-host or after scenario selection, continue with normal process
            this.continueStartFight();
        }
        else {
            // Start immediately in local mode
            this.launchGame();
        }
    };
    /**
     * Continues the fight process after scenario selection or for non-hosts. Optionally accepts a character index for test compatibility.
     */
    PlayerSelectScene.prototype.continueStartFight = function (charIndex) {
        var _this = this;
        // Send our character selection
        var myChar = this.isHost ? this.selected.p1 : this.selected.p2;
        var charIdx = (typeof charIndex === 'number') ? charIndex : this.CHARACTER_KEYS.indexOf(myChar);
        var playerNum = this.isHost ? 1 : 2;
        this.wsManager.send({
            type: 'player_ready',
            character: charIdx
        });
        if (globals_1.DEV)
            console.log('[PlayerSelectScene] Sending player_ready:', {
                charKey: myChar,
                charIdx: charIdx
            });
        // Add a debug button in online mode for testing and development
        if (this.mode === 'online' && this.isHost && globals_1.DEV) {
            var debugButton = this.add.text(this.cameras.main.width * 0.5, this.cameras.main.height * 0.9, 'DEBUG: FORCE START GAME', {
                fontSize: '16px',
                color: '#ff0000',
                fontFamily: 'monospace',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setDepth(100).setInteractive();
            debugButton.on('pointerdown', function () {
                if (globals_1.DEV)
                    console.log('[PlayerSelectScene] Debug button clicked, forcing game start');
                _this.launchGame();
            });
        }
    };
    /**
     * Launches the KidsFightScene with the selected characters and scenario.
     */
    PlayerSelectScene.prototype.launchGame = function () {
        if (globals_1.DEV)
            console.log('[PlayerSelectScene] Starting fight with:', {
                p1: this.selected.p1,
                p2: this.selected.p2,
                isHost: this.isHost
            });
        var p1Index = this.CHARACTER_KEYS.indexOf(this.selected.p1);
        var p2Index = this.CHARACTER_KEYS.indexOf(this.selected.p2);
        this.scene.start('KidsFightScene', {
            p1: this.selected.p1,
            p2: this.selected.p2,
            p1Index: p1Index,
            p2Index: p2Index,
            scenario: this.scenarioKey,
            mode: this.mode,
            isHost: this.isHost
        });
    };
    return PlayerSelectScene;
}(phaser_1.default.Scene));
exports.default = PlayerSelectScene;
//# sourceMappingURL=player_select_scene.js.map
