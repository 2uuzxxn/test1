const TILE_SIZE = 20;
const COLS = 126;
const ROWS = 126;
const CANVAS_W = COLS * TILE_SIZE;
const CANVAS_H = ROWS * TILE_SIZE;

const GAME_TOTAL_TIME = 180;
const BETRAYAL_TRIGGER_TIME = 60;

const PLAYER_SPEED = 5.6;
const BOOST_MULTIPLIER = 2.0;
const BOOST_DURATION = 600;
const STEEL_TAIL_DURATION = 300;

const ZOMBIE_COUNT = 6;
const ZOMBIE_SPEED = 2.8;
const ZOMBIE_RANDOM_CHANCE = 0.03;

const SPECIAL_TILE_INTERVAL_MIN = 450;
const SPECIAL_TILE_INTERVAL_MAX = 900;
const MAX_SPECIAL_TILES = 4;

const BOMB_RADIUS = 3;

const OWNER_NONE = null;
const OWNER_TEAM = 'team';
const OWNER_A = 'A';
const OWNER_B = 'B';
const OWNER_ZOMBIE = 'Z';

const TILE_TYPE_NORMAL = 'normal';
const TILE_TYPE_BOMB = 'bomb';
const TILE_TYPE_ZOMBIE_SPAWN = 'zombie_spawn';
const TILE_TYPE_BOOST_STEEL = 'boost_steel';

const PHASE_LOBBY = 'lobby';
const PHASE_COOP = 'coop';
const PHASE_BETRAYAL = 'betrayal';
const PHASE_END = 'end';

const COLOR_TEAM   = '#4CAF50';
const COLOR_A      = '#E53935';
const COLOR_B      = '#1E88E5';
const COLOR_ZOMBIE = '#7B1FA2';
const COLOR_EMPTY  = '#0a1a0a';
const COLOR_GRID   = '#0d2b0d';

const FRAME_RATE = 30;
