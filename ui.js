function drawUI(p, phase, timeLeft, counts) {
  p.push();
  p.textFont('monospace');

  const hudH = 36;
  p.noStroke();
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_W, hudH);

  const totalTiles = ROWS * COLS;

  const barX = 10, barY = 22, barW = CANVAS_W - 20, barH = 8;

  p.fill(40);
  p.rect(barX, barY, barW, barH, 4);

  if (phase === PHASE_COOP) {
    const w = (counts.team / totalTiles) * barW;
    p.fill(COLOR_TEAM);
    p.rect(barX, barY, w, barH, 4);
  } else {
    const wA = (counts.A / totalTiles) * barW;
    const wB = (counts.B / totalTiles) * barW;
    p.fill(COLOR_A);
    p.rect(barX, barY, wA, barH, 4, 0, 0, 4);
    p.fill(COLOR_B);
    p.rect(barX + barW - wB, barY, wB, barH, 0, 4, 4, 0);
    p.fill(COLOR_A);
    p.textSize(10);
    p.textAlign(p.LEFT, p.CENTER);
    p.text('A: ' + counts.A, barX, 10);
    p.fill(COLOR_B);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text('B: ' + counts.B, barX + barW, 10);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = Math.floor(timeLeft % 60);
  const timeStr = mins + ':' + secs.toString().padStart(2, '0');

  p.textAlign(p.CENTER, p.CENTER);
  if (phase === PHASE_BETRAYAL) {
    p.fill(timeLeft < 10 ? (p.frameCount % 10 < 5 ? '#FF1744' : '#FF8A80') : '#FF5252');
    p.textSize(16);
    p.text('!! BETRAYAL ' + timeStr + ' !!', CANVAS_W / 2, 10);
  } else {
    p.fill(220);
    p.textSize(13);
    p.text(timeStr, CANVAS_W / 2, 10);
  }

  p.textSize(9);
  p.textAlign(p.CENTER, p.BOTTOM);
  if (phase === PHASE_COOP) {
    p.fill('#4CAF50');
    p.text('[ COOP PHASE ]', CANVAS_W / 2, 33);
  } else if (phase === PHASE_BETRAYAL) {
    p.fill('#FF5252');
    p.text('[ BETRAYAL PHASE ]', CANVAS_W / 2, 33);
  }

  if (phase === PHASE_BETRAYAL) {
    const alpha = 80 + Math.sin(p.frameCount * 0.1) * 40;
    p.noFill();
    p.stroke(255, 50, 50, alpha);
    p.strokeWeight(6);
    p.rect(3, 3, CANVAS_W - 6, CANVAS_H - 6, 2);
    p.noStroke();
  }

  _drawPlayerStatus(p, playerA, 10, hudH + 4, 'A');
  _drawPlayerStatus(p, playerB, CANVAS_W - 10, hudH + 4, 'B');

  p.pop();
}

function _drawPlayerStatus(p, player, x, y, label) {
  if (!player) return;
  p.textSize(10);
  p.noStroke();

  const icons = [];
  if (player.boostTimer > 0) icons.push('*BOOST*');
  if (player.steelTailTimer > 0) icons.push('[SHIELD]');

  const col = (label === 'A') ? COLOR_A : COLOR_B;
  p.fill(col);
  p.textAlign(label === 'A' ? p.LEFT : p.RIGHT, p.TOP);
  const statusStr = 'P' + label + ' ' + (!player.alive ? '[DEAD]' : '') + ' ' + icons.join('');
  p.text(statusStr, x, y);
}

function drawResultScreen(p, counts, winner) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_W, CANVAS_H);

  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;

  p.fill(20, 20, 30, 240);
  p.stroke(80);
  p.strokeWeight(1);
  p.rect(cx - 180, cy - 120, 360, 240, 12);

  p.noStroke();

  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(22);
  p.fill(255);
  p.text('GAME OVER', cx, cy - 90);

  p.textSize(32);
  if (winner === 'A') {
    p.fill(COLOR_A);
    p.text('Player A Wins!', cx, cy - 40);
  } else if (winner === 'B') {
    p.fill(COLOR_B);
    p.text('Player B Wins!', cx, cy - 40);
  } else if (winner === 'draw') {
    p.fill('#FFD600');
    p.text('DRAW!', cx, cy - 40);
  } else if (winner === 'zombie') {
    p.fill('#AB47BC');
    p.text('ZOMBIES WIN...', cx, cy - 40);
  }

  p.textSize(14);
  p.fill(COLOR_A);
  p.text('A: ' + counts.A + ' tiles', cx, cy + 10);
  p.fill(COLOR_B);
  p.text('B: ' + counts.B + ' tiles', cx, cy + 32);

  p.fill(50, 50, 70);
  p.stroke(120);
  p.strokeWeight(1);
  p.rect(cx - 70, cy + 65, 140, 36, 8);
  p.noStroke();
  p.fill(200);
  p.textSize(14);
  p.text('Restart (R)', cx, cy + 84);
}

let betrayalAnnounceFade = 0;

function showBetrayalAnnounce(p) {
  betrayalAnnounceFade = 90;
}

function drawBetrayalAnnounce(p) {
  if (betrayalAnnounceFade <= 0) return;
  betrayalAnnounceFade--;
  const alpha = Math.min(255, betrayalAnnounceFade * 4);
  p.fill(200, 0, 0, alpha);
  p.noStroke();
  p.rect(0, CANVAS_H / 2 - 40, CANVAS_W, 80);
  p.fill(255, 255, 255, alpha);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28);
  p.text('!! BETRAYAL TIMER ACTIVATED !!', CANVAS_W / 2, CANVAS_H / 2);
  p.textSize(14);
  p.text('Your teammate is now your enemy!', CANVAS_W / 2, CANVAS_H / 2 + 24);
}

function drawLobby(p) {
  p.background(10, 26, 10);

  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;

  p.textAlign(p.CENTER, p.CENTER);

  p.textSize(48);
  p.fill('#FF1744');
  p.text('ZOMBIE SLIDE', cx, cy - 130);

  p.textSize(36);
  p.fill('#FF1744');
  p.text('DOU', cx, cy - 75);

  p.textSize(14);
  p.fill(180);
  p.text('2P Coop -> Betrayal Territory Game', cx, cy - 25);

  p.textSize(13);
  p.fill(COLOR_A);
  p.text('Player A: W A S D', cx - 120, cy + 25);
  p.fill(COLOR_B);
  p.text('Player B: Arrow Keys', cx + 120, cy + 25);

  p.textSize(12);
  p.fill(160);
  p.text('Coop Phase: Work together against zombies', cx, cy + 65);
  p.text('Betrayal Phase: Last 1 min, most territory wins!', cx, cy + 87);

  p.textSize(11);
  p.fill(255, 165, 0);
  p.text('\uD83D\uDCA3 Area Bomb  |  \uD83E\uDDDF Zombie Spawn  |  \u26A1 Speed x2 + Steel Tail', cx, cy + 120);

  const blink = Math.floor(p.frameCount / 20) % 2 === 0;
  p.fill(blink ? '#4CAF50' : '#2E7D32');
  p.noStroke();
  p.rect(cx - 90, cy + 150, 180, 44, 10);
  p.fill(255);
  p.textSize(16);
  p.text('START (SPACE)', cx, cy + 173);
}
