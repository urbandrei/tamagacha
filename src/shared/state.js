const STORAGE_KEY = 'tamagacha_save';

function createFreshState() {
  return {
    version: 1,
    player: {
      stardust: 0,
      totalLogins: 0,
      lastLoginDate: null,
      lastSaveTimestamp: Date.now(),
      ftueCompleted: false,
    },
    blobs: {},
    activeBlob: null,
    gacha: {
      pityCounter: 0,
      pullHistory: [],
    },
    quests: {
      lastRefreshDate: null,
      active: [],
    },
    collection: {
      totalPulls: 0,
      uniqueCount: 0,
    },
    settings: {
      audio: { master: 80, sfx: 100, music: 60 },
      reducedMotion: false,
    },
  };
}

export function initState() {
  const state = createFreshState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function saveState(state) {
  state.player.lastSaveTimestamp = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getState() {
  return loadState() || initState();
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return initState();
}
