# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KidsFight is a cartoon-style multiplayer fighting game built with Phaser.js and TypeScript. The game features:
- Local and online multiplayer modes
- 9 playable characters with unique sprite animations
- 2 battle scenarios with different backgrounds
- Touch controls for mobile devices
- WebSocket-based multiplayer functionality

## Development Commands

### Build and Run
- `npm start` - Start development server with Parcel (runs on http://localhost:8081)
- `npm run build` - Build production version
- `npm run type-check` - Run TypeScript type checking without emitting files

### Testing
- `npm test` - Run all tests using Jest
- Test files are located in `__tests__/` directory
- Uses Jest with TypeScript support and Phaser mocks

### Server (Online Mode)
- Server code is in `server/` directory
- `cd server && npm start` - Start WebSocket server for online multiplayer
- Production server runs on `wss://kidsfight-ws.onrender.com`

## Architecture

### Core Game Structure
The game follows a multi-scene architecture using Phaser.js:

1. **Main Entry Point** (`main.ts`):
   - Configures Phaser game with 800x600 resolution
   - Registers all game scenes
   - Sets up arcade physics with gravity: 200

2. **Scene Flow**:
   - `RotatePromptScene` - Mobile orientation prompt
   - `GameModeScene` - Local vs Online mode selection
   - `PlayerSelectScene` - Character selection (local mode)
   - `ScenarioSelectScene` - Background/stage selection
   - `KidsFightScene` - Main game battle scene
   - `OnlineModeScene` - Online multiplayer setup

3. **Key Components**:
   - `kidsfight_scene.ts` - Main game logic, player controls, combat system
   - `websocket_manager.ts` - Singleton WebSocket manager for online multiplayer
   - `gameUtils.ts` - Shared game utilities and attack logic
   - `player_select_scene.ts` - Character selection UI and logic
   - `scenario_select_scene.ts` - Stage selection with background previews

### Data Management
- **Character Data**: 9 characters with sprite assets (sprites-[name]3.png)
- **Scenarios**: 2 battle backgrounds (scenario1.png, scenario2.png)
- **Game State**: Player health, special meters, positions synchronized via WebSocket
- **WebSocket Protocol**: JSON messages for game actions, health updates, position sync

### Testing Strategy
- Comprehensive Jest test suite covering all major components
- Phaser mocks for headless testing
- Integration tests for WebSocket functionality
- Visual regression tests for UI components
- Test utilities in `__tests__/test-utils.ts` and `__tests__/createMockPlayer.ts`

## Key Files to Understand

- `kidsfight_scene.ts` - Core game battle logic, player physics, combat system
- `websocket_manager.ts` - Online multiplayer networking (singleton pattern)
- `player_select_scene.ts` - Character selection with touch/keyboard controls
- `gameUtils.ts` - Attack calculations, game state utilities
- `main.ts` - Phaser configuration and scene registration

## Development Notes

### TypeScript Configuration
- Uses ES modules with ESNext target
- Strict mode enabled
- Custom type definitions in `src/types/`
- Jest configured with TypeScript support

### Asset Management
- Images imported directly in TypeScript files
- Parcel handles asset bundling and optimization
- Sprite sheets for character animations
- Background images for battle scenarios

### Mobile Support
- Responsive layout with touch controls
- Orientation detection and prompts
- Optimized for mobile browsers
- Touch-friendly UI elements

### Online Multiplayer
- WebSocket-based real-time communication
- Room-based matchmaking with codes
- Host/guest architecture
- Action validation and replay system
- Health and position synchronization