// Pull result screen — 4-phase animation, result card

import { GAME_WIDTH, GAME_HEIGHT } from '../shared/engine.js';
import { drawNav, handleNavTap } from '../shared/router.js';

export const pullResultScreen = {
  render(ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#e0e0e0';
    ctx.font = '24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Pull Result', GAME_WIDTH / 2, GAME_HEIGHT / 2);

    drawNav(ctx);
  },

  onPointerDown(x, y) {
    handleNavTap(x, y);
  },
};
