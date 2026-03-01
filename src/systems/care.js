// Care system — stat decay, care actions, dormancy

import {
  DECAY_RATES, STAT_FLOORS, DORMANCY_THRESHOLD, CARE_ACTIONS,
} from '../shared/constants.js';
import { getState, saveState } from '../shared/state.js';
import { addStardust } from './currency.js';

// --- Helpers ---

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getBlob(blobId) {
  const state = getState();
  return state.blobs[blobId] || null;
}

// --- Stat decay ---

export function applyDecay(blob, elapsedMs) {
  if (blob.isDormant) return;

  const hours = elapsedMs / (60 * 60 * 1000);

  for (const stat of Object.keys(DECAY_RATES)) {
    const floor = STAT_FLOORS[stat] ?? 0;
    blob.stats[stat] = clamp(
      blob.stats[stat] + DECAY_RATES[stat] * hours,
      floor,
      100
    );
  }
}

// --- Dormancy ---

export function checkDormancy(blob) {
  let floored = 0;
  for (const stat of Object.keys(STAT_FLOORS)) {
    if (blob.stats[stat] <= STAT_FLOORS[stat]) {
      floored++;
    }
  }
  if (floored >= DORMANCY_THRESHOLD) {
    blob.isDormant = true;
    return true;
  }
  return false;
}

export function wakeDormantBlob(blob) {
  blob.isDormant = false;
}

// --- Care actions ---

function isCooldownReady(blob, action) {
  const expiry = (blob.cooldowns && blob.cooldowns[action]) || 0;
  return Date.now() >= expiry;
}

function setCooldown(blob, action) {
  if (!blob.cooldowns) blob.cooldowns = {};
  blob.cooldowns[action] = Date.now() + CARE_ACTIONS[action].cooldown;
}

export function getCooldownRemaining(blob, action) {
  const expiry = (blob.cooldowns && blob.cooldowns[action]) || 0;
  return Math.max(0, expiry - Date.now());
}

/**
 * Perform a care action on a blob.
 * Returns { success, reason?, statChange?, stardustReward? }
 */
export function doCareAction(actionName, blobId) {
  const config = CARE_ACTIONS[actionName];
  if (!config) return { success: false, reason: 'unknown_action' };

  const state = getState();
  const blob = state.blobs[blobId];
  if (!blob) return { success: false, reason: 'blob_not_found' };

  // Cooldown check
  if (!isCooldownReady(blob, actionName)) {
    return { success: false, reason: 'cooldown', remaining: getCooldownRemaining(blob, actionName) };
  }

  // Play is a stub — effect set by mini-game result later
  if (actionName === 'play') {
    setCooldown(blob, actionName);
    saveState(state);
    return { success: true, statChange: 0, stardustReward: 0 };
  }

  // Wake dormant blob on any care action
  if (blob.isDormant) {
    wakeDormantBlob(blob);
  }

  // Apply stat effect
  const prevStat = blob.stats[config.stat];
  blob.stats[config.stat] = clamp(blob.stats[config.stat] + config.effect, 0, 100);
  const statChange = blob.stats[config.stat] - prevStat;

  // Apply bond bonus
  blob.stats.bond = clamp(blob.stats.bond + config.bondBonus, 0, 100);

  // Set cooldown
  setCooldown(blob, actionName);

  // Save state, then grant Stardust (addStardust saves again)
  saveState(state);
  if (config.stardust > 0) {
    addStardust(config.stardust);
  }

  return {
    success: true,
    statChange,
    stardustReward: config.stardust,
  };
}

// Convenience wrappers
export function feed(blobId) { return doCareAction('feed', blobId); }
export function play(blobId) { return doCareAction('play', blobId); }
export function clean(blobId) { return doCareAction('clean', blobId); }
export function rest(blobId) { return doCareAction('rest', blobId); }
export function pet(blobId) { return doCareAction('pet', blobId); }

// --- Apply decay to all blobs (used by welcome-back) ---

export function applyDecayToAll(elapsedMs) {
  const state = getState();
  for (const blobId of Object.keys(state.blobs)) {
    applyDecay(state.blobs[blobId], elapsedMs);
    checkDormancy(state.blobs[blobId]);
  }
  saveState(state);
}
