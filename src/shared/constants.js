// Rarity tiers and pull rates
export const RARITIES = ['common', 'uncommon', 'rare', 'legendary'];
export const RARITY_RATES = [0.60, 0.30, 0.085, 0.015];

// Gacha
export const PULL_COST = 100;
export const PITY_THRESHOLD = 80;
export const PITY_RARE_CHANCE = 0.85; // 85% rare, 15% legendary at hard pity
export const DUPLICATE_BONUS = 25;
export const PULL_HISTORY_MAX = 20;

// Stat decay rates (per hour)
export const DECAY_RATES = {
  hunger: -3,
  happiness: -4,
  energy: -5,
  cleanliness: -2,
  bond: -0.5,
};

// Stat floors (stats never drop below these)
export const STAT_FLOORS = {
  hunger: 15,
  happiness: 10,
  energy: 20,
  cleanliness: 15,
  bond: 0,
};

// Dormancy triggers when this many stats hit their floor
export const DORMANCY_THRESHOLD = 2;

// Care action effects, cooldowns (ms), and Stardust rewards
export const CARE_ACTIONS = {
  feed: {
    stat: 'hunger',
    effect: 25,
    bondBonus: 1,
    cooldown: 30 * 60 * 1000,   // 30 min
    stardust: 10,
  },
  play: {
    stat: 'happiness',
    // effect set by mini-game result (15–30)
    effect: 0,
    bondBonus: 1,
    cooldown: 15 * 60 * 1000,   // 15 min
    stardust: 0,                 // awarded via game rank
  },
  clean: {
    stat: 'cleanliness',
    effect: 40,
    bondBonus: 1,
    cooldown: 60 * 60 * 1000,   // 1 hr
    stardust: 10,
  },
  rest: {
    stat: 'energy',
    effect: 50,
    bondBonus: 1,
    cooldown: 2 * 60 * 60 * 1000, // 2 hr
    stardust: 10,
  },
  pet: {
    stat: 'happiness',
    effect: 5,
    bondBonus: 3,
    cooldown: 1 * 60 * 1000,    // 1 min
    stardust: 5,
  },
};

// Mini-game rank thresholds and rewards
export const MINI_GAME_RANKS = {
  starCatcher: [
    { rank: 'S', threshold: 90, stardust: 80, happiness: 30 },
    { rank: 'A', threshold: 70, stardust: 60, happiness: 25 },
    { rank: 'B', threshold: 50, stardust: 40, happiness: 20 },
    { rank: 'C', threshold: 0,  stardust: 30, happiness: 15 },
  ],
  bubbleMatch: [
    { rank: 'S', threshold: 2000, stardust: 80, happiness: 30 },
    { rank: 'A', threshold: 1200, stardust: 60, happiness: 25 },
    { rank: 'B', threshold: 600,  stardust: 40, happiness: 20 },
    { rank: 'C', threshold: 0,    stardust: 30, happiness: 15 },
  ],
};

export const MINI_GAME_COOLDOWN = 15 * 60 * 1000; // 15 min

// 12-hue palette
export const HUE_NAMES = [
  'rose', 'coral', 'amber', 'gold', 'lime', 'mint',
  'teal', 'sky', 'indigo', 'violet', 'plum', 'blush',
];

// HSL hue degrees for each named hue
export const HUE_VALUES = {
  rose: 350, coral: 16, amber: 36, gold: 50,
  lime: 82, mint: 150, teal: 174, sky: 200,
  indigo: 240, violet: 270, plum: 300, blush: 330,
};

// Blob shapes
export const SHAPES = ['round', 'tall', 'wide', 'lumpy'];

// Rarity saturation multipliers (%)
export const RARITY_SATURATION = {
  common: 80, uncommon: 100, rare: 110, legendary: 120,
};

// Daily login reward
export const DAILY_LOGIN_REWARD = 50;

// Quest definitions (pool of 7, 3 selected daily)
export const QUEST_POOL = [
  { id: 'dedicated_caretaker', name: 'Dedicated Caretaker', description: 'Feed any blob 3 times', goal: 3, event: 'feed' },
  { id: 'squeaky_clean',       name: 'Squeaky Clean',       description: 'Clean any blob 2 times', goal: 2, event: 'clean' },
  { id: 'best_friend',         name: 'Best Friend',         description: 'Pet any blob 5 times', goal: 5, event: 'pet' },
  { id: 'well_rested',         name: 'Well Rested',         description: 'Rest any blob 1 time', goal: 1, event: 'rest' },
  { id: 'star_player',         name: 'Star Player',         description: 'Complete 2 mini-games', goal: 2, event: 'mini_game_complete' },
  { id: 'high_achiever',       name: 'High Achiever',       description: 'Earn A rank or higher in any mini-game', goal: 1, event: 'mini_game_rank_a' },
  { id: 'social_blob',         name: 'Social Blob',         description: 'Play with 2 different blobs', goal: 2, event: 'play_different_blob' },
];

export const QUEST_REWARD = 30;
export const QUESTS_PER_DAY = 3;

// FTUE starting Stardust
export const FTUE_STARTING_STARDUST = 200;

// Welcome-back threshold (ms)
export const WELCOME_BACK_THRESHOLD = 60 * 60 * 1000; // 1 hour
