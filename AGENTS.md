# AGENTS.md

> `CLAUDE.md` is a symlink to this file. Editing `AGENTS.md` updates both.

Shared guidance for coding agents working in this repository. An optional,
gitignored `AGENTS.local.md` holds per-developer overrides and is imported
below; it is simply absent for anyone who has not created one.

@AGENTS.local.md

## Hard Rules (Non-Negotiable)

If a task appears to require breaking one of these, stop and ask the human first.

- **Never push to `main`.** No `git push` to `main`, including `--force`. Work on
  a feature branch; changes land via a reviewed pull request. Force-pushing a
  feature branch (prefer `--force-with-lease`) is fine.
- **Never leave a process you started running.** Dev server (`npm start`,
  Parcel, port 8081), WebSocket server (`cd server && npm start`), watch-mode
  test runners, one-off `node` scripts: if you started it, stop it before you
  finish. Prefer one-shot commands; run tests non-watch (`npm test`, never
  `jest --watch`). Check first with `lsof -ti :8081` and reuse what is already
  up. End the task by confirming nothing you started still holds a port.
- **New env vars / settings must fan out to every consumer.** When adding or
  renaming an env var, check `.env.development`, `netlify.toml`, the server, and
  `.github/workflows/ci.yml`, and list each file touched in the PR description.

## Code Style

- **No unnecessary comments.** Let names and types carry the meaning. Comment
  only the non-obvious _why_ (workaround, invariant, trade-off), in one terse
  line.
- **Never commit secrets** or real credentials / `.env` values.
- **Reuse before adding.** After writing a helper, `rg` for existing code that
  does the same thing (`gameUtils.ts`, `test_helpers/`) and consolidate.
- **Unique test fixtures.** Do not share mutable state, room codes, or player
  objects across tests; build fresh ones per test (`__tests__/createMockPlayer.ts`).

## Testing Policy

- **Write the failing test before the code**, including for new branches and edge
  cases in existing code. Never write a test after the fact to fit finished code.
- **Prefer tests that exercise real behavior** (scene flows, WebSocket message
  handling against the server) over tests of isolated internals. Use isolated
  Jest tests for logic that cannot be reached otherwise: combat/damage math,
  message validation, state sync.
- Do not write tests for render-without-crash, constants, defaults, or mocks
  returning what they were told to return. Delete them when you find them.

## Commit and PR Guidance

- Keep commits atomic, focused, and descriptive.
- Before every push, run the CI gate locally and let it pass:
  `yarn lint`, `yarn type-check`, `yarn test` (CI runs these in
  `.github/workflows/ci.yml`; lint and type-check currently report pre-existing
  issues, so do not add new ones).
- **No agent attribution.** No `Co-Authored-By:` trailer and no "Generated with
  ..." line for Claude or any other AI tool in commits or PR descriptions.
- **Never commit screenshots or PR media.** Save them outside the git tree and
  share the path so the human attaches them to the PR.
- Include generated files alongside the changes that require them.

## AI Assistant Guidance

- **Change only what the task requires, and finish it.** Match neighboring
  patterns; leave unrelated cleanups for their own PR.
- Validate assumptions against this repo's `package.json` and CI config, not
  other repositories' conventions.
- **Subagent model selection.** Pick the smallest model that can do the job; when
  in doubt between two tiers, pick the lower one.
  - **Haiku:** lookups, grep/find, running a command and reporting output,
    mechanical edits with clear instructions.
  - **Sonnet:** multi-file edits with settled design, writing tests for an
    understood module, bounded code review, drafting PR descriptions.
  - **Opus:** architecture decisions, non-trivial planning, debugging with an
    unclear cause, cross-subsystem refactors, security review across trust
    boundaries.

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
- `npm run lint` / `npm run lint:fix` - Run oxlint (optionally auto-fixing)

### Testing
- `npm test` - Run all tests using Jest (non-watch)
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