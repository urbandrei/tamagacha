import { initState, loadState, saveState, getState, resetState } from './shared/state.js';
import { initEngine, setScreen } from './shared/engine.js';
import { initRouter, navigate } from './shared/router.js';
import * as care from './systems/care.js';
import * as currency from './systems/currency.js';
import { WELCOME_BACK_THRESHOLD } from './shared/constants.js';
import { welcomeBackScreen, initWelcomeBack } from './screens/welcomeBack.js';
import './style.css';

// Expose helpers on window for console testing
window.tamagacha = { initState, loadState, saveState, getState, resetState, navigate, care, currency };

// Daily login check
currency.checkDailyLogin();

initEngine();

// Welcome-back check (before router mounts default screen)
let showedWelcomeBack = false;
const state = getState();
const elapsedSinceLastSave = Date.now() - (state.player.lastSaveTimestamp || Date.now());
const blobIds = Object.keys(state.blobs);

if (elapsedSinceLastSave >= WELCOME_BACK_THRESHOLD && blobIds.length > 0) {
  // Apply decay to all blobs
  care.applyDecayToAll(elapsedSinceLastSave);

  // Get updated state after decay
  const updated = getState();
  const activeId = updated.activeBlob || blobIds[0];
  const activeBlob = updated.blobs[activeId];

  if (activeBlob) {
    initWelcomeBack(activeId, activeBlob, { ...activeBlob.stats });
    setScreen(welcomeBackScreen);
    showedWelcomeBack = true;
  }
}

// Init router (mounts default screen if welcome-back wasn't shown)
initRouter(showedWelcomeBack);
