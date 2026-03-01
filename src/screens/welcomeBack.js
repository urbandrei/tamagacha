// Welcome-back overlay — shown after 1hr+ away

import { GAME_WIDTH, GAME_HEIGHT } from '../shared/engine.js';
import { drawBlob, drawBlobExpression } from '../render/blob.js';
import { getState } from '../shared/state.js';
import { STAT_FLOORS } from '../shared/constants.js';
import { doCareAction } from '../systems/care.js';
import { navigate } from '../shared/router.js';

let elapsed = 0;
let decayedStats = null;   // snapshot of stats after decay
let blobName = '';
let blobId = null;
let blobData = null;
let mostUrgentAction = null;

const STAT_NAMES = {
  hunger: 'Hunger', happiness: 'Happiness', energy: 'Energy',
  cleanliness: 'Cleanliness', bond: 'Bond',
};

const STAT_COLORS = {
  hunger: '#ff6b6b', happiness: '#ffd93d', energy: '#6bcb77',
  cleanliness: '#4d96ff', bond: '#ff6eb4',
};

const STAT_TO_ACTION = {
  hunger: 'feed', happiness: 'pet', energy: 'rest',
  cleanliness: 'clean', bond: 'pet',
};

const STAT_ORDER = ['hunger', 'happiness', 'energy', 'cleanliness', 'bond'];

// Button layout
const BTN_W = 300;
const BTN_H = 65;
const BTN_X = (GAME_WIDTH - BTN_W) / 2;
const BTN_Y = 780;

const DISMISS_W = 200;
const DISMISS_H = 50;
const DISMISS_X = (GAME_WIDTH - DISMISS_W) / 2;
const DISMISS_Y = BTN_Y + BTN_H + 25;

function findMostUrgent(stats) {
  let lowest = Infinity;
  let lowestStat = 'hunger';
  for (const stat of STAT_ORDER) {
    const distAboveFloor = stats[stat] - (STAT_FLOORS[stat] ?? 0);
    if (distAboveFloor < lowest) {
      lowest = distAboveFloor;
      lowestStat = stat;
    }
  }
  return STAT_TO_ACTION[lowestStat];
}

function lowestStatValue(stats) {
  let min = 100;
  for (const stat of STAT_ORDER) {
    if (stats[stat] < min) min = stats[stat];
  }
  return min;
}

export function initWelcomeBack(id, blob, statsSnapshot) {
  blobId = id;
  blobData = blob;
  blobName = blob.name || 'Your blob';
  decayedStats = { ...statsSnapshot };
  mostUrgentAction = findMostUrgent(statsSnapshot);
}

export const welcomeBackScreen = {
  enter() {
    elapsed = 0;
  },

  update(dt) {
    elapsed += dt;
  },

  render(ctx) {
    // Dim background
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Soft radial glow
    const glow = ctx.createRadialGradient(
      GAME_WIDTH / 2, 400, 50,
      GAME_WIDTH / 2, 400, 500,
    );
    glow.addColorStop(0, 'rgba(100, 100, 180, 0.15)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (!blobData || !decayedStats) return;

    // Title
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${blobName} missed you!`, GAME_WIDTH / 2, 120);

    // Blob
    const blobX = GAME_WIDTH / 2;
    const blobY = 310;
    const blobSize = 180;

    drawBlob(ctx, blobX, blobY, {
      shape: blobData.shape, hue: blobData.hue, rarity: blobData.rarity,
      size: blobSize, time: elapsed,
    });
    drawBlobExpression(ctx, blobX, blobY, {
      lowestStat: lowestStatValue(decayedStats),
      isDormant: blobData.isDormant,
      size: blobSize, time: elapsed,
    });

    // Stat summary
    ctx.font = '24px system-ui, sans-serif';
    const summaryY = 480;
    let row = 0;

    for (const stat of STAT_ORDER) {
      const val = Math.round(decayedStats[stat]);
      const floor = STAT_FLOORS[stat];
      const isUrgent = val <= floor + 10;

      const y = summaryY + row * 38;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#aaa';
      ctx.fillText(`${STAT_NAMES[stat]}:`, GAME_WIDTH / 2 - 10, y);

      ctx.textAlign = 'left';
      ctx.fillStyle = isUrgent ? '#ff6b6b' : STAT_COLORS[stat];
      ctx.font = isUrgent ? 'bold 24px system-ui, sans-serif' : '24px system-ui, sans-serif';
      ctx.fillText(`${val}`, GAME_WIDTH / 2 + 10, y);
      ctx.font = '24px system-ui, sans-serif';

      row++;
    }

    // "Take Care" button
    ctx.fillStyle = '#3a3a7a';
    ctx.beginPath();
    ctx.roundRect(BTN_X, BTN_Y, BTN_W, BTN_H, 12);
    ctx.fill();

    ctx.strokeStyle = '#6a6aba';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(BTN_X, BTN_Y, BTN_W, BTN_H, 12);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const actionLabel = {
      feed: 'Feed', clean: 'Clean', rest: 'Rest', pet: 'Pet',
    }[mostUrgentAction] || 'Care';
    ctx.fillText(`Take Care (${actionLabel})`, GAME_WIDTH / 2, BTN_Y + BTN_H / 2);

    // Dismiss button
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.roundRect(DISMISS_X, DISMISS_Y, DISMISS_W, DISMISS_H, 8);
    ctx.fill();

    ctx.fillStyle = '#888';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Dismiss', GAME_WIDTH / 2, DISMISS_Y + DISMISS_H / 2);
  },

  onPointerDown(x, y) {
    // "Take Care" button
    if (x >= BTN_X && x <= BTN_X + BTN_W && y >= BTN_Y && y <= BTN_Y + BTN_H) {
      if (blobId && mostUrgentAction) {
        doCareAction(mostUrgentAction, blobId);
      }
      navigate('#home');
      return;
    }

    // Dismiss
    if (x >= DISMISS_X && x <= DISMISS_X + DISMISS_W &&
        y >= DISMISS_Y && y <= DISMISS_Y + DISMISS_H) {
      navigate('#home');
    }
  },
};
