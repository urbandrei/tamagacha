// Game engine — canvas setup, game loop, input routing

import { updateShake, getShakeOffset, updateTweens, isShakeFlashing } from '../render/animation.js';

const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080; // 16:9 landscape

let canvas, ctx;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let currentScreen = null;
let lastTime = 0;

export { GAME_WIDTH, GAME_HEIGHT };

export function getCtx() {
  return ctx;
}

function resize() {
  const windowW = window.innerWidth;
  const windowH = window.innerHeight;

  // Fit game rect inside window, preserving aspect ratio
  const aspect = GAME_WIDTH / GAME_HEIGHT;
  let w, h;

  if (windowW / windowH < aspect) {
    w = windowW;
    h = windowW / aspect;
  } else {
    h = windowH;
    w = windowH * aspect;
  }

  scale = w / GAME_WIDTH;
  offsetX = (windowW - w) / 2;
  offsetY = (windowH - h) / 2;

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.style.marginLeft = offsetX + 'px';
  canvas.style.marginTop = offsetY + 'px';
}

// Convert a DOM event (mouse/touch) to game coordinates
function toGameCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale,
  };
}

function onPointerDown(e) {
  e.preventDefault();
  const pos = toGameCoords(e);
  if (currentScreen && currentScreen.onPointerDown) {
    currentScreen.onPointerDown(pos.x, pos.y);
  }
}

function onPointerUp(e) {
  const pos = toGameCoords(e.changedTouches ? e : e);
  if (currentScreen && currentScreen.onPointerUp) {
    currentScreen.onPointerUp(pos.x, pos.y);
  }
}

function onPointerMove(e) {
  const pos = toGameCoords(e);
  if (currentScreen && currentScreen.onPointerMove) {
    currentScreen.onPointerMove(pos.x, pos.y);
  }
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1); // seconds, capped
  lastTime = time;

  // Update global animation systems
  updateShake(dt);
  updateTweens(dt);

  if (currentScreen) {
    if (currentScreen.update) currentScreen.update(dt);

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Apply screen shake offset
    const shake = getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // Reduced-motion flash overlay
    if (currentScreen.render) currentScreen.render(ctx);

    ctx.restore();

    // Draw shake flash overlay (reduced motion fallback)
    if (isShakeFlashing()) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }

  requestAnimationFrame(loop);
}

export function setScreen(screen) {
  if (currentScreen && currentScreen.exit) currentScreen.exit();
  currentScreen = screen;
  if (currentScreen && currentScreen.enter) currentScreen.enter();
}

export function initEngine() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize);

  // Input
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('touchstart', onPointerDown, { passive: false });
  canvas.addEventListener('touchend', onPointerUp);
  canvas.addEventListener('touchmove', onPointerMove, { passive: false });

  // Start loop
  lastTime = performance.now();
  requestAnimationFrame(loop);
}
