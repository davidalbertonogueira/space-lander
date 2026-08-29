import assert from 'node:assert/strict';

const listeners = new Map();
const makeElement = (id) => ({
  id, textContent: '', className: '', dataset: {},
  classList: { values: new Set(), add(value) { this.values.add(value); }, remove(value) { this.values.delete(value); }, contains(value) { return this.values.has(value); } },
  addEventListener(type, handler) { listeners.set(`${id}:${type}`, handler); }, focus() {}, setPointerCapture() {},
});
const ids = ['game', 'title', 'help', 'message', 'fuel', 'hspeed', 'vspeed', 'angle', 'altitude', 'score', 'mode', 'seed', 'high-title', 'sound', 'message-kicker', 'message-title', 'message-detail', 'message-action', 'start', 'how', 'close-help', 'input-note'];
const elements = Object.fromEntries(ids.map((id) => [id, makeElement(id)]));
elements.game.getContext = () => ({ fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillText() {}, set fillStyle(_) {}, set strokeStyle(_) {}, set lineWidth(_) {}, set font(_) {}, set globalAlpha(_) {} });
globalThis.document = { getElementById: (id) => elements[id], addEventListener(type, handler) { listeners.set(`document:${type}`, handler); }, querySelectorAll() { return []; }, hidden: false };
globalThis.window = { addEventListener() {} };
globalThis.localStorage = { values: new Map(), getItem(key) { return this.values.get(key) ?? null; }, setItem(key, value) { this.values.set(key, String(value)); } };
globalThis.matchMedia = () => ({ matches: false });
globalThis.requestAnimationFrame = () => 1;

await import('../src/game.js');
assert.ok(listeners.has('start:click'), 'start button receives its production click handler');
listeners.get('start:click')();
assert.equal(elements.title.classList.contains('hidden'), true, 'start hides title overlay');
assert.notEqual(elements.seed.textContent, '-----', 'start creates a seeded playable round');
assert.equal(elements.mode.textContent, 'BEGINNER', 'start initializes beginner mode');
console.log('startup smoke test passed');
