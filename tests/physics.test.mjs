import assert from 'node:assert/strict';
import { makeTerrain, groundAt } from '../src/terrain.js';
import { CFG, legs, landingResult, step, terrainCollision } from '../src/physics.js';

const terrain = makeTerrain(1982);
assert.deepEqual(terrain, makeTerrain(1982), 'terrain seed must reproduce exactly');
assert.equal(terrain.pad.w, 116, 'beginner pad width');
assert.equal(makeTerrain(1982, true).pad.w, 68, 'advanced pad width');
assert.ok(terrain.points.every((point) => point.y >= 385 && point.y <= 545), 'terrain stays in playfield');
assert.equal(groundAt(terrain, terrain.pad.x + terrain.pad.w / 2), terrain.pad.y, 'pad surface is flat');
for (let i = 0; i < 200; i += 1) { const level = makeTerrain(i, i % 2 === 0); assert.equal(groundAt(level, level.pad.x), level.pad.y, 'pad left edge is flat'); assert.equal(groundAt(level, level.pad.x + level.pad.w), level.pad.y, 'pad right edge is flat'); assert.ok(level.points.every((point, index) => index === 0 || point.x > level.points[index - 1].x), 'terrain x positions are strictly ordered'); }

const ship = { x: terrain.pad.x + terrain.pad.w / 2, y: terrain.pad.y - 35, vx: 0, vy: 1, angle: 0, angularVelocity: 0, fuel: 100 };
assert.ok(legs(ship).every((leg) => Math.abs(leg.y - terrain.pad.y) < 1), 'both legs meet pad together');
assert.equal(landingResult(ship, terrain.pad).ok, true, 'controlled touchdown succeeds');
assert.equal(landingResult({ ...ship, vy: CFG.safeVertical + .1 }, terrain.pad).reason, 'VERTICAL SPEED');
assert.equal(landingResult({ ...ship, vx: CFG.safeHorizontal + .1 }, terrain.pad).reason, 'HORIZONTAL SPEED');
assert.equal(landingResult({ ...ship, angle: (CFG.safeAngleDegrees + 1) * Math.PI / 180 }, terrain.pad).reason, 'EXCESSIVE TILT');
assert.equal(landingResult({ ...ship, x: terrain.pad.x - 20 }, terrain.pad).reason, 'MISSED THE PAD');

const falling = { x: 480, y: 120, vx: 0, vy: 0, angle: 0, angularVelocity: 0, fuel: 1 };
step(falling, { left: false, right: false, thrust: true }, 1 / 10);
assert.ok(falling.fuel < 1 && falling.vy < 0, 'thrust consumes fuel and counters gravity');
const crashed = { ...ship, y: terrain.pad.y + 1 };
assert.equal(terrainCollision(crashed, terrain, groundAt), true, 'terrain collision includes rocket geometry');
console.log('physics and terrain checks passed');
