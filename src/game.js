import { makeTerrain, groundAt } from './terrain.js';
import { CFG, legs, step, landingResult, terrainCollision } from './physics.js';
import { AudioFX } from './audio.js';

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 600;
const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const audio = new AudioFX();
const input = { left: false, right: false, thrust: false };
const ui = { title: $('title'), help: $('help'), message: $('message'), fuel: $('fuel'), hspeed: $('hspeed'), vspeed: $('vspeed'), angle: $('angle'), altitude: $('altitude'), score: $('score'), mode: $('mode'), seed: $('seed'), high: $('high-title'), sound: $('sound'), kicker: $('message-kicker'), messageTitle: $('message-title'), detail: $('message-detail'), action: $('message-action') };

let state = 'title';
let terrain;
let ship;
let score = 0;
let round = 0;
let seed = 0;
let advanced = false;
let particles = [];
let lastFrame = 0;
let accumulator = 0;
const FIXED_STEP = 1 / 120;

const highScore = () => Number(localStorage.getItem('rocketLanderHigh') || 0);
function updateHighScore() { if (score > highScore()) localStorage.setItem('rocketLanderHigh', score); ui.high.textContent = String(highScore()).padStart(3, '0'); }
function clearInput() { Object.keys(input).forEach((key) => { input[key] = false; }); audio.thrust(false); }
function newRound() { seed = (Date.now() + round * 7919) >>> 0; round += 1; advanced = score >= 100; terrain = makeTerrain(seed, advanced); ship = { x: LOGICAL_WIDTH / 2, y: 100, vx: 0, vy: 1.2, angle: 0, angularVelocity: 0, fuel: advanced ? 70 : 100 }; particles = []; state = 'playing'; clearInput(); hideMessage(); updateTelemetry(); }
function startMission() { score = 0; round = 0; newRound(); ui.title.classList.add('hidden'); audio.on(); }

function showMessage(kicker, title, detail, label) { ui.kicker.textContent = kicker; ui.messageTitle.textContent = title; ui.detail.textContent = detail; ui.action.textContent = label; ui.message.classList.remove('hidden'); ui.action.focus(); }
function hideMessage() { ui.message.classList.add('hidden'); }
function pause() { if (state !== 'playing') return; state = 'paused'; clearInput(); showMessage('MISSION PAUSED', 'PAUSED', 'Press P or ESC to resume.', 'RESUME'); }
function resume() { if (state !== 'paused') return; state = 'playing'; hideMessage(); }

function resolveRound(result) {
  clearInput();
  if (result.ok) {
    const precision = Math.max(0, CFG.safeHorizontal - Math.abs(ship.vx)) * 4;
    const softness = Math.max(0, CFG.safeVertical - ship.vy) * 7;
    const bonus = Math.max(12, Math.round(17 + ship.fuel * 0.24 + precision + softness + (advanced ? 11 : 0)));
    score += bonus;
    updateHighScore();
    state = 'landed';
    for (let i = 0; i < 20; i += 1) particles.push({ x: ship.x, y: ship.y + 28, vx: (Math.random() - .5) * 70, vy: -Math.random() * 70, life: .45 + Math.random() * .35, color: '#67f5ff' });
    if (score >= 100 && !advanced) { advanced = true; audio.advanced(); showMessage('SCORE 100 ACHIEVED', 'ADVANCED MODE', 'Narrow pads. Steeper terrain. Lower fuel reserve.', 'BEGIN ADVANCED'); }
    else { audio.land(); showMessage('LANDING CONFIRMED', `TOUCHDOWN +${bonus}`, `Cumulative score ${score}. Fuel reserve ${Math.round(ship.fuel)}.`, 'NEXT LANDING'); }
  } else {
    state = 'crashed';
    audio.crash();
    for (let i = 0; i < 38; i += 1) particles.push({ x: ship.x, y: ship.y, vx: (Math.random() - .5) * 185, vy: (Math.random() - .65) * 185, life: .7 + Math.random() * .8, color: i % 3 ? '#f36dff' : '#ffc857' });
    showMessage('IMPACT REPORT', 'GAME OVER', `${result.reason}. Press R or begin a new mission.`, 'NEW MISSION');
  }
}

function update(dt) {
  particles = particles.filter((particle) => { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += 30 * dt; particle.life -= dt; return particle.life > 0; });
  if (state !== 'playing') return;
  step(ship, input, dt);
  if (input.thrust && ship.fuel > 0 && Math.random() < .72) particles.push({ x: ship.x + (Math.random() - .5) * 5, y: ship.y + 24, vx: (Math.random() - .5) * 22, vy: 45 + Math.random() * 55, life: .24 + Math.random() * .18, color: Math.random() < .5 ? '#ffc857' : '#f36dff' });
  audio.thrust(input.thrust && ship.fuel > 0);
  if (ship.x < -24 || ship.x > LOGICAL_WIDTH + 24 || ship.y < -40 || ship.y > LOGICAL_HEIGHT + 30) { resolveRound({ ok: false, reason: 'OUT OF FLIGHT AREA' }); return; }
  const legPoints = legs(ship);
  const touchesPad = legPoints.some((leg) => leg.x >= terrain.pad.x && leg.x <= terrain.pad.x + terrain.pad.w && leg.y >= terrain.pad.y - 2);
  if (touchesPad) { resolveRound(landingResult(ship, terrain.pad)); return; }
  if (terrainCollision(ship, terrain, groundAt)) resolveRound({ ok: false, reason: 'MISSED THE PAD' });
}

function drawLine(x1, y1, x2, y2, color, width = 1) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function render() {
  ctx.fillStyle = '#02040a'; ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  for (let i = 0; i < 70; i += 1) { const x = (i * 179 + seed) % LOGICAL_WIDTH, y = (i * 71 + seed) % 340; ctx.fillStyle = i % 8 ? '#316277' : '#c6faff'; ctx.fillRect(x, y, 1, 1); }
  if (!terrain) return;
  ctx.beginPath(); ctx.moveTo(0, LOGICAL_HEIGHT); terrain.points.forEach((point) => ctx.lineTo(point.x, point.y)); ctx.lineTo(LOGICAL_WIDTH, LOGICAL_HEIGHT); ctx.closePath(); ctx.fillStyle = '#071824'; ctx.fill();
  ctx.beginPath(); terrain.points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.strokeStyle = '#65efff'; ctx.lineWidth = 2; ctx.stroke();
  const pad = terrain.pad; ctx.fillStyle = '#173a42'; ctx.fillRect(pad.x, pad.y - 3, pad.w, 5); drawLine(pad.x, pad.y, pad.x + pad.w, pad.y, '#ffc857', 3); ctx.fillStyle = '#ffc857'; ctx.font = '10px monospace'; ctx.fillText('LAND', pad.x + pad.w / 2 - 14, pad.y - 10);
  if (ship && (state !== 'crashed' || particles.length === 0)) drawRocket();
  particles.forEach((particle) => { ctx.globalAlpha = Math.max(0, particle.life); ctx.fillStyle = particle.color; ctx.fillRect(particle.x, particle.y, 3, 3); }); ctx.globalAlpha = 1;
}
function drawRocket() {
  ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.angle);
  if (input.thrust && state === 'playing' && ship.fuel > 0) { ctx.fillStyle = '#ffc857'; ctx.beginPath(); ctx.moveTo(-7, 18); ctx.lineTo(0, 37 + Math.random() * 12); ctx.lineTo(7, 18); ctx.fill(); ctx.fillStyle = '#f36dff'; ctx.fillRect(-3, 18, 6, 14); }
  ctx.strokeStyle = '#e6fbff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-10, 17); ctx.lineTo(10, 17); ctx.closePath(); ctx.stroke(); ctx.fillStyle = '#164556'; ctx.fillRect(-5, -4, 10, 9); drawLine(-10, 14, -17, 30, '#e6fbff', 2); drawLine(10, 14, 17, 30, '#e6fbff', 2); drawLine(-17, 30, -9, 30, '#e6fbff', 2); drawLine(17, 30, 9, 30, '#e6fbff', 2); ctx.restore();
}
function writeTelemetry(element, value, warning = false, danger = false) { element.textContent = value; element.className = danger ? 'danger' : warning ? 'warn' : ''; }
function updateTelemetry() {
  if (!ship) return;
  const altitude = Math.max(0, Math.round(groundAt(terrain, ship.x) - Math.max(...legs(ship).map((leg) => leg.y))));
  writeTelemetry(ui.fuel, Math.round(ship.fuel), ship.fuel < 25, ship.fuel < 10); writeTelemetry(ui.hspeed, Math.abs(ship.vx).toFixed(1), Math.abs(ship.vx) > CFG.safeHorizontal * .72, Math.abs(ship.vx) > CFG.safeHorizontal); writeTelemetry(ui.vspeed, Math.max(0, ship.vy).toFixed(1), ship.vy > CFG.safeVertical * .72, ship.vy > CFG.safeVertical); writeTelemetry(ui.angle, `${Math.round(ship.angle * 180 / Math.PI)}°`, Math.abs(ship.angle * 180 / Math.PI) > CFG.safeAngleDegrees * .7, Math.abs(ship.angle * 180 / Math.PI) > CFG.safeAngleDegrees); writeTelemetry(ui.altitude, String(altitude).padStart(3, '0')); writeTelemetry(ui.score, String(score).padStart(3, '0')); writeTelemetry(ui.mode, advanced ? 'ADVANCED' : 'BEGINNER'); writeTelemetry(ui.seed, seed.toString(36).toUpperCase().slice(-5));
}
function loop(timestamp) { const elapsed = Math.min(.05, (timestamp - lastFrame || 0) / 1000); lastFrame = timestamp; accumulator += elapsed; while (accumulator >= FIXED_STEP) { update(FIXED_STEP); accumulator -= FIXED_STEP; } render(); updateTelemetry(); requestAnimationFrame(loop); }

function setControl(name, down) { input[name] = down; }
document.addEventListener('keydown', (event) => { const key = event.key.toLowerCase(); const controls = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'thrust', w: 'thrust', ' ': 'thrust' }; if (controls[key]) { event.preventDefault(); setControl(controls[key], true); } if (!event.repeat && (key === 'p' || key === 'escape')) state === 'playing' ? pause() : resume(); if (!event.repeat && key === 'm') { audio.toggle(); ui.sound.textContent = `SOUND: ${audio.muted ? 'OFF' : 'ON'}`; } if (!event.repeat && key === 'r') { if (state === 'crashed') startMission(); else if (state === 'landed') newRound(); } });
document.addEventListener('keyup', (event) => { const controls = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'thrust', w: 'thrust', ' ': 'thrust' }; const name = controls[event.key.toLowerCase()]; if (name) { event.preventDefault(); setControl(name, false); } });
window.addEventListener('blur', () => { clearInput(); if (state === 'playing') pause(); }); document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); });
document.querySelectorAll('[data-control]').forEach((button) => { const name = button.dataset.control; button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); setControl(name, true); }); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => button.addEventListener(type, () => setControl(name, false))); });
$('start').addEventListener('click', startMission); $('how').addEventListener('click', () => { ui.title.classList.add('hidden'); ui.help.classList.remove('hidden'); }); $('close-help').addEventListener('click', () => { ui.help.classList.add('hidden'); ui.title.classList.remove('hidden'); $('start').focus(); }); ui.action.addEventListener('click', () => { if (state === 'paused') resume(); else if (state === 'landed') newRound(); else if (state === 'crashed') startMission(); }); ui.sound.addEventListener('click', () => { audio.toggle(); ui.sound.textContent = `SOUND: ${audio.muted ? 'OFF' : 'ON'}`; });
ui.sound.textContent = `SOUND: ${audio.muted ? 'OFF' : 'ON'}`; $('input-note').textContent = matchMedia('(pointer: coarse)').matches ? 'Touch controls below support thrust and turning at the same time. Fuel is finite.' : 'Use thrust sparingly: fuel is finite.'; updateHighScore(); requestAnimationFrame(loop);
