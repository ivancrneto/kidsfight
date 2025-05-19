"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
var globals_1 = require("./globals");
var WebSocketManager = /** @class */ (function () {
    function WebSocketManager(webSocketFactory) {
        this.ws = null;
        this.isHost = false;
        this._roomCode = null;
        this._onMessageCallback = null;
        this._onCloseCallback = null;
        this._onErrorCallback = null;
        this._debugInstanceId = Math.random().toString(36).substring(2, 10);
        console.log("[WSM-AGGRESSIVE] WebSocketManager constructor called [instance ".concat(this._debugInstanceId, "]"));
        if (WebSocketManager.instance) {
            console.log("[WSM-AGGRESSIVE] Returning existing instance [instance ".concat(WebSocketManager.instance._debugInstanceId, "]"));
            return WebSocketManager.instance;
        }
        WebSocketManager.instance = this;
        this.ws = null;
        this.isHost = false;
        this._roomCode = null;
        this._onMessageCallback = null;
        this._onCloseCallback = null;
        this._onErrorCallback = null;
        this._webSocketFactory = webSocketFactory || (function (url) { return new WebSocket(url); });
        console.log("[WSM-AGGRESSIVE] New instance created [instance ".concat(this._debugInstanceId, "]"));
    }
    WebSocketManager.prototype.connect = function () {
        var _this = this;
        console.log("[WSM-AGGRESSIVE] connect() called [instance ".concat(this._debugInstanceId, "]"));
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            if (globals_1.DEV)
                console.log('[WebSocketManager] Creating new connection');
            var wsUrl = void 0;
            // Get server from URL parameter if available (for easier testing)
            var urlParams = new URLSearchParams(window.location.search);
            var serverParam = urlParams.get('server');
            if (serverParam) {
                // Use server from URL parameter
                wsUrl = serverParam.startsWith('ws') ? serverParam : "ws://".concat(serverParam);
                console.log('[WebSocketManager] Using server from URL parameter:', wsUrl);
            }
            else {
                // Default server configuration
                wsUrl = globals_1.DEV
                    ? 'ws://localhost:8081'
                    : 'wss://kidsfight-ws.onrender.com';
                console.log('[WebSocketManager] Using default server:', wsUrl);
            }
            this.ws = this._webSocketFactory(wsUrl);
            console.log("[WSM-AGGRESSIVE] WebSocket created: ".concat(wsUrl, " [instance ").concat(this._debugInstanceId, "]"));
            this.ws.onopen = function () {
                console.log("[WSM-AGGRESSIVE] WebSocket connection opened [instance ".concat(_this._debugInstanceId, "]"));
                if (globals_1.DEV)
                    console.log('[WebSocketManager] Connection opened');
            };
            this.ws.onclose = function (event) {
                console.log("[WSM-AGGRESSIVE] WebSocket connection closed [instance ".concat(_this._debugInstanceId, "]"));
                if (globals_1.DEV)
                    console.log('[WebSocketManager] Connection closed');
                if (_this._onCloseCallback) {
                    _this._onCloseCallback(event);
                }
            };
            this.ws.onerror = function (error) {
                console.error('[WebSocketManager] WebSocket error:', error);
                if (_this._onErrorCallback) {
                    _this._onErrorCallback(error);
                }
            };
            this.ws.onmessage = function (event) {
                var _a, _b, _c;
                console.log('[WSM-DEBUG] onmessage handler called', event);
                try {
                    var data = JSON.parse(event.data);
                    // Enhanced debug logging for received messages
                    if (data.type === 'game_action') {
                        console.log('[WebSocketManager] Received game action:', {
                            actionType: (_a = data.action) === null || _a === void 0 ? void 0 : _a.type,
                            direction: (_c = (_b = data.action) === null || _b === void 0 ? void 0 : _b.direction) !== null && _c !== void 0 ? _c : null,
                            isHost: _this.isHost,
                            fullData: data
                        });
                    }
                    else if (data.type === 'replay_response') {
                        console.log('[WebSocketManager] Received replay response:', {
                            action: data.action,
                            accepted: data.accepted,
                            isHost: _this.isHost
                        });
                    }
                    // Do NOT log for replay_request
                }
                catch (error) {
                    console.error('[WebSocketManager] Error processing message:', error, 'This is not valid JSON');
                }
                if (_this._onMessageCallback) {
                    _this._onMessageCallback(event);
                }
            };
        }
    };
    WebSocketManager.prototype.disconnect = function () {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    };
    WebSocketManager.prototype.isConnected = function () {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    };
    WebSocketManager.prototype.send = function (message) {
        var _a, _b, _c, _d, _e;
        if (message.type === 'game_action') {
            console.log('[WebSocketManager] Sending game action:', {
                actionType: (_b = (_a = message.action) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : message.type,
                direction: (_d = (_c = message.action) === null || _c === void 0 ? void 0 : _c.direction) !== null && _d !== void 0 ? _d : null,
                isHost: this.isHost
            });
        }
        else if (message.type === 'replay_request') {
            console.log('[WebSocketManager] Sending replay request:', {
                action: message.action,
                roomCode: message.roomCode,
                isHost: this.isHost
            });
        }
        if (!this.isConnected()) {
            console.error('[WebSocketManager] Cannot send message: not connected');
            return false;
        }
        try {
            (_e = this.ws) === null || _e === void 0 ? void 0 : _e.send(JSON.stringify(message));
            return true;
        }
        catch (error) {
            console.error('[WebSocketManager] Error sending message:', error);
            return false;
        }
    };
    // Compatibility wrapper for enhanced tests
    WebSocketManager.prototype.sendGameAction = function (action) {
        // Log the action as required by the test
        console.log('[WebSocketManager] Sending game action:', action);
        var message = { type: 'game_action', action: action };
        if (!this.isConnected()) {
            console.error('[WebSocketManager] Cannot send game action - not connected');
            return false;
        }
        return this.send(message);
    };
    // Enhanced for replay request logging
    WebSocketManager.prototype.sendReplayRequest = function (request) {
        // Only log in send(), not here
        if (!this.isConnected()) {
            console.error('[WebSocketManager] Cannot send replay request - not connected');
            return false;
        }
        return this.send(request);
    };
    // Enhanced for replay response logging
    WebSocketManager.prototype.sendReplayResponse = function (response) {
        // Do NOT log here; only log on receiving replay_response in onmessage
        if (!this.isConnected()) {
            console.error('[WebSocketManager] Cannot send replay response - not connected');
            return false;
        }
        return this.send(response);
    };
    WebSocketManager.prototype.setRoomCode = function (code) {
        this._roomCode = code;
    };
    WebSocketManager.prototype.getRoomCode = function () {
        return this._roomCode;
    };
    WebSocketManager.prototype.setMessageCallback = function (callback) {
        this._onMessageCallback = callback;
    };
    WebSocketManager.prototype.setCloseCallback = function (callback) {
        this._onCloseCallback = callback;
    };
    WebSocketManager.prototype.setErrorCallback = function (callback) {
        this._onErrorCallback = callback;
    };
    WebSocketManager.prototype.sendHealthUpdate = function (playerIndex, health) {
        return this.send({
            type: 'health_update',
            data: {
                playerIndex: playerIndex,
                health: health
            }
        });
    };
    WebSocketManager.prototype.sendPositionUpdate = function (playerIndex, x, y, velocityX, velocityY, flipX, frame) {
        return this.send({
            type: 'player_update',
            data: {
                playerIndex: playerIndex,
                x: x,
                y: y,
                velocityX: velocityX,
                velocityY: velocityY,
                flipX: flipX,
                frame: frame
            }
        });
    };
    return WebSocketManager;
}());
exports.WebSocketManager = WebSocketManager;
// Aggressive log for singleton creation
console.log('[WSM-AGGRESSIVE] Creating WebSocketManager singleton instance (file load)');
var wsManager = new WebSocketManager();
exports.default = wsManager;
