// Blob renderer — draws blob shapes with hue fills and rarity borders

import { HUE_VALUES, RARITY_SATURATION } from '../shared/constants.js';

// --- Shape path functions (centered at 0,0, unit size = 1) ---

function pathRound(ctx, s) {
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.48, 0, 0, Math.PI * 2);
}

function pathTall(ctx, s) {
  const w = s * 0.38;
  const h = s * 0.55;
  ctx.beginPath();
  // Egg / teardrop — wider at bottom, narrower at top
  ctx.moveTo(0, -h);
  ctx.bezierCurveTo(w * 0.8, -h, w, -h * 0.3, w, h * 0.1);
  ctx.bezierCurveTo(w, h * 0.7, w * 0.6, h, 0, h);
  ctx.bezierCurveTo(-w * 0.6, h, -w, h * 0.7, -w, h * 0.1);
  ctx.bezierCurveTo(-w, -h * 0.3, -w * 0.8, -h, 0, -h);
  ctx.closePath();
}

function pathWide(ctx, s) {
  const w = s * 0.55;
  const h = s * 0.35;
  const r = h * 0.6; // corner radius
  ctx.beginPath();
  ctx.moveTo(-w + r, -h);
  ctx.lineTo(w - r, -h);
  ctx.quadraticCurveTo(w, -h, w, -h + r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(-w + r, h);
  ctx.quadraticCurveTo(-w, h, -w, h - r);
  ctx.lineTo(-w, -h + r);
  ctx.quadraticCurveTo(-w, -h, -w + r, -h);
  ctx.closePath();
}

function pathLumpy(ctx, s) {
  const r = s * 0.46;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.bezierCurveTo(r * 0.6, -r * 0.95, r * 1.0, -r * 0.4, r * 0.85, 0);
  ctx.bezierCurveTo(r * 1.05, r * 0.5, r * 0.6, r * 0.95, 0, r * 0.8);
  ctx.bezierCurveTo(-r * 0.55, r * 1.0, -r * 1.1, r * 0.45, -r * 0.8, -0.05 * r);
  ctx.bezierCurveTo(-r * 1.0, -r * 0.55, -r * 0.55, -r * 0.95, 0, -r * 0.85);
  ctx.closePath();
}

const SHAPE_FN = {
  round: pathRound,
  tall: pathTall,
  wide: pathWide,
  lumpy: pathLumpy,
};

// --- Rarity border styles ---

function strokeCommon(ctx) {
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.stroke();
}

function strokeUncommon(ctx, time) {
  const alpha = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.strokeStyle = `rgba(205, 127, 50, ${alpha})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.stroke();
}

function strokeRare(ctx, time) {
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -time * 30;
  ctx.stroke();
  ctx.setLineDash([]);
}

function strokeLegendary(ctx, time) {
  const hue = (time * 60) % 360;
  ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
  ctx.lineWidth = 4;
  ctx.setLineDash([]);
  ctx.stroke();
}

const RARITY_STROKE = {
  common: strokeCommon,
  uncommon: strokeUncommon,
  rare: strokeRare,
  legendary: strokeLegendary,
};

// --- Drop shadow ---

function drawShadow(ctx, size) {
  ctx.beginPath();
  ctx.ellipse(0, size * 0.4, size * 0.35, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fill();
}

// --- Expression helpers ---

function getExpressionTier(lowestStat, isDormant) {
  if (isDormant) return 'dormant';
  if (lowestStat >= 80) return 'joyful';
  if (lowestStat >= 60) return 'content';
  if (lowestStat >= 30) return 'needy';
  return 'distressed';
}

function drawEyesJoyful(ctx, s, time) {
  const eyeR = s * 0.055;
  const eyeX = s * 0.14;
  const eyeY = -s * 0.08;

  // Round eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-eyeX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#1a1a2e';
  const pupilR = eyeR * 0.55;
  ctx.beginPath();
  ctx.arc(-eyeX, eyeY, pupilR, 0, Math.PI * 2);
  ctx.arc(eyeX, eyeY, pupilR, 0, Math.PI * 2);
  ctx.fill();

  // Sparkle dots — small white dots that orbit around the eyes
  const sparkleT = time * 2.5;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  for (let i = 0; i < 3; i++) {
    const angle = sparkleT + i * (Math.PI * 2 / 3);
    const dist = s * 0.22;
    const sx = Math.cos(angle) * dist;
    const sy = -s * 0.05 + Math.sin(angle) * dist * 0.4;
    ctx.beginPath();
    ctx.arc(sx, sy, s * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blush — pink circles under eyes
  ctx.fillStyle = 'rgba(255, 150, 180, 0.3)';
  ctx.beginPath();
  ctx.ellipse(-eyeX - s * 0.02, eyeY + eyeR + s * 0.04, s * 0.05, s * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeX + s * 0.02, eyeY + eyeR + s * 0.04, s * 0.05, s * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEyesContent(ctx, s) {
  const eyeR = s * 0.048;
  const eyeX = s * 0.13;
  const eyeY = -s * 0.08;

  // Oval relaxed eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-eyeX, eyeY, eyeR, eyeR * 0.8, 0, 0, Math.PI * 2);
  ctx.ellipse(eyeX, eyeY, eyeR, eyeR * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#1a1a2e';
  const pupilR = eyeR * 0.5;
  ctx.beginPath();
  ctx.arc(-eyeX, eyeY, pupilR, 0, Math.PI * 2);
  ctx.arc(eyeX, eyeY, pupilR, 0, Math.PI * 2);
  ctx.fill();
}

function drawEyesNeedy(ctx, s) {
  const eyeX = s * 0.13;
  const eyeY = -s * 0.06;
  const eyeW = s * 0.05;
  const eyeH = s * 0.025;

  // Half-closed droopy eyes — upper eyelid covers half
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-eyeX, eyeY, eyeW, eyeH * 1.5, 0, 0, Math.PI * 2);
  ctx.ellipse(eyeX, eyeY, eyeW, eyeH * 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Small pupils low in the eye
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(-eyeX, eyeY + eyeH * 0.3, eyeW * 0.4, 0, Math.PI * 2);
  ctx.arc(eyeX, eyeY + eyeH * 0.3, eyeW * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawEyesDistressed(ctx, s, time) {
  const eyeR = s * 0.06;
  const eyeX = s * 0.14;
  const eyeY = -s * 0.08;
  // Slight tremble
  const tremble = Math.sin(time * 15) * s * 0.008;

  // Wide urgent eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-eyeX + tremble, eyeY, eyeR, 0, Math.PI * 2);
  ctx.arc(eyeX + tremble, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Small contracted pupils
  ctx.fillStyle = '#1a1a2e';
  const pupilR = eyeR * 0.4;
  ctx.beginPath();
  ctx.arc(-eyeX + tremble, eyeY, pupilR, 0, Math.PI * 2);
  ctx.arc(eyeX + tremble, eyeY, pupilR, 0, Math.PI * 2);
  ctx.fill();
}

function drawEyesDormant(ctx, s) {
  const eyeX = s * 0.13;
  const eyeY = -s * 0.06;
  const w = s * 0.06;

  // Closed eye arcs
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = s * 0.02;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(-eyeX, eyeY, w, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(eyeX, eyeY, w, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function drawMouthSmile(ctx, s) {
  const y = s * 0.1;
  const w = s * 0.07;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = s * 0.018;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, y - s * 0.02, w, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

function drawMouthWorried(ctx, s) {
  const y = s * 0.12;
  const w = s * 0.06;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = s * 0.016;
  ctx.lineCap = 'round';
  // Wavy worried mouth
  ctx.beginPath();
  ctx.moveTo(-w, y);
  ctx.quadraticCurveTo(-w * 0.3, y - s * 0.03, 0, y);
  ctx.quadraticCurveTo(w * 0.3, y + s * 0.03, w, y);
  ctx.stroke();
}

function drawZzz(ctx, s, time) {
  const baseX = s * 0.3;
  const baseY = -s * 0.3;
  ctx.font = `bold ${s * 0.12}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 3; i++) {
    const phase = (time * 0.8 + i * 0.6) % 2.4;
    const progress = phase / 2.4;
    const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
    const tx = baseX + i * s * 0.08;
    const ty = baseY - progress * s * 0.25;
    const fontSize = s * (0.08 + i * 0.02);

    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    ctx.fillStyle = `rgba(200, 200, 255, ${alpha * 0.8})`;
    ctx.fillText('z', tx, ty);
  }
}

function drawNeedIcon(ctx, s, time) {
  // Small floating exclamation thought-bubble above the blob
  const bobY = Math.sin(time * 3) * s * 0.03;
  const ix = s * 0.25;
  const iy = -s * 0.35 + bobY;

  // Bubble background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(ix, iy, s * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Exclamation mark
  ctx.fillStyle = '#e74c3c';
  ctx.font = `bold ${s * 0.1}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', ix, iy);
}

// --- Expression draw function ---

export function drawBlobExpression(ctx, x, y, { lowestStat = 100, isDormant = false, size = 48, time = 0 }) {
  const tier = getExpressionTier(lowestStat, isDormant);

  ctx.save();
  ctx.translate(x, y);

  // Match the breathing transform from drawBlob
  const breathe = Math.sin(time * Math.PI);
  const sy = 1.0 + 0.05 * breathe;
  const sx = 1.0 - 0.05 * breathe * 0.5;

  // Dormant uses slower breathing
  if (tier === 'dormant') {
    const dormantBreathe = Math.sin(time * Math.PI / 1.5);
    ctx.scale(
      1.0 - 0.015 * dormantBreathe * 0.5,
      1.0 + 0.015 * dormantBreathe
    );
  } else {
    ctx.scale(sx, sy);
  }

  // Dormant grey tint overlay
  if (tier === 'dormant') {
    // We can't easily desaturate, so draw a semi-transparent grey overlay
    // This is applied via globalCompositeOperation by the caller ideally,
    // but for simplicity we'll note it and draw the face
  }

  // Eyes
  switch (tier) {
    case 'joyful':
      drawEyesJoyful(ctx, size, time);
      drawMouthSmile(ctx, size);
      break;
    case 'content':
      drawEyesContent(ctx, size);
      drawMouthSmile(ctx, size);
      break;
    case 'needy':
      drawEyesNeedy(ctx, size);
      drawMouthWorried(ctx, size);
      break;
    case 'distressed':
      drawEyesDistressed(ctx, size, time);
      drawMouthWorried(ctx, size);
      break;
    case 'dormant':
      drawEyesDormant(ctx, size);
      break;
  }

  ctx.restore();

  // Draw overlays outside the breathing transform
  ctx.save();
  ctx.translate(x, y);
  if (tier === 'dormant') {
    drawZzz(ctx, size, time);
  }
  if (tier === 'needy' || tier === 'distressed') {
    drawNeedIcon(ctx, size, time);
  }
  ctx.restore();
}

// --- Main draw function ---

export function drawBlob(ctx, x, y, { shape, hue, rarity, size = 48, time = 0 }) {
  const hueDeg = HUE_VALUES[hue] ?? 0;
  const sat = RARITY_SATURATION[rarity] ?? 80;
  const shapeFn = SHAPE_FN[shape] ?? pathRound;

  ctx.save();
  ctx.translate(x, y);

  // 1. Drop shadow (before breathing so it stays grounded)
  drawShadow(ctx, size);

  // 2. Idle breathing — 2s loop, volume-preserving squash & stretch
  const breathe = Math.sin(time * Math.PI);
  const sy = 1.0 + 0.05 * breathe;
  const sx = 1.0 - 0.05 * breathe * 0.5;
  ctx.scale(sx, sy);

  // 3. Shape path
  shapeFn(ctx, size);

  // 4. Radial gradient fill (upper-left highlight → dark edge)
  const grad = ctx.createRadialGradient(
    -size * 0.15, -size * 0.2, size * 0.05,
    0, 0, size * 0.55
  );
  grad.addColorStop(0.0, `hsl(${hueDeg}, ${sat}%, 75%)`);
  grad.addColorStop(0.5, `hsl(${hueDeg}, ${sat}%, 60%)`);
  grad.addColorStop(1.0, `hsl(${hueDeg}, ${sat}%, 40%)`);
  ctx.fillStyle = grad;
  ctx.fill();

  // 5. Rarity border
  const strokeFn = RARITY_STROKE[rarity] ?? strokeCommon;
  strokeFn(ctx, time);

  ctx.restore();
}
