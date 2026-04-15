// =============================================================
//  H.E.I.S.T.EXE  —  heist-minigames.js
//  Three DOM-overlay minigames, zero canvas loop while running.
//  runMinigame(index, onComplete) is the only public export.
// =============================================================

// ─── SHARED OVERLAY HELPERS ──────────────────────────────────
function createOverlay(id) {
  const el = document.createElement('div');
  el.id = id;
  el.style.cssText = `
    position:fixed;inset:0;z-index:9600;
    background:rgba(0,0,0,0.93);
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    font-family:'Share Tech Mono',monospace;
    color:#99b0cc;
  `;
  document.getElementById('heist-shell').appendChild(el);
  return el;
}

function removeOverlay(id) {
  document.getElementById(id)?.remove();
}

function mgTitle(text) {
  const h = document.createElement('div');
  h.style.cssText = `font-family:'Orbitron',monospace;font-size:0.7rem;font-weight:900;
    letter-spacing:0.3em;color:#00e87a;margin-bottom:6px;text-transform:uppercase;`;
  h.textContent = text;
  return h;
}
function mgSub(text) {
  const s = document.createElement('div');
  s.style.cssText = `font-size:0.78rem;color:#445577;letter-spacing:0.1em;margin-bottom:18px;text-align:center;`;
  s.textContent = text;
  return s;
}
function mgStatus(el, text, color='#99b0cc') {
  el.style.color = color;
  el.textContent = text;
}

// ─── ROUTER ──────────────────────────────────────────────────
export function runMinigame(index, onComplete) {
  if (index === 0) runSimonSays(onComplete);
  else if (index === 1) runSafeCrack(onComplete);
  else if (index === 2) runLaserGrid(onComplete);
  else onComplete();
}

// =============================================================
//  MINIGAME 1 — SIMON SAYS (after lobby / level 1)
//  3 rounds. 4 coloured pads. Watch the sequence, repeat it.
// =============================================================
function runSimonSays(onComplete) {
  const COLORS = [
    { id:'R', fill:'#cc2244', lit:'#ff4466', label:'RED'   },
    { id:'G', fill:'#007744', lit:'#00e87a', label:'GRN'   },
    { id:'B', fill:'#003399', lit:'#3399ff', label:'BLU'   },
    { id:'Y', fill:'#886600', lit:'#ffcc00', label:'YLW'   },
  ];
  const ROUNDS = 3;
  let sequence = [];
  let playerIdx = 0;
  let locked = true; // no input during playback

  const overlay = createOverlay('mg-simon');

  // Build UI
  overlay.appendChild(mgTitle('// SIGNAL PROTOCOL'));
  overlay.appendChild(mgSub('Memorise the guard frequency pattern. Repeat it back.'));

  const statusEl = document.createElement('div');
  statusEl.style.cssText = `font-size:0.82rem;letter-spacing:0.12em;margin-bottom:20px;min-height:20px;`;
  statusEl.textContent = 'INITIALISING...';
  overlay.appendChild(statusEl);

  const grid = document.createElement('div');
  grid.style.cssText = `display:grid;grid-template-columns:1fr 1fr;gap:12px;`;

  const btns = {};
  COLORS.forEach(c => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      width:110px;height:90px;border:2px solid rgba(255,255,255,0.1);
      background:${c.fill};cursor:pointer;
      font-family:'Orbitron',monospace;font-size:0.6rem;letter-spacing:0.2em;
      color:rgba(255,255,255,0.4);transition:background 0.08s;
    `;
    btn.textContent = c.label;
    btn.dataset.id = c.id;
    btn.addEventListener('click', () => onPadClick(c.id));
    grid.appendChild(btn);
    btns[c.id] = { btn, c };
  });
  overlay.appendChild(grid);

  const roundEl = document.createElement('div');
  roundEl.style.cssText = `margin-top:16px;font-size:0.65rem;color:#2a3a52;letter-spacing:0.15em;`;
  overlay.appendChild(roundEl);

  function lightPad(id, on) {
    const { btn, c } = btns[id];
    btn.style.background = on ? c.lit : c.fill;
    btn.style.color = on ? '#000' : 'rgba(255,255,255,0.4)';
  }

  function playSequence(seq, cb) {
    locked = true;
    let i = 0;
    mgStatus(statusEl, 'WATCH THE PATTERN...', '#ffcc00');
    function next() {
      if (i >= seq.length) { setTimeout(cb, 400); return; }
      const id = seq[i++];
      lightPad(id, true);
      setTimeout(() => { lightPad(id, false); setTimeout(next, 300); }, 500);
    }
    setTimeout(next, 600);
  }

  function startRound() {
    const colorIds = COLORS.map(c => c.id);
    sequence.push(colorIds[Math.floor(Math.random()*4)]);
    playerIdx = 0;
    roundEl.textContent = `ROUND ${sequence.length} / ${ROUNDS}`;
    playSequence(sequence, () => {
      locked = false;
      mgStatus(statusEl, 'YOUR TURN — REPEAT THE SEQUENCE', '#00e87a');
    });
  }

  function onPadClick(id) {
    if (locked) return;
    lightPad(id, true);
    setTimeout(() => lightPad(id, false), 180);
    if (id !== sequence[playerIdx]) {
      locked = true;
      mgStatus(statusEl, 'WRONG SIGNAL — RESTARTING...', '#ff4466');
      sequence = [];
      setTimeout(startRound, 1200);
      return;
    }
    playerIdx++;
    if (playerIdx === sequence.length) {
      locked = true;
      if (sequence.length >= ROUNDS) {
        mgStatus(statusEl, 'SIGNAL MATCHED — ACCESS GRANTED', '#00e87a');
        setTimeout(() => { removeOverlay('mg-simon'); onComplete(); }, 1000);
      } else {
        mgStatus(statusEl, 'CORRECT — NEXT PATTERN...', '#00e87a');
        setTimeout(startRound, 900);
      }
    }
  }

  startRound();
}

// =============================================================
//  MINIGAME 2 — SAFE CRACK (after level 2)
//  Mastermind-lite: guess a 4-digit code (digits 1-6).
//  Feedback: ● correct digit+position, ○ correct digit wrong pos.
//  Max 6 attempts. Each failed attempt costs +5s (penalty text).
// =============================================================
function runSafeCrack(onComplete) {
  const CODE_LEN = 4;
  const DIGITS   = [1,2,3,4,5,6];
  const MAX_TRIES = 6;

  // Generate secret
  const secret = Array.from({length:CODE_LEN}, () => DIGITS[Math.floor(Math.random()*DIGITS.length)]);
  let attempts = 0;
  let timePenalty = 0;

  const overlay = createOverlay('mg-safe');
  overlay.appendChild(mgTitle('// VAULT COMBINATION'));
  overlay.appendChild(mgSub('Deduce the 4-digit code (digits 1–6). ● = right place  ○ = right digit'));

  const statusEl = document.createElement('div');
  statusEl.style.cssText = `font-size:0.8rem;letter-spacing:0.1em;margin-bottom:12px;min-height:20px;color:#99b0cc;`;
  overlay.appendChild(statusEl);

  // History board
  const board = document.createElement('div');
  board.style.cssText = `display:flex;flex-direction:column;gap:5px;margin-bottom:14px;min-height:160px;width:280px;`;
  overlay.appendChild(board);

  // Input row
  const inputRow = document.createElement('div');
  inputRow.style.cssText = `display:flex;gap:8px;align-items:center;`;

  const inputs = [];
  for (let i = 0; i < CODE_LEN; i++) {
    const inp = document.createElement('input');
    inp.type = 'text'; inp.maxLength = 1; inp.inputMode = 'numeric';
    inp.style.cssText = `
      width:40px;height:44px;text-align:center;
      background:#0d1828;border:1px solid #1e2d4a;
      color:#00e87a;font-size:1.4rem;font-family:'Orbitron',monospace;
      outline:none;
    `;
    inp.addEventListener('input', () => {
      const v = inp.value.replace(/[^1-6]/g,'');
      inp.value = v ? v[v.length-1] : '';
      if (inp.value && i < CODE_LEN-1) inputs[i+1].focus();
    });
    inp.addEventListener('keydown', e => {
      if (e.key==='Backspace' && !inp.value && i > 0) inputs[i-1].focus();
      if (e.key==='Enter') guessBtn.click();
    });
    inputRow.appendChild(inp);
    inputs.push(inp);
  }

  const guessBtn = document.createElement('button');
  guessBtn.textContent = 'CHECK';
  guessBtn.style.cssText = `
    padding:10px 16px;background:transparent;
    border:1px solid rgba(0,232,122,0.4);color:#00e87a;
    font-family:'Orbitron',monospace;font-size:0.65rem;
    letter-spacing:0.15em;cursor:pointer;
  `;
  inputRow.appendChild(guessBtn);
  overlay.appendChild(inputRow);

  const penaltyEl = document.createElement('div');
  penaltyEl.style.cssText = `margin-top:10px;font-size:0.7rem;color:#ff4466;letter-spacing:0.1em;min-height:18px;`;
  overlay.appendChild(penaltyEl);

  guessBtn.addEventListener('click', submitGuess);
  inputs[0].focus();

  function submitGuess() {
    const guess = inputs.map(i => parseInt(i.value));
    if (guess.some(isNaN)) { mgStatus(statusEl,'ENTER ALL 4 DIGITS','#ffcc00'); return; }
    attempts++;

    // Score
    let bulls = 0, cows = 0;
    const sCount = {}, gCount = {};
    for (let i=0; i<CODE_LEN; i++) {
      if (guess[i]===secret[i]) { bulls++; }
      else {
        sCount[secret[i]] = (sCount[secret[i]]||0)+1;
        gCount[guess[i]]  = (gCount[guess[i]]||0)+1;
      }
    }
    for (const d in gCount) cows += Math.min(gCount[d], sCount[d]||0);

    // Add row to board
    const row = document.createElement('div');
    row.style.cssText = `display:flex;gap:6px;align-items:center;font-size:0.85rem;`;
    row.innerHTML = `<span style="color:#445577;min-width:28px">#${attempts}</span>
      <span style="color:#d0e0f0;letter-spacing:0.18em">${guess.join(' ')}</span>
      <span style="color:#00e87a;margin-left:6px">${'●'.repeat(bulls)}${'○'.repeat(cows)}${'·'.repeat(CODE_LEN-bulls-cows)}</span>`;
    board.appendChild(row);

    inputs.forEach(i => i.value='');
    inputs[0].focus();

    if (bulls === CODE_LEN) {
      guessBtn.disabled = true;
      mgStatus(statusEl,'VAULT OPEN — ACCESS GRANTED','#00e87a');
      penaltyEl.textContent = '';
      setTimeout(() => { removeOverlay('mg-safe'); onComplete(); }, 1000);
      return;
    }
    if (attempts >= MAX_TRIES) {
      // Reveal and continue anyway (don't block progress, just shame them)
      guessBtn.disabled = true;
      mgStatus(statusEl,`CODE WAS ${secret.join('-')} — BRUTE FORCED +30s`,'#ff4466');
      penaltyEl.textContent = '';
      // Add 30s penalty to run timer by rewinding start time
      window._heistTimePenalty = (window._heistTimePenalty||0) + 30000;
      setTimeout(() => { removeOverlay('mg-safe'); onComplete(); }, 1600);
      return;
    }
    const left = MAX_TRIES - attempts;
    mgStatus(statusEl,`${bulls}● ${cows}○  —  ${left} ATTEMPT${left===1?'':'S'} LEFT`,'#99b0cc');
  }
}

// =============================================================
//  MINIGAME 3 — LASER GRID (after level 3)
//  Navigate GHOST through a static laser grid on a 9x7 tile map.
//  Arrow keys only. Reach the EXIT tile. No enemies.
//  Touch a laser = restart from start (no time penalty).
// =============================================================
function runLaserGrid(onComplete) {
  // Map: 0=floor, 1=wall, 2=laser(H), 3=laser(V), 4=start, 5=exit
  const MAP = [
    [1,1,1,1,1,1,1,1,1],
    [1,4,0,0,1,0,0,0,1],
    [1,0,1,0,2,0,1,0,1],
    [1,0,0,0,1,0,0,0,1],
    [1,0,1,3,0,0,1,0,1],
    [1,0,0,0,0,0,0,5,1],
    [1,1,1,1,1,1,1,1,1],
  ];
  const ROWS = MAP.length, COLS = MAP[0].length;
  const TILE = 56;
  const W = COLS*TILE, H = ROWS*TILE;

  let px = 1, py = 1; // start grid position (col, row)
  // Find start
  outer: for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if(MAP[r][c]===4){py=r;px=c;break outer;}

  const overlay = createOverlay('mg-laser');
  overlay.appendChild(mgTitle('// LASER GRID — VAULT CORRIDOR'));
  overlay.appendChild(mgSub('Navigate to the exit. Avoid laser beams.  ARROW KEYS'));

  const canvasEl = document.createElement('canvas');
  canvasEl.width = W; canvasEl.height = H;
  canvasEl.style.cssText = `border:1px solid #1e2d4a;display:block;`;
  overlay.appendChild(canvasEl);
  const lctx = canvasEl.getContext('2d');

  const statusEl = document.createElement('div');
  statusEl.style.cssText = `margin-top:10px;font-size:0.75rem;color:#445577;letter-spacing:0.1em;min-height:18px;`;
  overlay.appendChild(statusEl);

  function render() {
    lctx.fillStyle = '#000';
    lctx.fillRect(0,0,W,H);
    for (let r=0;r<ROWS;r++) {
      for (let c=0;c<COLS;c++) {
        const t = MAP[r][c];
        const tx = c*TILE, ty = r*TILE;
        if (t===1) {
          lctx.fillStyle = '#0d1828';
          lctx.fillRect(tx,ty,TILE,TILE);
          lctx.strokeStyle = 'rgba(0,180,100,0.2)';
          lctx.lineWidth=1;
          lctx.strokeRect(tx+0.5,ty+0.5,TILE-1,TILE-1);
        } else if (t===2) {
          // Horizontal laser
          lctx.fillStyle = 'rgba(255,30,30,0.12)';
          lctx.fillRect(tx,ty,TILE,TILE);
          lctx.fillStyle = '#ff2222';
          lctx.fillRect(tx, ty+TILE/2-2, TILE, 4);
        } else if (t===3) {
          // Vertical laser
          lctx.fillStyle = 'rgba(255,30,30,0.12)';
          lctx.fillRect(tx,ty,TILE,TILE);
          lctx.fillStyle = '#ff2222';
          lctx.fillRect(tx+TILE/2-2, ty, 4, TILE);
        } else if (t===5) {
          // Exit
          lctx.fillStyle = 'rgba(0,232,122,0.15)';
          lctx.fillRect(tx,ty,TILE,TILE);
          lctx.strokeStyle = '#00e87a';
          lctx.lineWidth=2;
          lctx.strokeRect(tx+1,ty+1,TILE-2,TILE-2);
          lctx.font='bold 10px Orbitron,monospace';
          lctx.fillStyle='#00e87a';
          lctx.textAlign='center';
          lctx.textBaseline='middle';
          lctx.fillText('EXIT',tx+TILE/2,ty+TILE/2);
          lctx.textAlign='left'; lctx.textBaseline='alphabetic';
        } else {
          lctx.fillStyle = '#060a14';
          lctx.fillRect(tx,ty,TILE,TILE);
        }
      }
    }
    // Grid lines
    lctx.strokeStyle = 'rgba(20,40,80,0.3)';
    lctx.lineWidth=0.5;
    lctx.beginPath();
    for (let c=0;c<=COLS;c++){lctx.moveTo(c*TILE,0);lctx.lineTo(c*TILE,H);}
    for (let r=0;r<=ROWS;r++){lctx.moveTo(0,r*TILE);lctx.lineTo(W,r*TILE);}
    lctx.stroke();
    // Player
    lctx.beginPath();
    lctx.arc(px*TILE+TILE/2, py*TILE+TILE/2, TILE*0.28, 0, Math.PI*2);
    lctx.fillStyle='#00e87a';
    lctx.fill();
  }

  function tryMove(dc, dr) {
    const nc = px+dc, nr = py+dr;
    if (nr<0||nr>=ROWS||nc<0||nc>=COLS) return;
    const t = MAP[nr][nc];
    if (t===1) return; // wall
    px=nc; py=nr;
    render();
    if (t===2||t===3) {
      // Hit laser — reset
      mgStatus(statusEl,'LASER DETECTED — REROUTING...','#ff4466');
      outer: for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(MAP[r][c]===4){py=r;px=c;break outer;}
      setTimeout(() => { mgStatus(statusEl,''); render(); }, 700);
      return;
    }
    if (t===5) {
      window.removeEventListener('keydown', keyHandler);
      mgStatus(statusEl,'EXIT REACHED — EXTRACTION COMPLETE','#00e87a');
      setTimeout(() => { removeOverlay('mg-laser'); onComplete(); }, 900);
    }
  }

  function keyHandler(e) {
    if (e.key==='ArrowUp')    { e.preventDefault(); tryMove(0,-1); }
    if (e.key==='ArrowDown')  { e.preventDefault(); tryMove(0, 1); }
    if (e.key==='ArrowLeft')  { e.preventDefault(); tryMove(-1,0); }
    if (e.key==='ArrowRight') { e.preventDefault(); tryMove( 1,0); }
  }
  window.addEventListener('keydown', keyHandler);

  render();
}
