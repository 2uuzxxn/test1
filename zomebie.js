// zombie.js
// - 꼬리(줄)를 끊겨야만 죽음
// - 자신의 땅 영역 보유 가능
// - 계속 생성됨 (최대 수 유지)
// - 플레이어 줄을 끊어도 좀비는 죽지 않음

let zombieBloodTimer = 0;
let zombieSpawnTimer = 0;
const ZOMBIE_SPAWN_INTERVAL = 300; // 10초마다 좀비 추가 생성
const ZOMBIE_MAX = 12;             // 최대 좀비 수

class Zombie {
  constructor(r, c) {
    this.r = r;
    this.c = c;
    this.dr = 0;
    this.dc = 1;
    this.moveAccum = 0;
    this.tail = [];
    this.alive = true;
    
    // 영역 확장을 위한 변수 [cite: 46]
    this.patrolTarget = null; [cite: 46]
    this.patrolTimer = 0; [cite: 46]
  }

  get speed() {
    return zombieBloodTimer > 0 ? ZOMBIE_SPEED_BOOSTED : ZOMBIE_SPEED_NORMAL;
  }

  update(players, p) {
    if (!this.alive) return;
    this.moveAccum += this.speed / FRAME_RATE;
    while (this.moveAccum >= 1) {
      this.moveAccum -= 1;
      this._step(players, p);
      if (!this.alive) return;
    }
  }

  _step(players, p) {
    // 1. 귀환 본능: 꼬리가 길어지면 자기 영역으로 회귀 [cite: 42, 48]
    let isHeadingHome = false;
    let targetR = this.r;
    let targetC = this.c;

    if (this.tail.length >= 6) { [cite: 42, 48]
      let minHomeDist = Infinity;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (getOwner(r, c) === OWNER_ZOMBIE) {
            let d = Math.abs(r - this.r) + Math.abs(c - this.c);
            if (d < minHomeDist) {
              minHomeDist = d;
              targetR = r;
              targetC = c;
              isHeadingHome = true; [cite: 48]
            }
          }
        }
      }
    }

    // 2. 확장 순찰 AI 구동 [cite: 41, 46]
    if (!isHeadingHome) {
      this.patrolTimer--;
      if (!this.patrolTarget || this.patrolTimer <= 0 || (this.r === this.patrolTarget.r && this.c === this.patrolTarget.c)) {
        let attempts = 0;
        while (attempts < 20) {
          let rr = Math.floor(p.random(1, ROWS - 1));
          let cc = Math.floor(p.random(1, COLS - 1));
          if (getOwner(rr, cc) !== OWNER_ZOMBIE) {
            this.patrolTarget = { r: rr, c: cc }; [cite: 46]
            break;
          }
          attempts++;
        }
        this.patrolTimer = Math.floor(p.random(45, 90));
      }

      if (p.random() < 0.6 && this.patrolTarget) {
        targetR = this.patrolTarget.r;
        targetC = this.patrolTarget.c;
      } else {
        let minDist = Infinity;
        for (const pl of players) {
          if (!pl.alive) continue;
          const targets = pl.tail.length > 0 ? pl.tail : [{ r: pl.r, c: pl.c }];
          for (const t of targets) {
            const d = Math.abs(t.r - this.r) + Math.abs(t.c - this.c);
            if (d < minDist) { minDist = d; targetR = t.r; targetC = t.c; }
          }
        }
      }
    }

    // 3. 방향 전환 및 다각형 그리기 유도 [cite: 43]
    if (p.random() < 0.15) { 
      this._randomDir(p);
    } else {
      const dr = Math.sign(targetR - this.r);
      const dc = Math.sign(targetC - this.c);

      if (dr !== 0 && dc !== 0) {
        if (p.random() < 0.5) {
          if (dr !== -this.dr) { this.dr = dr; this.dc = 0; }
        } else {
          if (dc !== -this.dc) { this.dr = 0; this.dc = dc; }
        }
      } else if (dr !== 0 && dr !== -this.dr) {
        this.dr = dr; this.dc = 0;
      } else if (dc !== 0 && dc !== -this.dc) {
        this.dr = 0; this.dc = dc;
      }
    }

    const nr = this.r + this.dr;
    const nc = this.c + this.dc;

    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      this._randomDir(p);
      return;
    }

    const isOnOwned = getOwner(this.r, this.c) === OWNER_ZOMBIE;
    if (isOnOwned) {
      if (this.tail.length > 0) {
        const tailSet = new Set(this.tail.map(t => `${t.r},${t.c}`));
        floodFillEnclosed(tailSet, OWNER_ZOMBIE, p); [cite: 49]
        this.tail = [];
      }
    } else {
      this.tail.push({ r: this.r, c: this.c });
    }

    for (const pl of players) {
      if (!pl.alive) continue;
      const hitIdx = pl.tail.findIndex(t => t.r === nr && t.c === nc);
      if (hitIdx !== -1) {
        pl._cutTailAt(nr, nc);
      }
    }

    this.r = nr;
    this.c = nc;
  }

  cutTailAt(r, c) {
    const idx = this.tail.findIndex(t => t.r === r && t.c === c);
    if (idx !== -1) {
      for (let i = idx; i < this.tail.length; i++) {
        setOwner(this.tail[i].r, this.tail[i].c, OWNER_NONE);
      }
      this.tail.splice(idx);
      this._die();
    }
  }

  _die() {
    this.alive = false;
    for (const t of this.tail) setOwner(t.r, t.c, OWNER_NONE);
    this.tail = [];
  }

  _randomDir(p) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    const validDirs = dirs.filter(d => !(d[0] === -this.dr && d[1] === -this.dc));
    const d = validDirs[Math.floor(p.random(validDirs.length))];
    this.dr = d[0]; this.dc = d[1];
  }

  draw(p) {
    if (!this.alive) return;
    p.noStroke();
    p.fill(zombieBloodTimer > 0 ? p.color(200,0,0,160) : p.color(120,50,180,160));
    for (const t of this.tail) {
      p.rect(t.c*TILE_SIZE+2, t.r*TILE_SIZE+2, TILE_SIZE-4, TILE_SIZE-4, 1);
    }
    const x = this.c*TILE_SIZE, y = this.r*TILE_SIZE;
    p.fill(zombieBloodTimer > 0 ? '#E53935' : '#AB47BC');
    p.noStroke();
    p.rect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2, 3);
    p.fill(255, 50, 50);
    p.ellipse(x+4, y+4, 2, 2);
    p.ellipse(x+TILE_SIZE-4, y+4, 2, 2);
  }
}

let zombies = [];

function createZombieInitialArea(startR, startC) {
  for (let r = startR; r < startR + 2; r++) {
    for (let c = startC; c < startC + 2; c++) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        setOwner(r, c, OWNER_ZOMBIE);
      }
    }
  }
}

function initZombies() {
  zombies = [];
  zombieBloodTimer = 0;
  zombieSpawnTimer = 0;
  
  // 고정 숫자를 상수 기반 연산으로 수정하여 인덱스 에러 원천 차단!
  const pos = [
    [3, 3],
    [3, COLS - 4],
    [ROWS - 4, 3],
    [ROWS - 4, COLS - 4],
    [Math.floor(ROWS / 2), 3],
    [3, Math.floor(COLS / 2)]
  ];
  
  for (let i = 0; i < Math.min(ZOMBIE_COUNT, pos.length); i++) {
    const r = pos[i][0];
    const c = pos[i][1];
    zombies.push(new Zombie(r, c));
    createZombieInitialArea(r, c); [cite: 6]
  }
}

function updateZombies(players, p) {
  if (zombieBloodTimer > 0) zombieBloodTimer--;

  zombieSpawnTimer++;
  if (zombieSpawnTimer >= ZOMBIE_SPAWN_INTERVAL && zombies.length < ZOMBIE_MAX) {
    zombieSpawnTimer = 0;
    _spawnZombie(p);
  }

  for (const z of zombies) z.update(players, p);

  for (let i = zombies.length-1; i >= 0; i--) {
    if (!zombies[i].alive) zombies.splice(i, 1);
  }
}

function _spawnZombie(p) {
  const corners = [
    [Math.floor(p.random(2,6)), Math.floor(p.random(2,6))],
    [Math.floor(p.random(2,6)), Math.floor(p.random(COLS-6, COLS-2))],
    [Math.floor(p.random(ROWS-6,ROWS-2)), Math.floor(p.random(2,6))],
    [Math.floor(p.random(ROWS-6,ROWS-2)), Math.floor(p.random(COLS-6,COLS-2))],
  ];
  const pos = corners[Math.floor(p.random(corners.length))];
  zombies.push(new Zombie(pos[0], pos[1]));
  createZombieInitialArea(pos[0], pos[1]); [cite: 6]
}

function drawZombies(p) {
  for (const z of zombies) z.draw(p);
}
