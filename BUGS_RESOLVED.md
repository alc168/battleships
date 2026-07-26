# Bugs Resolved — Battleships Session

This document summarises the bugs and usability issues resolved during the session, starting from the v1.0.9 state where ship placement had just been fixed.

---

## 1. Missing `placeShipWithTracking` Import

- **Version:** v1.0.9
- **Before state:** Ship placement appeared to do nothing. The browser console reported `ReferenceError: placeShipWithTracking is not defined`.
- **Root cause:** `App.jsx` called `placeShipWithTracking` without importing it from `utils.js`.
- **Resolution:** Added the missing import for `placeShipWithTracking` in `src/App.jsx`.

---

## 2. Sunk Ship Skulls Appeared One Turn Late

- **Version:** v1.0.10
- **Before state:** When the final missile that sank a ship was fired, the hit showed as a normal red hit. The skull icons only appeared on the following turn.
- **Root cause:** `handlePlayerAttack` and `handleComputerAttack` called `checkSunkShips` using the old `playerMoves` / `computerMoves` array, which did not yet include the latest hit because React state updates are batched.
- **Resolution:** Created the updated moves array first, then passed that updated array to `checkSunkShips` so the ship was detected as sunk immediately.

---

## 3. Last Missile Wrong Colour When Sinking a Ship

- **Version:** v1.0.10
- **Before state:** The final hit that sank a ship was sometimes rendered with a red `hit-cell` background instead of the dark sunk styling.
- **Root cause:** `getCellClass` always applied the red `hit-cell` class for any `move.hit`, without checking whether the cell belonged to a newly sunk ship.
- **Resolution:** Added an `isCellOfSunkShip` helper and updated `getCellClass` to apply the `sunk-cell` style to cells of sunk ships before falling back to the regular `hit-cell` style.

---

## 4. Computer AI Did Not Hunt Ships After a Hit

- **Version:** v1.1.0
- **Before state:** The computer opponent fired at completely random squares even after hitting a ship, making it too easy to beat.
- **Root cause:** `handleComputerAttack` always picked a random coordinate and ignored previous hits.
- **Resolution:** Added `computerHuntTargets` state and helper functions (`getAdjacentCells`, `getHuntDirectionTargets`). After a hit, the computer now tries adjacent cells, and when two aligned hits are found it continues along the detected ship axis until the ship sinks.

---

## 5. No Win/Loss Screen

- **Version:** v1.1.0 (layout improved in v1.1.3)
- **Before state:** When the game ended, the status bar only changed text. There was no clear indication of victory or defeat.
- **Resolution:** Added a full-screen win/loss modal. Later refined it into a non-blocking top banner so the final board state remains visible behind the message.

---

## 6. All Grid Squares Glowing with Radar Effect

- **Version:** v1.1.1 → v1.1.3
- **Before state:** The radar sweep caused every square on both grids to pulse, making the board look cluttered and hiding which cells were important.
- **Root cause:** CSS targeted `.radar-grid > div:not(.radar-sweep)`, applying the glow animation to every cell.
- **Resolution:** Restricted glow to specific classes added by `getCellClass`. The radar sweep itself was limited to the enemy-waters grid, and glow was applied only to enemy hit/miss/skull cells. Friendly ships and empty water no longer glow.

---

## 7. Victory Modal Hid the Board

- **Version:** v1.1.3
- **Before state:** The win/loss modal used a full-screen `fixed inset-0` overlay, completely covering the game boards at the end.
- **Resolution:** Replaced the full-screen modal with a compact fixed banner near the top of the screen, keeping both grids fully visible.

---

## 8. No On-Screen Instructions

- **Version:** v1.1.4 (battle) and v1.1.5 (placement)
- **Before state:** New users had no guidance on how to place ships or how to fire missiles.
- **Resolution:** Added a placement instruction banner (`Place ships in Friendly Waters — R to rotate — Enter to randomize`) and a battle prompt (`Click any square to fire a missile`) that appears at the start of each phase.

---

## 9. No Keyboard Shortcuts for Placement

- **Version:** v1.1.5
- **Before state:** Players could only rotate ships and randomise placement by clicking buttons; no keyboard support existed.
- **Resolution:** Added a `keydown` event listener: `R` toggles orientation, `Enter` randomly places all remaining ships and starts the game.

---

## 10. Unhit Enemy Ships Not Revealed on Defeat

- **Version:** v1.1.6
- **Before state:** On a loss, the enemy grid only showed the player's hits and misses. Surviving enemy ships remained hidden.
- **Resolution:** Updated `getCellClass` so that when `winner === 'computer'`, any enemy `CELL_STATES.SHIP` cell without a player move is rendered with the new `.enemy-ship-revealed` blue styling.

---

## 11. Mobile Layout Displayed Grids Side-by-Side

- **Version:** v1.1.7
- **Before state:** On narrow phone screens, the Friendly Waters and Enemy Waters grids were squeezed side-by-side, making them hard to use.
- **Resolution:** Changed `.game-area` to `flex-col-reverse` on mobile (so Enemy Waters appears first) and `flex-row` on larger screens. Added vertical scrolling for the game area on small devices.

---

## 12. No Random Placement Button on Mobile

- **Version:** v1.1.7
- **Before state:** Mobile users without a hardware keyboard could not use the Enter-key random placement feature.
- **Resolution:** Extracted the random-placement logic into a memoized `handleRandomPlacement` function and added a `🎲 RANDOM` button next to the `HORIZ` / `VERT` button during the placement phase.
