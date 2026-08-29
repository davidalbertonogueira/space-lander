# Rocket Lander

A dependency-free, browser-based HTML5 homage to IBM's 1982 *Rocket Lander*. It uses original procedural canvas artwork, simulation code, and Web Audio effects—no original IBM code or assets.

## Run

Open `index.html` directly, or serve this folder with any static server, for example `python3 -m http.server 8080`, then visit `http://localhost:8080`.

## Controls

- Left/Right arrows or A/D: rotate
- Up, W, or Space: main thrust
- P or Escape: pause
- M: mute; R: restart a completed round
- Mobile: hold the on-screen rotate and thrust controls together as needed.

Land with **both legs** on the amber pad, angle under 12°, horizontal speed under 2.4, and descent under 3.4. Points carry across rounds; 100 points starts Advanced Mode, with rougher terrain, a narrower pad, and less fuel. High score and mute preference are kept in local storage. Each round's displayed seed deterministically defines its terrain.

## Structure

- `index.html` — semantic shell, menu, telemetry, and touch controls
- `styles.css` — responsive IBM-PC-inspired visual treatment
- `src/game.js` — state machine, rendering, effects, and UI
- `src/physics.js` — timestep-independent flight and landing validation
- `src/terrain.js` — seeded terrain generation
- `src/audio.js` — tiny Web Audio synthesizer
- `tests/physics.test.mjs` — deterministic terrain and landing-rule checks
- `tests/startup.test.mjs` — headless Start Mission flow smoke test

Run the lightweight checks with `node tests/physics.test.mjs && node tests/startup.test.mjs`.
