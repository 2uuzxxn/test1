// player.js

class Player {
  constructor(id, startR, startC, keyUp, keyDown, keyLeft, keyRight) {
    this.id = id;
    this.r = startR;
    this.c = startC;
    this.dr = 0;
    this.dc = 0;
    this.nextDr = 0;
    this.nextDc = 0;

    this.keys = { up: keyUp, down: keyDown, left: keyLeft, right: keyRight };

    this.alive = true;
    this.tail = [];
    this.owner = OWNER_TEAM;

    this.boostTimer = 0;
    this.steelTailTimer = 0;
    this.bombFlash = 0;
    this.moveAccum = 0;

    this.bonusBoostTimer = 0;
    this.bonusBoostMultiplier = 1.6;

    this.color = (id === 'A') ? COLOR_A : COLOR_B;
    this.teamColor = COLOR_TEAM;
  }

  get displayColor() {
    if (this.owner === OWNER_TEAM) return COLOR_TEAM;
    return (this.id === 'A') ? COLOR_A : COLOR_B;
  }

  setPhase(phase) {
    if (phase === PHASE_COOP) {
      this.owner = OWNER_TEAM;
    } else {
      this.owner = (this.id === 'A') ? OWNER_A : OWNER_B;
    }
  }

  handleKeyPressed(kc) {
    if (kc === this.keys.up    && this.dr !== 1)  { this.nextDr = -1; this.nextDc = 0; }
    if (kc === this.keys.down  && this.dr !== -1) { this.nextDr = 1;  this.nextDc = 0; }
    if (kc === this.keys.left  && this.dc !== 1)  { this.nextDr = 0;  this.nextDc = -1; }
    if (kc === this.keys.right && this.dc !== -1) { this.nextDr = 0;  this.nextDc = 1; }
  }

  get speed() {
    let base = PLAYER_SPEED;
    if (this.boostTimer > 0) base *= BOOST_MULTIPLIER;
    if (this.bonusBoostTimer > 0) base *= this.bonusBoostMultiplier;
    return base;
  }

  get isTailInvincible() {
    return this.steelTailTimer > 0 || this.bonusBoostTimer > 0;
  }

  update(otherPlayer, zombies, phase, p) {
    if (!this.alive) return;
    if (this.boostTimer > 0) this.boostTimer--;
    if (this.steelTailTimer > 0) this.steelTailTimer--;
    if (this.bombFlash > 0) this.bombFlash--;
    if (this.bonusBoostTimer > 0) this.bonusBoostTimer--;

    this.moveAccum += this.speed / FRAME_RATE;
    while (this.moveAccum >= 1) {
      this.moveAccum -= 1;
      this._step(otherPlayer, zombies, phase, p);
      if (!this.alive) return;
    }
    checkTilePickup(this, zombies, phase, p);
  }

  _step(otherPlayer, zombies, phase, p) {
    this.dr = this.nextDr;
    this.dc = this.nextDc;
    if (this.dr === 0 && this.dc === 0) return;

    const nr = this.r + this.dr;
    const nc = this.c + this.dc;

    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      this._die(); return;
    }

    const currentOwner = getOwner(this.r, this.c);
    const onOwnedTile = (currentOwner === this.owner);

    if (onOwnedTile) {
      if (this.tail.length > 0) {
        const tailSet = new Set(this.tail.map(t => `${t.r},${t.c}`));
        floodFillEnclosed(tailSet, this.owner, p);
        this.tail = [];
      }
    } else {
      this.tail.push({ r: this.r, c: this.c });
    }

    if (this.tail.some(t => t.r === nr && t.c === nc)) {
      if (!this.isTailInvincible) {
        this._die(); return;
      }
    }

    if (otherPlayer && otherPlayer.alive) {
      const hitsOtherTail = otherPlayer.tail.some(t => t.r === nr && t.c === nc);
      if (hitsOtherTail) {
        if (this.isTailInvincible && !otherPlayer.isTailInvincible) {
          otherPlayer._cutTailAt(nr, nc);
        } else if (otherPlayer.isTailInvincible) {
          this._die(); return;
        } else {
          otherPlayer._cutTailAt(nr, nc);
        }
      }
    }

    for (const z of zombies) {
      if (!z.alive) continue;
      if (z.r === nr && z.c === nc) { this._die(); return; }
      if (z.tail.some(t => t.r === nr && t.c === nc)) { this._die(); return; }
    }

    this.r = nr;
    this.c = nc;
  }

  _cutTailAt(r, c) {
    const idx = this.tail.findIndex(t => t.r === r && t.c === c);
    if (idx !== -1) {
      for (let i = idx; i < this.tail.length; i++) {
        setOwner(this.tail[i].r, this.tail[i].c, OWNER_NONE);
      }
      this.tail.splice(idx);
    }
  }

  _die() {
    this.alive = false;
    for (const t of this.tail) setOwner(t.r, t.c, OWNER_NONE);
    this.tail = [];
  }

  draw(p) {
    if (!this.alive) return;

    const half = TILE_SIZE / 2;

    let tailCol = this.displayColor;
    if (this.steelTailTimer > 0) tailCol = '#B0BEC5';
    else if (this.bonusBoostTimer > 0) tailCol = '#FFFFFF';

    p.noStroke();
    for (const t of this.tail) {
      p.fill(tailCol);
      p.rect(t.c * TILE_SIZE + 3, t.r * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6, 2);
    }

    const x = this.c * TILE_SIZE;
    const y = this.r * TILE_SIZE;

    if (this.bonusBoostTimer > 0) {
      const glowAlpha = 60 + Math.sin(p.frameCount * 0.3) * 30;
      p.fill(255, 255, 0, glowAlpha);
      p.noStroke();
      p.rect(x - 4, y - 4, TILE_SIZE + 8, TILE_SIZE + 8, 6);
    }

    if (this.boostTimer > 0) {
      p.fill(0, 230, 230, 60);
      p.noStroke();
      p.rect(x - 3, y - 3, TILE_SIZE + 6, TILE_SIZE + 6, 6);
    }

    if (this.bombFlash > 0 && Math.floor(p.frameCount / 3) % 2 === 0) {
      p.fill(255, 200, 0, 120);
      p.noStroke();
      p.rect(x - 4, y - 4, TILE_SIZE + 8, TILE_SIZE + 8, 6);
    }

    p.fill(this.displayColor);
    p.noStroke();
    p.rect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 5);

    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.id, x + half, y + half);

    if (this.steelTailTimer > 0) {
      p.fill(255, 255, 255, 200);
      p.textSize(7);
      p.text('S', x + TILE_SIZE - 4, y + 4);
    }

    if (this.bonusBoostTimer > 0) {
      p.fill(255, 255, 0, 230);
      p.textSize(7);
      p.text('\u2605', x + 4, y + 4);
    }
  }
}

let playerA, playerB;

function initPlayers() {
  const midR = Math.floor(ROWS / 2);
  const midC = Math.floor(COLS / 2);

  playerA = new Player('A', midR, midC - 2, 87, 83, 65, 68);
  playerB = new Player('B', midR, midC + 2, 38, 40, 37, 39);

  for (let r = midR - 2; r <= midR + 2; r++)
    for (let c = midC - 4; c <= midC + 4; c++)
      setOwner(r, c, OWNER_TEAM);
}
