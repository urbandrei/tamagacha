// Router — hash-based screen switching for canvas screens

import { setScreen, GAME_WIDTH, GAME_HEIGHT } from './engine.js';
import { homeScreen } from '../screens/home.js';
import { gachaScreen } from '../screens/gacha.js';
import { pullResultScreen } from '../screens/pullResult.js';
import { blobDetailScreen } from '../screens/blobDetail.js';
import { miniGameSelectScreen } from '../screens/miniGameSelect.js';
import { miniGameResultScreen } from '../screens/miniGameResult.js';
import { collectionScreen } from '../screens/collection.js';
import { settingsScreen } from '../screens/settings.js';

const routes = {
  '#home':             homeScreen,
  '#gacha':            gachaScreen,
  '#pull-result':      pullResultScreen,
  '#blob-detail':      blobDetailScreen,
  '#mini-game-select': miniGameSelectScreen,
  '#mini-game-result': miniGameResultScreen,
  '#collection':       collectionScreen,
  '#settings':         settingsScreen,
};

// Nav items drawn at the bottom of every screen
export const NAV_ITEMS = [
  { hash: '#home',             label: 'Home' },
  { hash: '#gacha',            label: 'Gacha' },
  { hash: '#mini-game-select', label: 'Games' },
  { hash: '#collection',       label: 'Collection' },
  { hash: '#settings',         label: 'Settings' },
];

export const NAV_HEIGHT = 56;

export function navigate(hash) {
  window.location.hash = hash;
}

export function currentRoute() {
  return window.location.hash || '#home';
}

function mountScreen() {
  const hash = currentRoute();
  const screen = routes[hash];

  if (screen) {
    setScreen(screen);
  } else {
    navigate('#home');
  }
}

// Draw the bottom nav bar — call this from each screen's render()
export function drawNav(ctx) {
  const y = GAME_HEIGHT - NAV_HEIGHT;
  const btnW = GAME_WIDTH / NAV_ITEMS.length;
  const active = currentRoute();

  // Background
  ctx.fillStyle = '#16162a';
  ctx.fillRect(0, y, GAME_WIDTH, NAV_HEIGHT);

  // Top border
  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(GAME_WIDTH, y);
  ctx.stroke();

  // Buttons
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '20px system-ui, sans-serif';

  NAV_ITEMS.forEach((item, i) => {
    const isActive = item.hash === active;
    ctx.fillStyle = isActive ? '#e0e0e0' : '#666';
    if (isActive) ctx.font = 'bold 20px system-ui, sans-serif';
    else ctx.font = '20px system-ui, sans-serif';

    ctx.fillText(item.label, btnW * i + btnW / 2, y + NAV_HEIGHT / 2);
  });
}

// Hit-test the nav bar — call from screen's onPointerDown
export function handleNavTap(x, y) {
  const navY = GAME_HEIGHT - NAV_HEIGHT;
  if (y < navY) return false;

  const btnW = GAME_WIDTH / NAV_ITEMS.length;
  const index = Math.floor(x / btnW);
  if (index >= 0 && index < NAV_ITEMS.length) {
    navigate(NAV_ITEMS[index].hash);
    return true;
  }
  return false;
}

export function initRouter(skipInitialMount = false) {
  window.addEventListener('hashchange', mountScreen);
  if (!skipInitialMount) mountScreen();
}
