// Currency system — Stardust add/spend, daily login

import { DAILY_LOGIN_REWARD } from '../shared/constants.js';
import { getState, saveState } from '../shared/state.js';

export function getBalance() {
  return getState().player.stardust;
}

export function addStardust(amount) {
  const state = getState();
  state.player.stardust += amount;
  saveState(state);
  return state.player.stardust;
}

export function spendStardust(amount) {
  const state = getState();
  if (state.player.stardust < amount) return false;
  state.player.stardust -= amount;
  saveState(state);
  return true;
}

export function checkDailyLogin() {
  const state = getState();
  const today = new Date().toDateString();

  if (state.player.lastLoginDate === today) return false;

  state.player.lastLoginDate = today;
  state.player.totalLogins++;
  state.player.stardust += DAILY_LOGIN_REWARD;
  saveState(state);
  return true;
}
