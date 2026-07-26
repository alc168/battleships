# Bug & Issue History — Battleships Project

This document captures every significant bug, error, and usability issue encountered across the Battleships sessions, from the initial web app implementation through the DQN training/policy-extraction work and the current build.

**Timestamp notes:**
- Web app timestamps are taken from the local `git log` (`+1000` / AEST).
- DQN/Colab session timestamps are the session date from the history file metadata; exact per-message timestamps are not stored in the conversation export.

---

## Web App — Initial Build & Deployment Issues

### 2026-07-25 14:31:04 — Tailwind CSS not loading
- **Before:** Vite project scaffolded, styles were not being applied.
- **Bug:** Tailwind CSS directives were not included correctly, so the board and UI appeared unstyled.
- **Resolution:** Fixed the Tailwind CSS import/PostCSS configuration in `src/index.css` and `postcss.config.js`.

### 2026-07-25 14:31:04 — Vercel deployment failed
- **Before:** The user requested public hosting on Vercel.
- **Bug:** Vercel CLI authentication failed, blocking automated deployment.
- **Resolution:** Switched hosting target from Vercel to GitHub Pages and added `gh-pages` configuration.

### 2026-07-25 14:57:16 — Ships not placing on the grid
- **Before:** Player clicked the grid during placement, but ships did not appear.
- **Bug:** The radar sweep overlay was intercepting pointer events (`pointer-events` not set to `none`) and the ship cells were behind it due to `z-index` issues.
- **Resolution:** Set `pointer-events: none` and corrected `z-index` layering on the radar sweep so clicks reached the grid cells.

### 2026-07-25 15:01:00 — Radar sweep interfering with debugging
- **Before:** Ship placement still intermittent after the first z-index fix.
- **Bug:** The animated radar sweep was making it hard to diagnose whether placement or rendering was failing.
- **Resolution:** Temporarily removed the radar sweep and added debug logging to confirm the underlying state updates were correct.

### 2026-07-25 15:02:25 — GitHub Pages homepage URL mismatch
- **Before:** GitHub Pages build succeeded but assets failed to load.
- **Bug:** The `homepage` field in `package.json` was missing a trailing slash, causing relative asset paths to resolve incorrectly.
- **Resolution:** Updated `homepage` to include the trailing slash.

### 2026-07-25 15:06:29 — GitHub Pages updates not reflecting
- **Before:** New builds were pushed but the live site showed an older version.
- **Bug:** GitHub Pages cached the old `dist/` content; fresh deployments were not immediately visible.
- **Resolution:** Forced the `gh-pages` deployment with the `-f` flag to overwrite the published branch.

### 2026-07-25 17:19:56 — Version counter not updating between deployments
- **Before:** Hard to tell whether the latest deployed build was live because the version number was not visible.
- **Bug:** No visible build version on screen, so stale caches looked identical to new builds.
- **Resolution:** Added a visible `APP_VERSION` constant and displayed it in the header.

### 2026-07-25 17:23:37 — React keys causing grid re-render issues
- **Before:** Grid cells flickered or lost state during updates.
- **Bug:** Grid cells were using non-unique or unstable `key` props, causing React to reconcile incorrectly.
- **Resolution:** Improved React `key` generation for grid cells and ship status items.

### 2026-07-25 17:31:24 — `placeShipWithTracking is not defined`
- **Before:** User clicked a grid cell to place a ship and nothing happened.
- **Bug:** `ReferenceError: placeShipWithTracking is not defined` in `src/App.jsx` because the function was called without being imported.
- **Resolution:** Added the missing `placeShipWithTracking` import from `utils.js`.

---

## Web App — Hit, Sink, and AI Logic Issues

### 2026-07-25 20:55:10 — Sunk ship skulls appeared one turn late
- **Before:** The final missile that sank a ship rendered as a normal red hit.
- **Bug:** `checkSunkShips` was called with the old `playerMoves`/`computerMoves` array, before the latest hit had been added. React state batching meant the sunk detection happened on the next render.
- **Resolution:** Built the updated moves array first, then passed that array (including the latest hit) to `checkSunkShips` so skulls rendered immediately.

### 2026-07-25 20:55:10 — Last missile wrong colour on a sinking shot
- **Before:** The last hit that sank a ship was styled with the red `hit-cell` background.
- **Bug:** `getCellClass` applied the red hit style for any `move.hit` without first checking whether the cell belonged to a sunk ship.
- **Resolution:** Added `isCellOfSunkShip` helper and made `getCellClass` apply the dark `sunk-cell` style to sunk cells before falling back to `hit-cell`.

### 2026-07-25 21:05:54 — Computer AI fired randomly after hits
- **Before:** The computer was too easy to beat because it did not capitalise on hits.
- **Bug:** `handleComputerAttack` always chose a random coordinate, ignoring previous successful hits.
- **Resolution:** Added `computerHuntTargets` state and helpers (`getAdjacentCells`, `getHuntDirectionTargets`). After a hit the computer now targets adjacent cells, and after two aligned hits it continues along the ship's axis until the ship sinks.

### 2026-07-25 21:05:54 — No win/loss screen
- **Before:** When the game ended, only the status bar text changed.
- **Bug:** There was no clear end-of-game display.
- **Resolution:** Added a win/loss modal, later converted to a non-blocking top banner so the final boards remain visible.

### 2026-07-25 21:10:47 — Every grid square was glowing
- **Before:** The radar sweep caused all cells to pulse, cluttering the view.
- **Bug:** CSS targeted `.radar-grid > div:not(.radar-sweep)`, applying the glow to every cell.
- **Resolution:** Replaced broad CSS targeting with explicit `radar-glow` and `radar-glow-sunk` classes, applied only to hit/miss/skull cells on the enemy grid.

### 2026-07-25 21:21:04 — Victory modal hid the board
- **Before:** The end-of-game modal used a full-screen overlay.
- **Bug:** The overlay covered both grids, preventing the user from seeing the final state.
- **Resolution:** Replaced the full-screen modal with a compact fixed banner at the top of the screen.

### 2026-07-25 21:36:00 — No on-screen instructions
- **Before:** New users had no guidance on how to place ships or fire missiles.
- **Bug:** The UI provided no prompts for placement controls or attack controls.
- **Resolution:** Added placement prompt (`R to rotate — Enter to randomize`) and battle prompt (`Click any square to fire a missile`).

### 2026-07-25 21:42:23 — No keyboard shortcuts for placement
- **Before:** Users had to click the orientation button and had no quick random placement.
- **Bug:** Only mouse interaction was supported.
- **Resolution:** Added `keydown` listener: `R` rotates the current ship, `Enter` randomly places remaining ships and starts the game.

### 2026-07-25 21:48:48 — Unhit enemy ships stayed hidden on defeat
- **Before:** On a loss, only hits and misses were visible on the enemy grid.
- **Bug:** Surviving enemy ship cells continued to render as empty water after the game ended.
- **Resolution:** Updated `getCellClass` so that when `winner === 'computer'`, any enemy `CELL_STATES.SHIP` cell without a player move renders with `.enemy-ship-revealed` blue styling.

### 2026-07-25 22:08:33 — Mobile layout squeezed grids side-by-side
- **Before:** On narrow phone screens both grids were displayed horizontally.
- **Bug:** The `.game-area` used a single row layout, making grids unusably small on mobile.
- **Resolution:** Made `.game-area` `flex-col-reverse` on small screens (enemy grid first) and `flex-row` on larger screens. Added a `🎲 RANDOM` button for mobile users and a `useCallback` wrapper for the random-placement handler.

### 2026-07-25 22:08:33 — useEffect re-registered keyboard listener every render
- **Before:** The `R`/`Enter` listener was re-attached on every state update.
- **Bug:** `handleRandomPlacement` was recreated each render, causing the `useEffect` to add/remove the `keydown` listener repeatedly.
- **Resolution:** Wrapped `startGame` and `handleRandomPlacement` in `useCallback` with correct dependency arrays and imported `useCallback`.

---

## DQN / Policy Extraction Session — Colab & GitHub Issues

**Session date:** 2026-07-26 (timestamps below are approximate because the conversation export does not store per-message times).

### 2026-07-26 ~10:11 — `GITHUB_TOKEN` reported as not set in Colab
- **Before:** User had added `GITHUB_TOKEN` to Colab secrets.
- **Bug:** The script raised `RuntimeError: GITHUB_TOKEN is not set` because the secret had not been enabled for the current notebook (toggle switch off).
- **Resolution:** Advised the user to toggle the switch next to `GITHUB_TOKEN` in the Colab secrets panel, or to set the token via `os.environ` for quick testing.

### 2026-07-26 ~10:11 — `!python` shell could not read Colab secrets
- **Before:** A test cell could print the token, but `!python battleship_colab_runner.py` still failed.
- **Bug:** `!python` runs in a separate shell process where `google.colab.userdata` is not importable, so the script fell back to `os.environ` which was empty.
- **Resolution:** Advised running the script with `%run` in the same IPython kernel so `google.colab.userdata` was accessible, or exporting the token to the shell environment first.

### 2026-07-26 ~10:11 — GitHub API 403 when creating `battleship-rl` repo
- **Before:** `%run` worked, but the runner failed while setting up the GitHub repo.
- **Bug:** `POST /user/repos` returned `403 Resource not accessible by personal access token`; the token was either fine-grained (which cannot create repos) or missing the `repo`/`public_repo` scope.
- **Resolution:** Recommended creating the repository manually through the GitHub UI and rerunning, or regenerating the token with the correct `repo`/`public_repo` scope.

### 2026-07-26 ~10:11 — Git checkout failed with HTTP 404 (main/master not found)
- **Before:** Attempting to clone/checkout the `battleship-r` / `battleship-rl` repo.
- **Bug:** The repo existed but had no `main` or `master` branch, or the branch name in the script did not match the remote, causing `HTTP Error 404: Not Found`.
- **Resolution:** Updated the clone/checkout logic to handle the default branch dynamically or to create the initial branch if the repo was empty.

---

## Current Session — Documentation

### 2026-07-26 19:23:34 — BUGS_RESOLVED.md created
- **Before:** Bugs were scattered across commit messages and conversation summaries.
- **Bug:** No single reference document existed for the bugs resolved during development.
- **Resolution:** Created `BUGS_RESOLVED.md` (and this `BUGS_HISTORY.md`) summarising all issues, their before-states, and resolutions with timestamps.

---

## Version Roadmap

| Version | Timestamp (AEST) | Key fixes |
|---------|------------------|-----------|
| v1.0.7 | 2026-07-25 17:19:56 | Version counter, state batching |
| v1.0.8 | 2026-07-25 17:23:37 | React keys, debug logging |
| v1.0.9 | 2026-07-25 17:31:24 | Missing `placeShipWithTracking` import |
| v1.0.10 | 2026-07-25 20:55:10 | Sunk ship detection & skull rendering |
| v1.1.0 | 2026-07-25 21:05:54 | Smart AI, win screen, ship icons, radar |
| v1.1.1 | 2026-07-25 21:10:47 | Radar glow restricted to ships/skulls |
| v1.1.2 | 2026-07-25 21:15:17 | Enemy-waters-only glow |
| v1.1.3 | 2026-07-25 21:21:04 | Non-blocking victory banner |
| v1.1.4 | 2026-07-25 21:36:00 | On-screen instructions, README, lint |
| v1.1.5 | 2026-07-25 21:42:23 | Keyboard shortcuts for placement |
| v1.1.6 | 2026-07-25 21:48:48 | Reveal unhit enemy ships on defeat |
| v1.1.7 | 2026-07-25 22:08:33 | Mobile responsive layout & Random button |
