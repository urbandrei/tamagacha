// Home screen — main care view

import { GAME_WIDTH, GAME_HEIGHT } from '../shared/engine.js';
import { drawNav, handleNavTap, NAV_HEIGHT } from '../shared/router.js';
import { drawBlob, drawBlobExpression } from '../render/blob.js';
import { getState, saveState } from '../shared/state.js';
import { CARE_ACTIONS, STAT_FLOORS } from '../shared/constants.js';
import { doCareAction, getCooldownRemaining } from '../systems/care.js';
import { getBalance } from '../systems/currency.js';
import { createSquash, screenShake, createTween } from '../render/animation.js';

let elapsed = 0;

// --- Blob animation state ---
let blobSquash = null;    // active squash/stretch anim
let blobRotation = 0;     // for pet tilt
let rotationTween = null;

// --- Floating text ---
const floatingTexts = [];

function addFloatingText(text, x, y, color = '#ffd700') {
  floatingTexts.push({ text, x, y, startY: y, color, life: 1.2, maxLife: 1.2 });
}

// --- Stat bar animation ---
const statBarValues = { hunger: 0, happiness: 0, energy: 0, cleanliness: 0, bond: 0 };
const statBarTweens = {};

function animateStatBar(stat, target) {
  statBarTweens[stat] = createTween(statBarValues[stat], target, 0.5, 'smooth', (v) => {
    statBarValues[stat] = v;
  });
}

// --- Layout constants ---
const BLOB_X = GAME_WIDTH / 2;
const BLOB_Y = 340;
const BLOB_SIZE = 200;

const STAT_START_Y = 530;
const STAT_H = 28;
const STAT_GAP = 8;
const STAT_BAR_W = 500;
const STAT_LABEL_W = 140;
const STAT_X = GAME_WIDTH / 2 - (STAT_BAR_W + STAT_LABEL_W) / 2 + STAT_LABEL_W;

const STAT_COLORS = {
  hunger: '#ff6b6b',
  happiness: '#ffd93d',
  energy: '#6bcb77',
  cleanliness: '#4d96ff',
  bond: '#ff6eb4',
};

const STAT_NAMES = {
  hunger: 'Hunger',
  happiness: 'Happy',
  energy: 'Energy',
  cleanliness: 'Clean',
  bond: 'Bond',
};

const STAT_ORDER = ['hunger', 'happiness', 'energy', 'cleanliness', 'bond'];

// --- Care buttons ---
const CARE_BTNS = [
  { action: 'feed', label: 'Feed', icon: '\u{1F35E}' },
  { action: 'clean', label: 'Clean', icon: '\u{1F9F9}' },
  { action: 'rest', label: 'Rest', icon: '\u{1F634}' },
  { action: 'pet', label: 'Pet', icon: '\u{1F496}' },
];

const BTN_Y = 760;
const BTN_H = 60;
const BTN_W = 180;
const BTN_GAP = 30;
const BTN_TOTAL_W = CARE_BTNS.length * BTN_W + (CARE_BTNS.length - 1) * BTN_GAP;
const BTN_START_X = (GAME_WIDTH - BTN_TOTAL_W) / 2;

// --- Blob switcher ---
const SWITCHER_Y = 70;
const SWITCHER_BLOB_SIZE = 48;
const SWITCHER_GAP = 20;

// --- Helpers ---

function getActiveBlob() {
  const state = getState();
  if (!state.activeBlob || !state.blobs[state.activeBlob]) {
    const ids = Object.keys(state.blobs);
    if (ids.length === 0) return null;
    state.activeBlob = ids[0];
    saveState(state);
  }
  return { id: state.activeBlob, blob: state.blobs[state.activeBlob] };
}

function lowestStat(blob) {
  let min = 100;
  for (const stat of STAT_ORDER) {
    if (blob.stats[stat] < min) min = blob.stats[stat];
  }
  return min;
}

function formatCooldown(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function syncStatBars(blob) {
  for (const stat of STAT_ORDER) {
    const target = blob.stats[stat];
    if (Math.abs(statBarValues[stat] - target) > 0.5) {
      animateStatBar(stat, target);
    } else {
      statBarValues[stat] = target;
    }
  }
}

export const homeScreen = {
  enter() {
    elapsed = 0;
    blobSquash = null;
    blobRotation = 0;
    rotationTween = null;
    floatingTexts.length = 0;

    // Initialize stat bars to current values
    const active = getActiveBlob();
    if (active) {
      for (const stat of STAT_ORDER) {
        statBarValues[stat] = active.blob.stats[stat];
      }
    }
  },

  update(dt) {
    elapsed += dt;

    // Update squash animation
    if (blobSquash && !blobSquash.done) blobSquash.update(dt);
    if (rotationTween && !rotationTween.done) rotationTween.update(dt);

    // Update stat bar tweens
    for (const key of Object.keys(statBarTweens)) {
      if (statBarTweens[key] && !statBarTweens[key].done) {
        statBarTweens[key].update(dt);
      }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.life -= dt;
      ft.y -= 60 * dt; // float upward
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Sync stat bars with current state (for decay)
    const active = getActiveBlob();
    if (active) syncStatBars(active.blob);
  },

  render(ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const active = getActiveBlob();

    // --- Header: Stardust balance ---
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`\u2726 ${getBalance()}`, 40, 35);

    if (!active) {
      ctx.fillStyle = '#888';
      ctx.font = '28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No blobs yet! Visit the Gacha to pull one.', GAME_WIDTH / 2, GAME_HEIGHT / 2);
      drawNav(ctx);
      return;
    }

    const { id: blobId, blob } = active;

    // --- Blob switcher (if multiple blobs) ---
    const state = getState();
    const blobIds = Object.keys(state.blobs);
    if (blobIds.length > 1) {
      const totalW = blobIds.length * (SWITCHER_BLOB_SIZE + SWITCHER_GAP) - SWITCHER_GAP;
      const startX = (GAME_WIDTH - totalW) / 2 + SWITCHER_BLOB_SIZE / 2;

      for (let i = 0; i < blobIds.length; i++) {
        const b = state.blobs[blobIds[i]];
        const sx = startX + i * (SWITCHER_BLOB_SIZE + SWITCHER_GAP);
        const isActive = blobIds[i] === blobId;

        // Highlight ring for active
        if (isActive) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(sx, SWITCHER_Y, SWITCHER_BLOB_SIZE / 2 + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        drawBlob(ctx, sx, SWITCHER_Y, {
          shape: b.shape, hue: b.hue, rarity: b.rarity,
          size: SWITCHER_BLOB_SIZE, time: elapsed,
        });
      }
    }

    // --- Blob name ---
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(blob.name || 'Unnamed', GAME_WIDTH / 2, 120);

    // --- Active blob ---
    ctx.save();
    ctx.translate(BLOB_X, BLOB_Y);

    // Apply care action squash/stretch
    const sqX = blobSquash ? blobSquash.scaleX : 1;
    const sqY = blobSquash ? blobSquash.scaleY : 1;
    ctx.scale(sqX, sqY);

    // Apply pet tilt rotation
    if (blobRotation !== 0) {
      ctx.rotate(blobRotation);
    }

    ctx.translate(-BLOB_X, -BLOB_Y);

    drawBlob(ctx, BLOB_X, BLOB_Y, {
      shape: blob.shape, hue: blob.hue, rarity: blob.rarity,
      size: BLOB_SIZE, time: elapsed,
    });
    drawBlobExpression(ctx, BLOB_X, BLOB_Y, {
      lowestStat: lowestStat(blob),
      isDormant: blob.isDormant,
      size: BLOB_SIZE,
      time: elapsed,
    });
    ctx.restore();

    // --- Stat bars ---
    ctx.textBaseline = 'middle';
    for (let i = 0; i < STAT_ORDER.length; i++) {
      const stat = STAT_ORDER[i];
      const y = STAT_START_Y + i * (STAT_H + STAT_GAP);
      const val = statBarValues[stat];
      const floor = STAT_FLOORS[stat];

      // Label
      ctx.fillStyle = '#aaa';
      ctx.font = '20px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(STAT_NAMES[stat], STAT_X - 15, y + STAT_H / 2);

      // Bar background
      ctx.fillStyle = '#222240';
      ctx.beginPath();
      ctx.roundRect(STAT_X, y, STAT_BAR_W, STAT_H, 6);
      ctx.fill();

      // Floor marker
      const floorX = STAT_X + (floor / 100) * STAT_BAR_W;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(floorX, y);
      ctx.lineTo(floorX, y + STAT_H);
      ctx.stroke();

      // Fill
      const fillW = Math.max(0, (val / 100) * STAT_BAR_W);
      ctx.fillStyle = STAT_COLORS[stat];
      ctx.beginPath();
      ctx.roundRect(STAT_X, y, fillW, STAT_H, 6);
      ctx.fill();

      // Value text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(val), STAT_X + STAT_BAR_W + 35, y + STAT_H / 2);
    }

    // --- Care buttons ---
    for (let i = 0; i < CARE_BTNS.length; i++) {
      const btn = CARE_BTNS[i];
      const x = BTN_START_X + i * (BTN_W + BTN_GAP);
      const remaining = getCooldownRemaining(blob, btn.action);
      const onCooldown = remaining > 0;

      // Button bg
      ctx.fillStyle = onCooldown ? '#222' : '#2a2a5a';
      ctx.beginPath();
      ctx.roundRect(x, BTN_Y, BTN_W, BTN_H, 10);
      ctx.fill();

      // Border
      ctx.strokeStyle = onCooldown ? '#444' : '#4a4a8a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, BTN_Y, BTN_W, BTN_H, 10);
      ctx.stroke();

      // Label + icon
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (onCooldown) {
        ctx.fillStyle = '#666';
        ctx.font = '18px system-ui, sans-serif';
        ctx.fillText(formatCooldown(remaining), x + BTN_W / 2, BTN_Y + BTN_H / 2);
      } else {
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '22px system-ui, sans-serif';
        ctx.fillText(`${btn.icon} ${btn.label}`, x + BTN_W / 2, BTN_Y + BTN_H / 2);
      }
    }

    // --- Quest progress (placeholder until Step 18) ---
    const questY = BTN_Y + BTN_H + 25;
    const quests = state.quests.active || [];
    if (quests.length > 0) {
      ctx.fillStyle = '#888';
      ctx.font = '18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < quests.length; i++) {
        const q = quests[i];
        const qx = GAME_WIDTH / 2;
        const qy = questY + i * 28;
        ctx.fillText(`${q.name}: ${q.progress || 0}/${q.goal}`, qx, qy);
      }
    } else {
      ctx.fillStyle = '#555';
      ctx.font = '18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Daily quests coming soon', GAME_WIDTH / 2, questY);
    }

    // --- Floating texts ---
    for (const ft of floatingTexts) {
      const alpha = Math.min(1, ft.life / 0.3); // fade out in last 0.3s
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.globalAlpha = 1;
    }

    drawNav(ctx);
  },

  onPointerDown(x, y) {
    if (handleNavTap(x, y)) return;

    const active = getActiveBlob();
    if (!active) return;
    const { id: blobId, blob } = active;

    // --- Blob switcher tap ---
    const state = getState();
    const blobIds = Object.keys(state.blobs);
    if (blobIds.length > 1) {
      const totalW = blobIds.length * (SWITCHER_BLOB_SIZE + SWITCHER_GAP) - SWITCHER_GAP;
      const startX = (GAME_WIDTH - totalW) / 2 + SWITCHER_BLOB_SIZE / 2;

      for (let i = 0; i < blobIds.length; i++) {
        const sx = startX + i * (SWITCHER_BLOB_SIZE + SWITCHER_GAP);
        const dist = Math.sqrt((x - sx) ** 2 + (y - SWITCHER_Y) ** 2);
        if (dist < SWITCHER_BLOB_SIZE / 2 + 10) {
          state.activeBlob = blobIds[i];
          saveState(state);
          // Reset stat bars to new blob's values
          const newBlob = state.blobs[blobIds[i]];
          for (const stat of STAT_ORDER) {
            statBarValues[stat] = newBlob.stats[stat];
          }
          return;
        }
      }
    }

    // --- Care button tap ---
    if (y >= BTN_Y && y <= BTN_Y + BTN_H) {
      for (let i = 0; i < CARE_BTNS.length; i++) {
        const bx = BTN_START_X + i * (BTN_W + BTN_GAP);
        if (x >= bx && x <= bx + BTN_W) {
          const btn = CARE_BTNS[i];
          const result = doCareAction(btn.action, blobId);

          if (result.success) {
            // Animate stat bar
            const updatedBlob = getState().blobs[blobId];
            syncStatBars(updatedBlob);

            // Floating text for stardust
            if (result.stardustReward > 0) {
              addFloatingText(`+${result.stardustReward} \u2726`, GAME_WIDTH / 2 + 100, BLOB_Y - 40);
            }

            // Floating text for stat change
            if (result.statChange > 0) {
              const statName = CARE_ACTIONS[btn.action].stat;
              addFloatingText(
                `+${Math.round(result.statChange)} ${STAT_NAMES[statName]}`,
                GAME_WIDTH / 2 - 100, BLOB_Y - 40,
                STAT_COLORS[statName]
              );
            }

            // Care action animations
            triggerCareAnimation(btn.action);
          }
          return;
        }
      }
    }
  },
};

function triggerCareAnimation(action) {
  switch (action) {
    case 'feed':
      // Blob squashes to 1.15× width (400ms, Elastic)
      blobSquash = createSquash(1.15, 0.87, 0.4, 'elastic');
      break;
    case 'clean':
      // Blob shake (100ms, 3px)
      screenShake(0.1, 3);
      blobSquash = createSquash(0.95, 1.05, 0.3, 'bounce');
      break;
    case 'rest':
      // Blob squashes down 0.7h (600ms, Smooth)
      blobSquash = createSquash(1.1, 0.7, 0.6, 'smooth');
      break;
    case 'pet':
      // Tilt 10° (150ms, Elastic) then return
      blobRotation = 0;
      rotationTween = createTween(0, 0.175, 0.15, 'elastic', (v) => {
        blobRotation = v;
      });
      // Return to 0 after a brief hold
      setTimeout(() => {
        rotationTween = createTween(blobRotation, 0, 0.15, 'smooth', (v) => {
          blobRotation = v;
        });
      }, 200);
      break;
  }
}
