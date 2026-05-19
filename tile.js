// tile.js

let specialTiles = [];
let nextSpawnFrame = 0;
let bonusTiles = [];
let redTiles = [];

const BONUS_COLORS = [
  '#FF00FF',
  '#FF6600',
  '#FFFF00',
  '#00FFFF',
  '#FF0099',
  '#FF9900',
  '#00CCFF',
  '#FF33CC',
  '#CCFF00',
  '#00FF00',
];

const BONUS_BOOST_MULTIPLIER = 1.6;
const BONUS_DURATION_FRAMES = 300;

function initTiles(p) {
  specialTiles = [];
  bonusTiles = [];
  redTiles = [];
  scheduleNextSpawn(p);
  _spawnBonusTiles(p);
  _spawnRedTiles(p);
}

function _spawnBonusTiles(p) {
  const total = ROWS * COLS;
  const count = Math.floor(total / 50);
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < 1000) {
    attempts++;
    const r = Math.floor(p.random(2, ROWS - 2));
    const c = Math.floor(p.random(2, COLS - 2));
    if (_isAnyOccupied(r, c)) continue;
    const color = BONUS_COLORS[Math.floor(p.random(BONUS_COLORS.length))];
    bonusTiles.push({ r, c, color, active: true });
    placed++;
  }
}

function _spawnRedTiles(p) {
  let placed = 0;
  let attempts = 0;
  while (placed < 30 && attempts < 1000) {
    attempts++;
    const r = Math.floor(p.random(2, ROWS - 2));
    const c = Math.floor(p.random(2, COLS - 2));
    if (_isAnyOccupied(r, c)) continue;
    redTiles.push({ r, c, active: true });
    placed++;
  }
}

function _isAnyOccupied(r, c) {
  if (bonusTiles.some(t => t.r === r && t.c === c)) return true;
  if (redTiles.some(t => t.r === r && t.c === c)) return true;
  return false;
}

function scheduleNextSpawn(p) {
  const interval = Math.floor(p.random(SPECIAL_TILE_INTERVAL_MIN, SPECIAL_TILE_INTERVAL_MAX));
  nextSpawnFrame = p.frameCount + interval;
}

function updateTiles(p) {
  if (specialTiles.length < MAX_SPECIAL_TILES && p.frameCount >= nextSpawnFrame) {
    spawnSpecialTile(p);
    scheduleNextSpawn(p);
  }
}

const TILE_TYPES_WEIGHTED = [
  TILE_TYPE_BOMB,
  TILE_TYPE_BOMB,
  TILE_TYPE_ZOMBIE_SPAWN,
  TILE_TYPE_ZOMBIE_SPAWN,
  TILE_TYPE_BOOST_STEEL,
];

function spawnSpecialTile(p) {
  let attempts = 0;
  while (attempts < 100) {
    const r = Math.floor(p.random(2, ROWS - 2));
    const c = Math.floor(p.random(2, COLS - 2));
    if (specialTiles.some(t => t.r === r && t.c === c)) { attempts++; continue; }
    if (_isAnyOccupied(r, c)) { attempts++; continue; }
    const type = TILE_TYPES_WEIGHTED[Math.floor(p.random(TILE_TYPES_WEIGHTED.length))];
    specialTiles.push({ r, c, type, spawnFrame: p.frameCount });
    return;
  }
}

function drawTiles(p) {
  const half = TILE_SIZE / 2;

  // special tiles
  for (const tile of specialTiles) {
    const x = tile.c * TILE_SIZE;
    const y = tile.r * TILE_SIZE;
    const blink = Math.sin(p.frameCount * 0.15) > 0;

    p.noStroke();
    switch (tile.type) {
      case TILE_TYPE_BOMB:         p.fill(blink ? '#FF6F00' : '#E65100'); break;
      case TILE_TYPE_ZOMBIE_SPAWN: p.fill(blink ? '#6A1B9A' : '#4A148C'); break;
      case TILE_TYPE_BOOST_STEEL:  p.fill(blink ? '#00838F' : '#006064'); break;
    }
    p.rect(x, y, TILE_SIZE, TILE_SIZE, 3);

    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.fill(255);
    let icon = '';
    switch (tile.type) {
      case TILE_TYPE_BOMB:         icon = '\uD83D\uDCA3'; break;
      case TILE_TYPE_ZOMBIE_SPAWN: icon = '\uD83E\uDDDF'; break;
      case TILE_TYPE_BOOST_STEEL:  icon = '\u26A1'; break;
    }
    p.text(icon, x + half, y + half + 1);
  }

  // bonus tiles
  for (const tile of bonusTiles) {
    if (!tile.active) continue;
    const cx = tile.c * TILE_SIZE + half;
    const cy = tile.r * TILE_SIZE + half;

    const pulse = Math.sin(p.frameCount * 0.18 + tile.r + tile.c) * 2;
    const sz = TILE_SIZE - 2 + pulse;

    const gc = p.color(tile.color);
    gc.setAlpha(55);
    p.fill(gc);
    p.noStroke();
    p.rect(cx - sz / 2 - 4, cy - sz / 2 - 4, sz + 8, sz + 8, 4);

    p.fill(tile.color);
    p.noStroke();
    p.rect(cx - sz / 2, cy - sz / 2, sz, sz, 3);

    p.fill(0, 0, 0, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text('\u2605', cx, cy + 1);
  }

  // red tiles
  for (const tile of redTiles) {
    if (!tile.active) continue;
    const cx = tile.c * TILE_SIZE + half;
    const cy = tile.r * TILE_SIZE + half;

    const pulse = Math.sin(p.frameCount * 0.2 + tile.r * 0.5 + tile.c * 0.5) * 2;
    const sz = TILE_SIZE - 2 + pulse;

    p.noStroke();
    p.fill(255, 0, 0, 50);
    p.rect(cx - sz / 2 - 4, cy - sz / 2 - 4, sz + 8, sz + 8, 4);

    const blink = Math.floor(p.frameCount / 8) % 2 === 0;
    p.fill(blink ? '#FF1744' : '#B71C1C');
    p.noStroke();
    p.rect(cx - sz / 2, cy - sz / 2, sz, sz, 3);

    p.fill(255, 255, 255, 220);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text('\u2620', cx, cy + 1);
  }
}

function checkTilePickup(player, zombies, phase, p) {
  for (let i = specialTiles.length - 1; i >= 0; i--) {
    const tile = specialTiles[i];
    if (tile.r === player.r && tile.c === player.c) {
      applyTileEffect(tile, player, zombies, phase, p);
      specialTiles.splice(i, 1);
    }
  }

  for (let i = bonusTiles.length - 1; i >= 0; i--) {
    const tile = bonusTiles[i];
    if (!tile.active) continue;
    if (tile.r === player.r && tile.c === player.c) {
      player.bonusBoostTimer = BONUS_DURATION_FRAMES;
      player.bonusBoostMultiplier = BONUS_BOOST_MULTIPLIER;
      tile.active = false;
    }
  }

  for (let i = redTiles.length - 1; i >= 0; i--) {
    const tile = redTiles[i];
    if (!tile.active) continue;
    if (tile.r === player.r && tile.c === player.c) {
      let spawnR, spawnC;
      let attempts = 0;
      do {
        spawnR = Math.min(ROWS - 1, Math.max(0, tile.r + Math.floor(p.random(-5, 6))));
        spawnC = Math.min(COLS - 1, Math.max(0, tile.c + Math.floor(p.random(-5, 6))));
        attempts++;
      } while (attempts < 20 && spawnR === player.r && spawnC === player.c);
      zombies.push(new Zombie(spawnR, spawnC));
      tile.active = false;
    }
  }
}

function applyTileEffect(tile, player, zombies, phase, p) {
  switch (tile.type) {
    case TILE_TYPE_BOMB:
      const owner = phase === PHASE_COOP ? OWNER_TEAM : player.owner;
      applyAreaBomb(player.r, player.c, owner);
      player.bombFlash = 20;
      break;
    case TILE_TYPE_ZOMBIE_SPAWN:
      for (let i = 0; i < 3; i++) {
        const spawnR = Math.min(ROWS - 1, Math.max(0, tile.r + Math.floor(p.random(-4, 5))));
        const spawnC = Math.min(COLS - 1, Math.max(0, tile.c + Math.floor(p.random(-4, 5))));
        zombies.push(new Zombie(spawnR, spawnC));
      }
      break;
    case TILE_TYPE_BOOST_STEEL:
      player.boostTimer = BOOST_DURATION;
      player.steelTailTimer = STEEL_TAIL_DURATION;
      break;
  }
}

function removeTileAt(r, c) {
  specialTiles = specialTiles.filter(t => !(t.r === r && t.c === c));
  bonusTiles = bonusTiles.filter(t => !(t.r === r && t.c === c));
  redTiles = redTiles.filter(t => !(t.r === r && t.c === c));
}
