# KidsFight — Bug & Inconsistency Analysis

Analysis of the game codebase (~8,700 LOC). Findings are verified against the source and grouped by severity. Line numbers reference the current `main`-branch worktree.

---

## 🔴 CRITICAL

### 1. Remote attacks apply damage **twice** → guaranteed online desync
**`kidsfight_scene.ts:1962-1963` (attack), `1974-1975` (special)**

`handleRemoteAction` calls `tryAttack` twice per incoming action, "for test compatibility":
```ts
this.tryAttack(action.playerIndex, defenderIdx, timestamp, false);
this.tryAttack(action.playerIndex, attacker, defender, timestamp, false);
```
`tryAttack` (1655) resolves both signatures to the same players and subtracts `damage` from `playerHealth` **each call** (1715). A remote normal hit deals **10 instead of 5**, a special **20 instead of 10**, and special pips are consumed twice. The attacker's client applied single damage → health diverges permanently between host and guest.
**Fix:** Call `tryAttack` once; move signature coverage into tests, not production.

### 2. 13 methods are defined **twice** in the same class
**`kidsfight_scene.ts:2511-3010` duplicated verbatim at `3345-3844`**

`updatePlayerAnimation`, `updateWalkingAnimation`, `updateSharedWalkingAnimation`, `stopWalkingAnimation`, `createSpecialPips`, `handleJumpDown`, `handleAttack`, `handleBlock`, `handleSpecial`, `handleLeftDown/RightDown/LeftUp/RightUp` each appear twice (confirmed byte-identical). In a JS class the **second copy wins**; lines 2511-3010 are dead. `tsc` reports TS2393 for all of them. Recent commits touched `updatePlayerAnimation`/animation sync — a future edit to the dead copy will silently do nothing.
**Fix:** Delete the duplicate block (2511-3010 or 3345-3844).

### 3. `scenario3` is selectable but never loaded → broken battle background
**`scenario_select_scene.ts:27` vs `kidsfight_scene.ts:613-614`**

`SCENARIOS` lists 3 stages (`scenario1`, `scenario2`, `scenario3` "Ronivaldo Pinto"), and the selector cycles all three, but `kidsfight_scene.ts` only `load.image`s scenario1/scenario2. Picking the 3rd stage → `add.image(..., 'scenario3')` on a texture that was never loaded → Phaser missing-texture placeholder. CLAUDE.md also still says "2 battle scenarios."
**Fix:** Load `scenario3` in `kidsfight_scene.ts`, or remove it from `SCENARIOS`.

### 4. `connect()` opens the wrong URL
**`websocket_manager.ts:101-113`**

The method computes `wsUrl` (arg or `getWebSocketUrl()`) then ignores it: `this._ws = this._webSocketFactory(url!)`. Called with no arg (`kidsfight_scene.ts:994`) → `new WebSocket(undefined)`; called as `connect(this.roomCode)` (`:591`) → tries to open `new WebSocket("111111")`. It only "works" today because the singleton is already connected and `connect()` early-returns. Any rejoin / reload / dropped-socket path fails to reconnect.
**Fix:** Use `wsUrl`; stop passing `roomCode` into the URL slot; make the `roomCode` param actually set `_roomCode`.

---

## 🟠 HIGH

### 5. Online blocking is completely non-functional
**Sender `kidsfight_scene.ts:3667`; receiver `1939-1942`; touch `1529-1548`**

`handleBlock` sends `{ type: 'block', playerIndex: idx }` with **no `active` field**, but the receiver does `playerBlocking[idx] = action.active` (always `undefined`). There is no block-*release* message, and the touch block button updates local state but sends nothing. The opponent never learns you're blocking, so `tryAttack`'s damage-halving (1694) never triggers for a remote defender.
**Fix:** Send `active: true/false` on press/release; wire the touch handler to send; add a release path.

### 6. Keyboard players cannot attack, block, jump, or use specials
**`kidsfight_scene.ts:1139-1147` (keys created), handlers only called at `1364-1365`**

`attackKey`, `blockKey`, `keyW`, `keySpace` are created but never bound with `.on('down')` and never polled — `processKeyboardInput` only handles left/right. `handleAttack/Block/Special/JumpDown` are invoked only from touch buttons. Desktop players can walk but can't fight.
**Fix:** Poll the keys (or add `keydown` listeners) that call the corresponding handlers.

### 7. Two conflicting health-sync mechanisms per attack + a dead one
**`kidsfight_scene.ts:1719-1725` (dead) and `1805-1807` (live)**

Inside `tryAttack`, a health broadcast is guarded by `this.wsManager.sendMessage` — **a method that does not exist** on `WebSocketManager` (it has `send`, `sendHealthUpdate`, …). The guard is always falsy, so the block is dead. The real broadcast at 1805 uses `sendHealthUpdate`. Combined with peers recomputing damage locally (#1, #3-authority), there is no single authority for health. If someone "fixes" the guard to `send`, it double-broadcasts.
**Fix:** Remove the dead block; pick one authority model.

### 8. `gameUtils.tryAttack` is dead **and** encodes a different, obsolete combat model
**`gameUtils.ts:300-339`, imported unused at `kidsfight_scene.ts:14`**

The scene's `tryAttack` method shadows the imported function, which is never called. The orphan uses `damage = special ? 30 : 10` (vs 10/5), a `special < 100` 0-100 meter (vs the 0-3 pip model), no range check, and `attacker.special = 0`. Anyone reading it — or tests exercising it — sees wrong balance and a special threshold the pip system can never reach.
**Fix:** Delete the unused import and reconcile or remove `gameUtils.tryAttack`.

### 9. Inconsistent WS message shape depending on connect timing
**`websocket_manager.ts:121-143` (onopen wrapper) vs `299/310` (`onMessage`/`setMessageCallback`)**

Register a callback *before* open → you get `{ ...e, data: parsedObject }`. Register *after* open → you get the raw `MessageEvent` with an **unparsed JSON string**. `KidsFightScene` registers post-connect (raw string) while `OnlineModeScene` registers pre-connect (parsed object). Every consumer must defensively re-parse; a single overwritten `_onMessageCallback` slot is the fragility behind the historical "callback conflict / player selection sync failure."
**Fix:** One wrapper that always parses and delivers one shape; support multiple subscribers.

### 10. Resize handler duplicates all objects & leaks listeners (player select)
**`player_select_scene.ts:461-475` (`updateLayout`), wired at `:279`**

On every `resize`, `updateLayout` re-runs `setupCharacters()` + `createUIButtons()` without destroying prior objects. Each orientation change / mobile-chrome toggle stacks 9 more circles, 9 interactive sprites, 9 labels, and new buttons — old sprites keep their `pointerdown` listeners, so ghost hit-areas and stale "Ready" buttons remain clickable.
**Fix:** Reposition existing objects, or destroy before recreating (a container + `removeAll(true)`).

### 11. Local-mode "back" button starts a non-existent scene
**`scenario_select_scene.ts:483-486`**

A local-mode branch adds `backButton.on('pointerdown', () => this.scene.start('MainMenuScene'))`, but `MainMenuScene` is never registered. The primary handler already goes to `PlayerSelectScene`, so both fire, plus a duplicate `startGame` binding on the ready button.
**Fix:** Remove the dead local-mode block; the primary handlers cover it.

### 12. `updateReadyUI` is permanently dead — ready-state UI never updates
**`player_select_scene.ts:723-737`**

Guarded on `player1ReadyText`/`player2ReadyText`, which are **never assigned**. Every caller silently no-ops; it also conflicts stylistically with `updateReadyButton`.
**Fix:** Create the text objects, or delete `updateReadyUI` and route callers to `updateReadyButton`.

### 13. Online keyboard selection ignores direction
**`player_select_scene.ts:431-442`**

The online branch discards the `direction`-aware `newIndex` and recomputes `(index + 1) % len`, so left and right both advance forward — you can't move the selector backward online.
**Fix:** Use `(current + direction + len) % len` in the online branch too.

---

## 🟡 MEDIUM

### 14. No host authority; both peers simulate & both end the game
**`kidsfight_scene.ts:1628, 1962-1975, 1805-1815, 3187-3307`**

Each peer applies damage locally and reconciles via absolute `health_update`; `checkWinner`/`endGame` run independently on both. With #1's double-apply and per-side range/block differences, clients can transiently disagree on health and even the winner. Timer-based end (host-only `timerEvent`) sends no explicit `game_over` — a dropped `timer_update` at 0 can leave the guest never ending.
**Fix:** Make host authoritative for damage/health/timer/winner; broadcast an explicit game-over.

### 15. No reconnection / in-game disconnect handling
**`websocket_manager.ts:158-172`**

On close, `_ws` is nulled and all `send()` calls silently return false. No reconnect/backoff anywhere; `KidsFightScene` never registers a connection callback. A mid-match blip freezes the game with no error and no recovery.
**Fix:** Add reconnect/backoff and surface disconnect state to the active scene.

### 16. `createAttackEffect` is called but never defined
**`kidsfight_scene.ts:1792-1793`**

Regular (non-special) attacks do `else if (typeof this.createAttackEffect === 'function')` — but only `createSpecialAttackEffect` (2350) and `createHitEffect` (2232) exist. Guarded, so no crash, but **normal attacks show no attack visual effect**.
**Fix:** Implement `createAttackEffect` or reuse an existing effect.

### 17. Attack hit detection ignores facing & vertical distance
**`kidsfight_scene.ts:1697-1707`**

`inRange` is purely `Math.abs(attacker.x - defender.x)` (≤80 / ≤120). No facing check and no vertical bound — you can hit someone standing behind you, or on the upper platform far above, as long as X is close.
**Fix:** Add a facing check (sign of `defender.x - attacker.x` vs `flipX`) and a `|Δy|` bound.

### 18. `connect()` resets host flag; `setHost`/`setRoomCode` emit server-unknown messages
**`websocket_manager.ts:112, 80-88`**

`connect()` sets `_isHost = false` unconditionally — `connectAsHost()` sets host true then calls `connect()` which clears it. `setHost`/`setRoomCode` send `host_status`/`room_code` messages the server has no case for; they're blindly relayed to the peer as protocol noise on every scene transition.
**Fix:** Don't reset `_isHost` in `connect()`; stop broadcasting those types (or handle them server-side).

### 19. Special-attack cooldown declared but never enforced
**`kidsfight_scene.ts:206, 141, 1565-1648`**

`lastSpecialTime` / `SPECIAL_COOLDOWN` exist but `tryAction` never reads or writes them — specials are gated only by pips. The cooldown has no effect.
**Fix:** Enforce `now - lastSpecialTime[idx] >= SPECIAL_COOLDOWN` and update it.

### 20. Per-frame facing override defeats movement flip & desyncs online facing
**`kidsfight_scene.ts:2397-2411`**

Every `update()` overwrites `flipX` from relative X (players always face each other), running *after* `processKeyboardInput` set flip from movement — so movement flip is discarded, and the `position_update` sends the just-overwritten value while remote `'move'` sets flip from direction (1928). The two schemes disagree.
**Fix:** Pick one facing rule.

### 21. Combat constants declared but unused (tuning trap)
**`kidsfight_scene.ts:136-151, 190-191`**

`ATTACK_DAMAGE=5`, `SPECIAL_DAMAGE=10`, `SPECIAL_COOLDOWN`, `SPECIAL_REQUIRED`, `GOOD_TIMING_WINDOW`, `RHYTHM_BONUS_DAMAGE` are referenced only at declaration; real logic hardcodes `10 : 5` (1693), `< 3` (1594), `- 3`/`+ 1`. Editing the constants does nothing; the rhythm-bonus feature is unwired. (The stale backup file uses the constants correctly — the live file regressed.)
**Fix:** Use the constants; implement or delete the rhythm feature.

### 22. Guest re-send blacklists the real character "davir"
**`scenario_select_scene.ts:127`**

`this.selected.p2 !== 'davir'` treats Davi R (a real character, `CHARACTER_KEYS[1]`) as a sentinel, so a guest who genuinely picks Davi R has their selection skipped → roster desync.
**Fix:** Track "guest made a selection" with a boolean, not a key blacklist.

### 23. Legacy `player1`/`player2` fallback keys reference missing textures
**`scenario_select_scene.ts:610, 615-616`; `kidsfight_scene.ts:1024-1025`**

Fallbacks default to `'player1'`/`'player2'`, which are not loaded sprites → broken battle sprite if a fallback triggers. Three files use three different default strategies (`bento`/`roni` vs `player1/2` vs `bento`/`''`).
**Fix:** Centralize `DEFAULT_P1`/`DEFAULT_P2` = real character keys.

### 24. Duplicate/inconsistent resize & preview layout (scenario select)
**`scenario_select_scene.ts:215 & 359` (resize registered twice); `695` (`h/2 - 50`) vs `185` (`h/2`)**

`updateLayout` is registered twice but removed once in `shutdown`; the preview sits at a different Y after a resize than on first render (50px jump).
**Fix:** Register once; single source of truth for the preview Y.

### 25. Same fighter, two display names
**`kidsfight_scene.ts:968` (`D'Isa`) vs `player_select_scene.ts:327` (`D. Isa`)**

The battle HUD and selection screen show different names for `d_isa`.
**Fix:** One shared `CHARACTER_NAMES` map.

### 26. Jump velocity inconsistent across code paths
**`kidsfight_scene.ts:1513/3621` (`-330`) vs `1935` (`-500` local / `-330` online)**

Different jump heights depending on input path / mode.
**Fix:** Single jump-velocity constant.

---

## 🟢 LOW

- **27. Stray Node import in browser bundle** — `import { time } from 'console';` (`kidsfight_scene.ts:15`) and `const getCharacterName = 'getCharacterName';` (`:17`) are dead/wrong. Remove.
- **28. World + per-body gravity stack** — `main.ts:30` sets world gravity 200 ("lower gravity"), `kidsfight_scene.ts:1103` adds `setGravityY(300)` per body (arcade gravity is additive → ~500 effective), contradicting the comment. Confirm intent.
- **29. `isMoving` truthy without a body** — `player.body?.velocity?.x !== 0` is `undefined !== 0` = `true` for a body-less player (`2522/3356`). Use `(… ?? 0) !== 0`.
- **30. Stale `kidsfight_scene.backup.ts`** — a full 27 KB drifting copy of the scene, still compiled by `tsc` (not in `tsconfig` `exclude`), TS2393 duplicate-fn errors. Delete or exclude.
- **31. Dead/orphaned files** — `updateHealthBars.ts`, `gameUtils.cjs`, `gameUtils.mjs`, `fixed_scene_helper.ts`, `debug_popup.ts`, `boot_debug_scene.ts` (imported then commented out in `main.ts:19`) are referenced by nothing live.
- **32. Missing `rotate_icon` texture** — `rotate_prompt_scene.ts:33` adds an image never preloaded → blank icon on the mobile rotate prompt. `resize()` (`:38-46`) is also never wired.
- **33. Divergent duplicated types** — `MAX_HEALTH=100` redeclared in 3 files; `GameScene`/`GameObject` interfaces differ between `types.d.ts` (`player1?/player2?`) and `gameUtils.ts` (`players?: GameObject[]`). Loose `wsManager` typing (`types.d.ts:76-81` omits `sendMessage`/`sendHealthUpdate`) is exactly why #7/#8 slipped past `tsc`.
- **34. Sprite naming exception** — every sprite is `sprites-[name]3.png` except `sprites-d_isa.png` (no `3`), violating the documented convention.
- **35. Dead protocol branches** — `OnlineModeScene` handles `room_joined` (`:351-362`) which the server never sends; untracked duplicate `'message'` logging listener + unused `_currentCallbackId` in the manager.
- **36. `updateSceneLayout` null-deref risk** — `gameUtils.ts:147-159` reads `scene.players[0].health` guarded only by health-bar existence, not player existence; also reads sprite `.health` while the game tracks `playerHealth[]` (stale value risk).

---

## Notes on tooling
- `npm run type-check` currently **fails** — ~83 errors in source files (duplicate methods, missing `Phaser.GameObjects.Circle`, undefined-property access) plus many in tests. It isn't a clean gate today.
- TypeScript & deps weren't installed in the worktree; `npm install` was needed to run the checker.

## Suggested fix order
1. #1 double-damage, #2 duplicate methods, #4 connect URL — structural/correctness.
2. #3 scenario3, #5 online block, #6 keyboard combat — user-visible broken features.
3. #7/#8 dead-yet-divergent networking/combat code — traps for the next change.
4. Consolidate constants, defaults, names, and types (#21–#25, #33) to prevent recurrence.
