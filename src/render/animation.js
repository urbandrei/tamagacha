// Animation utilities — easings, tweens, screen shake, squash/stretch
// All canvas-based (no DOM/CSS transforms)

import { getState } from '../shared/state.js';

// --- Reduced motion check ---

let mediaQueryReduced = false;
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQueryReduced = mq.matches;
  mq.addEventListener('change', (e) => { mediaQueryReduced = e.matches; });
}

export function isReducedMotion() {
  const state = getState();
  return mediaQueryReduced || (state.settings && state.settings.reducedMotion);
}

// --- Cubic bezier easing solver ---
// Attempt to find t for a given x on a cubic bezier using Newton-Raphson

function cubicBezier(p1x, p1y, p2x, p2y) {
  // Returns a function f(t) -> eased value, where t ∈ [0,1]
  function sampleCurveX(t) {
    return ((1 - 3 * p2x + 3 * p1x) * t + (3 * p2x - 6 * p1x)) * t * (3 * p1x) * t;
  }

  // Precompute coefficients
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  function bezierX(t) {
    return ((ax * t + bx) * t + cx) * t;
  }

  function bezierY(t) {
    return ((ay * t + by) * t + cy) * t;
  }

  function bezierDx(t) {
    return (3 * ax * t + 2 * bx) * t + cx;
  }

  // Newton-Raphson to solve for t given x
  function solveCurveX(x) {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = bezierX(t) - x;
      if (Math.abs(err) < 1e-6) return t;
      const d = bezierDx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    // Fallback: bisection
    let lo = 0, hi = 1;
    t = x;
    while (lo < hi) {
      const mid = bezierX(t);
      if (Math.abs(mid - x) < 1e-6) return t;
      if (x > mid) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  }

  return function(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return bezierY(solveCurveX(t));
  };
}

// --- Named easings (as JS functions) ---

export const easings = {
  bounce:  cubicBezier(0.34, 1.56, 0.64, 1),
  snap:    cubicBezier(0.68, -0.6, 0.32, 1.6),
  elastic: cubicBezier(0.175, 0.885, 0.32, 1.275),
  smooth:  cubicBezier(0.4, 0, 0.2, 1),
  decelerate: cubicBezier(0, 0, 0.2, 1),
  accelerate: cubicBezier(0.4, 0, 1, 1),
  linear: (t) => t,
};

// --- Generic tween helper ---
// Returns a tween object with .update(dt) and .value / .done properties

export function createTween(from, to, durationSec, easing = 'smooth', onFrame) {
  const easeFn = typeof easing === 'function' ? easing : (easings[easing] || easings.smooth);
  let elapsed = 0;
  const tween = {
    value: from,
    done: false,
    update(dt) {
      if (tween.done) return;
      elapsed += dt;
      let t = Math.min(elapsed / durationSec, 1);
      const eased = easeFn(t);
      tween.value = from + (to - from) * eased;
      if (onFrame) onFrame(tween.value);
      if (t >= 1) {
        tween.done = true;
        tween.value = to;
      }
    },
  };
  return tween;
}

// --- Active tweens manager ---
// Screens can push tweens here; updateTweens(dt) advances them all

const activeTweens = [];

export function addTween(tween) {
  activeTweens.push(tween);
  return tween;
}

export function animate(from, to, durationSec, easing, onFrame) {
  const tween = createTween(from, to, durationSec, easing, onFrame);
  addTween(tween);
  return tween;
}

export function updateTweens(dt) {
  for (let i = activeTweens.length - 1; i >= 0; i--) {
    activeTweens[i].update(dt);
    if (activeTweens[i].done) {
      activeTweens.splice(i, 1);
    }
  }
}

export function clearTweens() {
  activeTweens.length = 0;
}

// --- Screen shake ---
// Global shake offset — applied in engine loop via ctx.translate

let shakeX = 0;
let shakeY = 0;
let shakeDuration = 0;
let shakeIntensity = 0;
let shakeElapsed = 0;
let shakeFreq = 40;
let shakeDecay = 10;

export function screenShake(durationSec, intensityPx, freq = 40, decay = 10) {
  if (isReducedMotion()) {
    // Reduced motion: trigger a flash instead (callers check shakeFlash)
    shakeFlashTime = 0.15;
    return;
  }
  shakeDuration = durationSec;
  shakeIntensity = intensityPx;
  shakeElapsed = 0;
  shakeFreq = freq;
  shakeDecay = decay;
}

let shakeFlashTime = 0;

export function updateShake(dt) {
  // Flash timer for reduced motion
  if (shakeFlashTime > 0) {
    shakeFlashTime -= dt;
  }

  if (shakeElapsed >= shakeDuration) {
    shakeX = 0;
    shakeY = 0;
    return;
  }
  shakeElapsed += dt;
  const t = shakeElapsed;
  const damping = Math.exp(-shakeDecay * t);
  shakeX = shakeIntensity * Math.sin(shakeFreq * t) * damping;
  shakeY = shakeIntensity * Math.sin(shakeFreq * t * 1.1) * damping; // slightly offset freq
}

export function getShakeOffset() {
  return { x: shakeX, y: shakeY };
}

export function isShakeFlashing() {
  return shakeFlashTime > 0;
}

// --- Squash & stretch helper ---
// Creates a tween that drives scaleX/scaleY over time
// Returns an object with .update(dt), .scaleX, .scaleY, .done

export function createSquash(targetSx, targetSy, durationSec, easing = 'elastic') {
  const easeFn = typeof easing === 'function' ? easing : (easings[easing] || easings.elastic);
  let elapsed = 0;
  const squash = {
    scaleX: 1,
    scaleY: 1,
    done: false,
    update(dt) {
      if (squash.done) return;
      elapsed += dt;
      const t = Math.min(elapsed / durationSec, 1);
      const halfT = durationSec / 2;

      if (elapsed < halfT) {
        // First half: go toward target
        const p = easeFn(Math.min(elapsed / halfT, 1));
        squash.scaleX = 1 + (targetSx - 1) * p;
        squash.scaleY = 1 + (targetSy - 1) * p;
      } else {
        // Second half: return to 1.0
        const p = easeFn(Math.min((elapsed - halfT) / halfT, 1));
        squash.scaleX = targetSx + (1 - targetSx) * p;
        squash.scaleY = targetSy + (1 - targetSy) * p;
      }

      if (t >= 1) {
        squash.scaleX = 1;
        squash.scaleY = 1;
        squash.done = true;
      }
    },
  };

  if (isReducedMotion()) {
    // Skip scale animation, return already-done
    squash.done = true;
    return squash;
  }

  return squash;
}

// --- Scale pop helper (common UI feedback) ---
// Quick scale: 1 → peak → 1

export function createScalePop(peak, durationSec, easing = 'bounce') {
  return createSquash(peak, peak, durationSec, easing);
}
