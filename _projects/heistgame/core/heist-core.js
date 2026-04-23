// =============================================================
//  H.E.I.S.T.EXE  —  heist-core.js
// =============================================================

import { initNPCSystem }   from './heist-npc.js';
import { initLeaderboard } from './heist-leaderboard.js';
import { runMinigame }     from './heist-minigames.js';

// ─── GRID CONSTANTS ──────────────────────────────────────────
export const CELL = 32;
export const COLS = 22;
export const ROWS = 16;
export const W    = COLS * CELL;
export const H    = ROWS * CELL;

// ─── LEVEL REGISTRY ──────────────────────────────────────────
export const LEVELS = [];
export function registerLevel(levelData) { LEVELS.push(levelData); }

// ─── WALL UTILITIES ──────────────────────────────────────────
export function buildBorderWalls(cols, rows) {
  const w = [];
  for (let x = 0; x < cols; x++) { w.push({x,y:0}); w.push({x,y:rows-1}); }
  for (let y = 1; y < rows-1; y++) { w.push({x:0,y}); w.push({x:cols-1,y}); }
  return w;
}
export function rectWall(x, y, w, h) {
  const cells = [];
  for (let row = y; row < y+h; row++)
    for (let col = x; col < x+w; col++)
      cells.push({x:col, y:row});
  return cells;
}

// ─── SETTINGS ────────────────────────────────────────────────
const DEFAULT_KEYS = { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight' };
let settings = { ghostReplay:true, keys:{...DEFAULT_KEYS} };
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('heist_settings')||'{}');
    if (s.ghostReplay !== undefined) settings.ghostReplay = s.ghostReplay;
    if (s.keys) settings.keys = {...DEFAULT_KEYS, ...s.keys};
  } catch(e) {}
}
function saveSettings() { localStorage.setItem('heist_settings', JSON.stringify(settings)); }

// ─── ENGINE STATE ────────────────────────────────────────────
let canvas, ctx;
let level = 0, deaths = 0;
let player, guards, gems, wallSet, wallBarriers, goalRect;
let dead = false, levelWon = false, deathTimer = 0, winFlash = 0;
let running = false, paused = false, t = 0;
let runStartTime = 0, pausedTimeAccum = 0, pauseStart = 0, timerActive = false;
let csQueue = [], csIndex = 0, csOnComplete = null, csTypeTimer = null;
let _introScenes = null;
let npc = null, leaderboard = null, currentRunScore = null;
let npcEntity = null;
let allGemsCollected = false;
let staticCanvas = null, staticCtx = null;
let inSettings = false;

// Ghost replay
let ghostFrames = [], bestGhostRun = null, ghostPlayback = [], ghostFrame = 0;
const GHOST_SAMPLE = 2;
function loadBestGhost() {
  try { bestGhostRun = JSON.parse(localStorage.getItem('heist_ghost')||'null'); } catch(e) { bestGhostRun=null; }
}
function saveBestGhost(frames) {
  try { localStorage.setItem('heist_ghost', JSON.stringify(frames)); } catch(e) {}
}

// Level select
let levelsUnlocked = 1;
function loadProgress() { levelsUnlocked = Math.max(1, parseInt(localStorage.getItem('heist_unlocked')||'1')); }
function saveProgress(lvl) {
  if (lvl+1 > levelsUnlocked) { levelsUnlocked=lvl+1; localStorage.setItem('heist_unlocked',String(levelsUnlocked)); }
}

// Bonus floor
let _bonusFloorActive = false;

// ─── WALL HELPERS ────────────────────────────────────────────
function buildWallSet(walls) { return new Set(walls.map(w=>`${w.x},${w.y}`)); }
function buildBarriers(walls) { return walls.map(w=>({x:w.x*CELL,y:w.y*CELL,width:CELL,height:CELL})); }
function isWall(x, y) { return wallSet && wallSet.has(`${Math.floor(x/CELL)},${Math.floor(y/CELL)}`); }

// ─── LINE OF SIGHT CHECK ─────────────────────────────────────
// March from (x0,y0) to (x1,y1) in grid steps; return false if any wall cell blocks
function hasLineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) / (CELL * 0.5);
  const n = Math.ceil(steps) + 1;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const cx = Math.floor((x0 + dx*t) / CELL);
    const cy = Math.floor((y0 + dy*t) / CELL);
    if (wallSet && wallSet.has(`${cx},${cy}`)) return false;
  }
  return true;
}

// ─── GEM CLASS ───────────────────────────────────────────────
class Gem {
  constructor(data) {
    this.x=data.x; this.y=data.y; this.r=data.r||6;
    this.collected=false; this.cooldownUntil=0; this.color=data.color||'#00c8ff';
  }
  collect() { this.collected=true; this.cooldownUntil=performance.now()+200; updateHUD(); }
  checkCollision(px,py,pr) {
    if (this.collected||performance.now()<this.cooldownUntil) return false;
    const dx=px-this.x, dy=py-this.y;
    return (dx*dx+dy*dy)<(pr+this.r+2)*(pr+this.r+2);
  }
}

// ─── PLAYER ──────────────────────────────────────────────────
class PlayerController {
  constructor(data) {
    this.x=data.x; this.y=data.y; this.r=data.r||9;
    this.speed=3.2;
    this.vel={x:0,y:0}; this.keys={};
    this._kd=this._onKeyDown.bind(this);
    this._ku=this._onKeyUp.bind(this);
    window.addEventListener('keydown',this._kd);
    window.addEventListener('keyup',  this._ku);
  }
  _onKeyDown(e) { this.keys[e.key]=true; }
  _onKeyUp(e)   { this.keys[e.key]=false; }
  updateVelocity() {
    const k=this.keys, sk=settings.keys, s=this.speed;
    const up=k[sk.up]  ||k['w']||k['W'];
    const dn=k[sk.down]||k['s']||k['S'];
    const lt=k[sk.left]||k['a']||k['A'];
    const rt=k[sk.right]||k['d']||k['D'];
    this.vel.x = rt?s : lt?-s : 0;
    this.vel.y = dn?s : up?-s : 0;
    if (this.vel.x!==0&&this.vel.y!==0) { this.vel.x*=0.707; this.vel.y*=0.707; }
  }
  move() {
    const nx=this.x+this.vel.x, ny=this.y+this.vel.y;
    if (!isWall(nx,ny))     this.x=nx;
    if (!isWall(this.x,ny)) this.y=ny;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
    ctx.fillStyle='#00e87a'; ctx.fill();
  }
  destroy() {
    window.removeEventListener('keydown',this._kd);
    window.removeEventListener('keyup',  this._ku);
  }
}

// ─── STATIC LAYER ────────────────────────────────────────────
function buildStaticLayer() {
  if (!staticCanvas) {
    staticCanvas=document.createElement('canvas');
    staticCanvas.width=W; staticCanvas.height=H;
    staticCtx=staticCanvas.getContext('2d');
  }
  const sc=staticCtx;
  sc.fillStyle='#000'; sc.fillRect(0,0,W,H);
  sc.strokeStyle='rgba(20,40,80,0.35)'; sc.lineWidth=0.5;
  sc.beginPath();
  for (let x=0;x<=W;x+=CELL){sc.moveTo(x,0);sc.lineTo(x,H);}
  for (let y=0;y<=H;y+=CELL){sc.moveTo(0,y);sc.lineTo(W,y);}
  sc.stroke();
  sc.fillStyle='#0d1828';
  wallBarriers.forEach(b=>sc.fillRect(b.x,b.y,CELL,CELL));
  sc.strokeStyle='rgba(0,180,100,0.2)'; sc.lineWidth=1;
  wallBarriers.forEach(b=>sc.strokeRect(b.x+0.5,b.y+0.5,CELL-1,CELL-1));
}

// ─── LEVEL INIT ──────────────────────────────────────────────
function initLevel(idx) {
  const L=LEVELS[idx];
  wallSet      = buildWallSet(L.walls);
  wallBarriers = buildBarriers(L.walls);
  if (player) player.destroy();
  player   = new PlayerController({x:L.start.x*CELL+CELL/2, y:L.start.y*CELL+CELL/2});
  goalRect = {x:L.goal.x*CELL, y:L.goal.y*CELL, w:L.goal.w*CELL, h:L.goal.h*CELL};
  gems     = L.gems.map(g=>new Gem({x:g.x*CELL+CELL/2, y:g.y*CELL+CELL/2, r:g.r||6, color:g.color||'#00c8ff'}));
  // Guards: store base speed for chase logic, bounce flag preserved
  guards   = L.guards.map(g=>{
    const spd = Math.sqrt((g.vx||0)*(g.vx||0)+(g.vy||0)*(g.vy||0));
    return {...g, r:g.r||10, alertMode:false, alertTimer:0, chasing:false, baseSpeed:spd||4.8};
  });
  dead=false; levelWon=false; deathTimer=0; winFlash=0; allGemsCollected=false;
  if (idx===0&&!timerActive) { runStartTime=Date.now(); pausedTimeAccum=0; timerActive=true; }
  document.getElementById('h-level').textContent=idx+1;
  document.getElementById('h-total').textContent=gems.length;
  npcEntity=idx===0?{x:10.5*CELL,y:10.5*CELL,r:8}:null;
  const hint=document.getElementById('npc-hint');
  if (hint) hint.classList.toggle('active',idx===0);
  if (npc) npc.reset();
  buildStaticLayer();
  updateHUD();
  ghostFrames=[]; ghostFrame=0;
  ghostPlayback=(settings.ghostReplay&&bestGhostRun&&bestGhostRun.level===idx)?bestGhostRun.frames:[];
}

function updateHUD() {
  document.getElementById('h-deaths').textContent=deaths;
  document.getElementById('h-gems').textContent  =gems.filter(g=>g.collected).length;
}

// ─── TIMER ───────────────────────────────────────────────────
export function formatTime(ms) {
  const s=Math.floor(ms/1000), m=Math.floor(s/60);
  return `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}.${String(Math.floor((ms%1000)/10)).padStart(2,'0')}`;
}
function getElapsed() {
  if (!timerActive) return 0;
  return paused ? (pauseStart-runStartTime-pausedTimeAccum) : (Date.now()-runStartTime-pausedTimeAccum);
}

function drawTimer() {
  if (!timerActive) return;
  const str=formatTime(getElapsed());
  const pad=10,fw=9,tw=str.length*fw;
  const bx=W-tw-pad*2-10, by=10, bw=tw+pad*2, bh=24;
  ctx.fillStyle='rgba(6,10,20,0.75)'; ctx.fillRect(bx,by,bw,bh);
  ctx.fillStyle='rgba(0,232,122,0.5)'; ctx.fillRect(bx,by,bw,1);
  ctx.font='13px Orbitron,monospace';
  ctx.fillStyle=paused?'rgba(255,200,0,0.9)':'rgba(0,232,122,0.9)';
  ctx.textAlign='right';
  ctx.fillText(paused?'PAUSED':str, W-10, by+bh-6);
  ctx.textAlign='left';
}

// ─── GUARD VISION CONE ───────────────────────────────────────
// Returns true if player is within this guard's cone AND has unobstructed LoS
function playerInCone(g) {
  const spd=Math.sqrt(g.vx*g.vx+g.vy*g.vy);
  if (spd===0) return false;
  const angle=Math.atan2(g.vy,g.vx);
  const dx=player.x-g.x, dy=player.y-g.y;
  const distSq=dx*dx+dy*dy;
  if (distSq>80*80) return false; // max cone range
  // Angle check
  const playerAngle=Math.atan2(dy,dx);
  let diff=playerAngle-angle;
  while (diff> Math.PI) diff-=Math.PI*2;
  while (diff<-Math.PI) diff+=Math.PI*2;
  if (Math.abs(diff)>0.44) return false; // ~50° half-angle
  // Wall occlusion check
  return hasLineOfSight(g.x, g.y, player.x, player.y);
}

// ─── DRAW ────────────────────────────────────────────────────
function drawGems() {
  const byColor={};
  gems.forEach(g=>{
    if (g.collected) return;
    (byColor[g.color]||(byColor[g.color]=[])).push(g);
  });
  for (const color in byColor) {
    ctx.beginPath();
    byColor[color].forEach(g=>{
      const r=g.r;
      ctx.moveTo(g.x,g.y-r*1.4); ctx.lineTo(g.x+r,g.y);
      ctx.lineTo(g.x,g.y+r*1.4); ctx.lineTo(g.x-r,g.y);
      ctx.closePath();
    });
    ctx.fillStyle=color; ctx.fill();
  }
}

function drawGoal() {
  if (allGemsCollected) {
    ctx.fillStyle='rgba(0,232,122,0.2)'; ctx.fillRect(goalRect.x,goalRect.y,goalRect.w,goalRect.h);
    ctx.strokeStyle='#00e87a'; ctx.lineWidth=1.5;
    ctx.strokeRect(goalRect.x+0.5,goalRect.y+0.5,goalRect.w-1,goalRect.h-1);
    ctx.font='bold 14px Orbitron,monospace'; ctx.fillStyle='#00e87a';
    ctx.textAlign='center';
    ctx.fillText('EXTRACT',goalRect.x+goalRect.w/2,goalRect.y+goalRect.h/2+6);
    ctx.textAlign='left';
  } else {
    ctx.fillStyle='rgba(0,232,122,0.03)'; ctx.fillRect(goalRect.x,goalRect.y,goalRect.w,goalRect.h);
    ctx.strokeStyle='rgba(0,232,122,0.15)'; ctx.lineWidth=1;
    ctx.strokeRect(goalRect.x+0.5,goalRect.y+0.5,goalRect.w-1,goalRect.h-1);
  }
}

function drawGuardCone(g) {
  const spd=Math.sqrt(g.vx*g.vx+g.vy*g.vy); if (spd===0) return;
  const angle=Math.atan2(g.vy,g.vx);
  const coneLen=80, coneHalf=0.44;
  const ax=g.x+Math.cos(angle-coneHalf)*coneLen;
  const ay=g.y+Math.sin(angle-coneHalf)*coneLen;
  const bx=g.x+Math.cos(angle+coneHalf)*coneLen;
  const by=g.y+Math.sin(angle+coneHalf)*coneLen;
  ctx.beginPath();
  ctx.moveTo(g.x,g.y); ctx.lineTo(ax,ay); ctx.lineTo(bx,by);
  ctx.closePath();
  ctx.fillStyle=g.alertMode?'rgba(255,140,0,0.25)':'rgba(255,60,60,0.1)';
  ctx.fill();
}

function drawGuards() {
  if (!guards.length) return;
  guards.forEach(g=>drawGuardCone(g));
  // Alert markers
  guards.forEach(g=>{
    if (!g.alertMode) return;
    ctx.font='bold 10px Orbitron,monospace';
    ctx.fillStyle='#ff8800';
    ctx.textAlign='center';
    ctx.fillText('!',g.x,g.y-g.r-5);
    ctx.textAlign='left';
  });
  // Bodies — single batched path
  ctx.beginPath();
  guards.forEach(g=>{ ctx.moveTo(g.x+g.r,g.y); ctx.arc(g.x,g.y,g.r,0,Math.PI*2); });
  ctx.fillStyle='#cc2244'; ctx.fill();
}

function drawGhostReplay() {
  if (!settings.ghostReplay||!ghostPlayback.length) return;
  const pos=ghostPlayback[Math.min(Math.floor(ghostFrame/GHOST_SAMPLE),ghostPlayback.length-1)];
  if (!pos) return;
  ctx.globalAlpha=0.28;
  ctx.beginPath(); ctx.arc(pos.x,pos.y,9,0,Math.PI*2);
  ctx.fillStyle='#00e87a'; ctx.fill();
  ctx.globalAlpha=1;
}

function drawNPC() {
  if (!npcEntity) return;
  ctx.beginPath(); ctx.arc(npcEntity.x,npcEntity.y,npcEntity.r,0,Math.PI*2);
  ctx.fillStyle='#ffaa00'; ctx.fill();
  ctx.strokeStyle='#cc8800'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.font='bold 11px Arial'; ctx.fillStyle='#0a0e1a';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('?',npcEntity.x,npcEntity.y+0.5);
  ctx.textBaseline='alphabetic'; ctx.textAlign='left';
  if (player) {
    const dx=player.x-npcEntity.x, dy=player.y-npcEntity.y;
    if (dx*dx+dy*dy<52*52) {
      ctx.font='8px "Share Tech Mono"'; ctx.fillStyle='#ffaa00';
      ctx.textAlign='center';
      ctx.fillText('[E] CHAT',npcEntity.x,npcEntity.y-npcEntity.r-8);
      ctx.textAlign='left';
    }
  }
}

function draw() {
  ctx.drawImage(staticCanvas,0,0);
  drawGoal(); drawGems(); drawGuards(); drawGhostReplay(); drawNPC();
  if (player) player.draw();
  if (levelWon&&winFlash>0) {
    ctx.fillStyle=`rgba(0,232,122,${(winFlash/70)*0.25})`;
    ctx.fillRect(0,0,W,H); winFlash--;
  }
  if (dead&&deathTimer>0) {
    ctx.fillStyle=`rgba(200,0,40,${(deathTimer/70)*0.45})`;
    ctx.fillRect(0,0,W,H); deathTimer--;
    if (deathTimer===0) { initLevel(level); dead=false; }
  }
  drawTimer();
}

// ─── GUARDS ──────────────────────────────────────────────────
const ALERT_FRAMES = 90; // 1.5s at 60fps — alert window before chase begins

function guardWallHit(gx,gy,gr) {
  const r=gr-1;
  return (
    wallSet.has(`${Math.floor((gx-r)/CELL)},${Math.floor(gy/CELL)}`)||
    wallSet.has(`${Math.floor((gx+r)/CELL)},${Math.floor(gy/CELL)}`)||
    wallSet.has(`${Math.floor(gx/CELL)},${Math.floor((gy-r)/CELL)}`)||
    wallSet.has(`${Math.floor(gx/CELL)},${Math.floor((gy+r)/CELL)}`)
  );
}

function moveGuards() {
  if (levelWon) return;
  guards.forEach(g=>{
    if (!g.vx) g.vx=0; if (!g.vy) g.vy=0;

    const seesPlayer = playerInCone(g);

    if (seesPlayer) {
      // All guards: show alert
      if (!g.alertMode) { g.alertMode=true; g.alertTimer=ALERT_FRAMES; }
      // Bounce guards only: once alertMode is active, chase the player
      if (g.bounce) {
        g.chasing=true;
        const dx=player.x-g.x, dy=player.y-g.y;
        const dist=Math.sqrt(dx*dx+dy*dy)||1;
        const chaseSpeed=g.baseSpeed*1.25;
        g.vx=(dx/dist)*chaseSpeed;
        g.vy=(dy/dist)*chaseSpeed;
      }
    } else {
      // Faded alert countdown
      if (g.alertTimer>0) {
        g.alertTimer--;
        if (g.alertTimer===0) {
          g.alertMode=false;
          if (g.bounce&&g.chasing) {
            // Return to diagonal bounce at base speed
            g.chasing=false;
            const diag=g.baseSpeed*0.707;
            g.vx=diag; g.vy=diag;
          }
        }
      }
    }

    // Move
    const nx=g.x+g.vx, ny=g.y+g.vy;
    if (!guardWallHit(nx,g.y,g.r)) g.x=nx; else { g.vx*=-1; }
    if (!guardWallHit(g.x,ny,g.r)) g.y=ny; else { g.vy*=-1; }
    if (g.x<g.r){g.x=g.r;g.vx=Math.abs(g.vx);}
    if (g.x>W-g.r){g.x=W-g.r;g.vx=-Math.abs(g.vx);}
    if (g.y<g.r){g.y=g.r;g.vy=Math.abs(g.vy);}
    if (g.y>H-g.r){g.y=H-g.r;g.vy=-Math.abs(g.vy);}
  });
}

// ─── COLLISIONS ──────────────────────────────────────────────
function checkCollisions() {
  if (dead||levelWon) return;
  const pr=player.r, px=player.x, py=player.y;
  for (const g of guards) {
    const dx=px-g.x, dy=py-g.y;
    if (dx*dx+dy*dy<(pr+g.r)*(pr+g.r)) { die(); return; }
  }
  if (!allGemsCollected) {
    let allDone=true;
    for (const gem of gems) {
      if (!gem.collected) {
        if (gem.checkCollision(px,py,pr)) gem.collect();
        if (!gem.collected) allDone=false;
      }
    }
    if (allDone) allGemsCollected=true;
  }
  if (allGemsCollected&&px>goalRect.x&&px<goalRect.x+goalRect.w&&py>goalRect.y&&py<goalRect.y+goalRect.h) {
    winLevel();
  }
}

function die() {
  if (dead) return;
  dead=true; deaths++; deathTimer=70;
  guards.forEach(g=>{ g.alertMode=false; g.alertTimer=0; g.chasing=false; });
  updateHUD();
}

// ─── WIN LEVEL ───────────────────────────────────────────────
function winLevel() {
  if (levelWon) return;
  levelWon=true; winFlash=40; running=false;
  saveProgress(level);
  if (settings.ghostReplay&&ghostFrames.length>0) {
    const prev=bestGhostRun;
    if (!prev||prev.level!==level||ghostFrames.length<prev.frames.length) {
      bestGhostRun={level,frames:ghostFrames.slice()};
      saveBestGhost(bestGhostRun);
    }
  }
  const mg=level;
  setTimeout(()=>{ mg<3?runMinigame(mg,finishLevel):finishLevel(); },800);
}

function finishLevel() {
  level++;
  if (level>=LEVELS.length) showBonusFloorPrompt();
  else { initLevel(level); running=true; loop(); }
}

// ─── PROCEDURAL BONUS FLOOR ──────────────────────────────────-
function showBonusFloorPrompt() {
  const el=document.createElement('div');
  el.id='bonus-prompt';
  el.style.cssText=`position:fixed;inset:0;z-index:9400;background:rgba(0,0,0,0.95);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Share Tech Mono',monospace;color:#99b0cc;gap:16px;`;
  el.innerHTML=`
    <div style="font-family:'Orbitron',monospace;font-size:0.7rem;font-weight:900;letter-spacing:0.35em;color:#ffcc00;">// BONUS FLOOR DETECTED</div>
    <div style="font-size:0.82rem;color:#445577;text-align:center;line-height:1.8;">An uncharted server room has been found.<br>No guards. High risk. Score multiplier: <span style="color:#ffcc00">×1.5</span></div>
    <div style="display:flex;gap:16px;">
      <button id="bonus-yes" style="padding:10px 28px;font-family:'Orbitron',monospace;font-size:0.7rem;letter-spacing:0.2em;background:transparent;border:1px solid rgba(255,200,0,0.4);color:#ffcc00;cursor:pointer;">[ ENTER ]</button>
      <button id="bonus-no"  style="padding:10px 28px;font-family:'Orbitron',monospace;font-size:0.7rem;letter-spacing:0.2em;background:transparent;border:1px solid rgba(100,100,100,0.4);color:#445577;cursor:pointer;">[ SKIP ]</button>
    </div>`;
  document.getElementById('heist-shell').appendChild(el);
  document.getElementById('bonus-yes').onclick=()=>{ el.remove(); startBonusFloor(); };
  document.getElementById('bonus-no').onclick =()=>{ el.remove(); showEndScreen(); };
}

function startBonusFloor() {
  const rng=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
  const walls=buildBorderWalls(COLS,ROWS);
  for (let i=0;i<rng(3,5);i++) {
    const bx=rng(2,COLS-5),by=rng(2,ROWS-5),bw=rng(2,4),bh=rng(1,3);
    for (let r=by;r<by+bh;r++) for (let c=bx;c<bx+bw;c++) walls.push({x:c,y:r});
  }
  const ws=new Set(walls.map(w=>`${w.x},${w.y}`));
  const gemList=[], colors=['#00c8ff','#ff00cc','#ffcc00'];
  for (let a=0;a<40&&gemList.length<16;a++) {
    const gx=rng(1,COLS-2),gy=rng(1,ROWS-2);
    if (!ws.has(`${gx},${gy}`)) gemList.push({x:gx,y:gy,color:colors[gemList.length%3]});
  }
  LEVELS.push({walls, start:{x:1,y:7}, goal:{x:COLS-3,y:ROWS/2-1,w:2,h:2}, gems:gemList, guards:[], _isBonus:true});
  _bonusFloorActive=true;
  initLevel(LEVELS.length-1); running=true; loop();
}

// ─── LOOP ────────────────────────────────────────────────────
function loop() {
  if (!running) return;
  t++;
  player.updateVelocity(); player.move();
  moveGuards(); checkCollisions();
  if (settings.ghostReplay&&t%GHOST_SAMPLE===0) ghostFrames.push({x:player.x,y:player.y});
  ghostFrame++;
  draw();
  requestAnimationFrame(loop);
}

// ─── SETTINGS PANEL ──────────────────────────────────────────
function openSettings() {
  if (inSettings) return;
  inSettings=true;
  if (running) { paused=true; pauseStart=Date.now(); running=false; }
  document.getElementById('settings-panel')?.classList.remove('hidden');
  refreshSettingsUI();
}
function closeSettings() {
  inSettings=false;
  document.getElementById('settings-panel')?.classList.add('hidden');
  saveSettings();
  if (paused) { paused=false; pausedTimeAccum+=Date.now()-pauseStart; running=true; loop(); }
}
function refreshSettingsUI() {
  const kr=document.getElementById('keys-rebind'); if (!kr) return;
  kr.innerHTML='';
  const actions=[['up','Move Up'],['down','Move Down'],['left','Move Left'],['right','Move Right']];
  actions.forEach(([action,label])=>{
    const row=document.createElement('div');
    row.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);';
    const lbl=document.createElement('span');
    lbl.style.cssText='font-size:0.75rem;color:#445577;letter-spacing:0.1em;';
    lbl.textContent=label;
    const btn=document.createElement('button');
    btn.style.cssText='font-family:"Share Tech Mono",monospace;font-size:0.78rem;background:rgba(0,20,10,0.6);border:1px solid rgba(0,232,122,0.2);color:#00e87a;padding:4px 14px;cursor:pointer;min-width:100px;text-align:center;';
    btn.textContent=settings.keys[action];
    btn.addEventListener('click',()=>startRebind(action,btn));
    row.appendChild(lbl); row.appendChild(btn); kr.appendChild(row);
  });
  // Ghost toggle
  const ghostRow=document.createElement('div');
  ghostRow.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:10px 0 4px;';
  ghostRow.innerHTML=`<span style="font-size:0.75rem;color:#445577;letter-spacing:0.1em;">Ghost Replay</span><button id="ghost-toggle" style="font-family:'Orbitron',monospace;font-size:0.65rem;letter-spacing:0.15em;padding:5px 16px;cursor:pointer;border:1px solid;background:transparent;">${settings.ghostReplay?'ON':'OFF'}</button>`;
  kr.appendChild(ghostRow);
  const gt=document.getElementById('ghost-toggle');
  gt.style.color=settings.ghostReplay?'#00e87a':'#445577';
  gt.style.borderColor=settings.ghostReplay?'rgba(0,232,122,0.4)':'rgba(100,100,100,0.3)';
  gt.addEventListener('click',()=>{
    settings.ghostReplay=!settings.ghostReplay;
    gt.textContent=settings.ghostReplay?'ON':'OFF';
    gt.style.color=settings.ghostReplay?'#00e87a':'#445577';
    gt.style.borderColor=settings.ghostReplay?'rgba(0,232,122,0.4)':'rgba(100,100,100,0.3)';
    saveSettings();
  });
  // Reset
  const resetRow=document.createElement('div');
  resetRow.style.cssText='padding-top:12px;text-align:right;';
  resetRow.innerHTML=`<button id="reset-keys-btn" style="font-family:'Orbitron',monospace;font-size:0.58rem;letter-spacing:0.15em;padding:5px 14px;cursor:pointer;background:transparent;border:1px solid rgba(255,50,50,0.25);color:rgba(255,80,80,0.5);">RESET TO DEFAULTS</button>`;
  kr.appendChild(resetRow);
  document.getElementById('reset-keys-btn').addEventListener('click',()=>{ settings.keys={...DEFAULT_KEYS}; saveSettings(); refreshSettingsUI(); });
}
function startRebind(action,btn) {
  btn.textContent='PRESS A KEY...'; btn.style.color='#ffcc00'; btn.style.borderColor='rgba(255,200,0,0.4)';
  const handler=(e)=>{
    e.preventDefault(); e.stopPropagation();
    if (e.key==='Escape') { refreshSettingsUI(); window.removeEventListener('keydown',handler,true); return; }
    settings.keys[action]=e.key; saveSettings(); refreshSettingsUI();
    window.removeEventListener('keydown',handler,true);
  };
  window.addEventListener('keydown',handler,true);
}

// ─── LEVEL SELECT ────────────────────────────────────────────
function buildLevelSelectUI() {
  const grid=document.getElementById('level-select-grid'); if (!grid) return;
  grid.innerHTML='';
  const labels=['THE LOBBY','SECURITY HUB','VAULT ANTECHAMBER','THE VAULT CORE'];
  for (let i=0;i<4;i++) {
    const unlocked=i<levelsUnlocked;
    const btn=document.createElement('button');
    btn.style.cssText=`padding:12px 20px;font-family:'Orbitron',monospace;font-size:0.6rem;letter-spacing:0.15em;text-align:left;cursor:${unlocked?'pointer':'default'};background:transparent;border:1px solid ${unlocked?'rgba(0,232,122,0.3)':'rgba(50,70,90,0.3)'};color:${unlocked?'#00e87a':'#253040'};transition:background 0.15s;width:100%;`;
    btn.innerHTML=`<div>FLOOR ${i+1}</div><div style="font-size:0.5rem;color:${unlocked?'#445577':'#1a2535'};margin-top:3px;">${labels[i]}</div>`;
    if (unlocked) {
      btn.addEventListener('mouseenter',()=>btn.style.background='rgba(0,232,122,0.07)');
      btn.addEventListener('mouseleave',()=>btn.style.background='transparent');
      btn.addEventListener('click',()=>{
        document.getElementById('level-select-panel').classList.add('hidden');
        document.getElementById('overlay').classList.add('hidden');
        level=i; deaths=0; timerActive=false; pausedTimeAccum=0;
        runStartTime=Date.now(); timerActive=true;
        initLevel(i); running=true; loop();
      });
    }
    grid.appendChild(btn);
  }
}

// ─── CUTSCENE (typewriter) ───────────────────────────────────
export function showCutscene(scenes, onComplete) {
  csQueue=scenes; csIndex=0; csOnComplete=onComplete;
  document.getElementById('cutscene').classList.remove('hidden','fade-out');
  renderCutsceneSlide();
}
function renderCutsceneSlide() {
  const scene=csQueue[csIndex];
  document.getElementById('cs-label').textContent   = scene.label;
  document.getElementById('cs-counter').textContent = `${csIndex+1} / ${csQueue.length}`;
  document.getElementById('cs-btn').textContent     = csIndex===csQueue.length-1?'[ EXECUTE ]':'[ CONTINUE ]';
  const textEl=document.getElementById('cs-text');
  textEl.innerHTML='';
  const plain=scene.text.replace(/<[^>]+>/g,'');
  let i=0;
  if (csTypeTimer) clearInterval(csTypeTimer);
  csTypeTimer=setInterval(()=>{
    if (i>=plain.length) { clearInterval(csTypeTimer); csTypeTimer=null; textEl.innerHTML=scene.text; return; }
    textEl.textContent+=plain[i++];
  },16);
}
function bindCutsceneBtn() {
  document.getElementById('cs-btn').addEventListener('click',()=>{
    if (csTypeTimer) { clearInterval(csTypeTimer); csTypeTimer=null; document.getElementById('cs-text').innerHTML=csQueue[csIndex].text; return; }
    csIndex++;
    if (csIndex<csQueue.length) renderCutsceneSlide();
    else {
      document.getElementById('cutscene').classList.add('fade-out');
      setTimeout(()=>{ document.getElementById('cutscene').classList.add('hidden'); if (csOnComplete) csOnComplete(); },600);
    }
  });
}

// ─── END SCREEN ──────────────────────────────────────────────
export function showEndScreen() {
  timerActive=false; running=false;
  const totalMs=getElapsed();
  const displayMs=_bonusFloorActive?Math.round(totalMs/1.5):totalMs;
  document.getElementById('end-time').textContent  =formatTime(displayMs);
  document.getElementById('end-deaths').textContent=String(deaths);
  document.getElementById('canvas-wrap').style.display='none';
  document.getElementById('end-screen').classList.remove('hidden');
  currentRunScore=leaderboard.addScore('temp_player',displayMs,deaths);
  renderLeaderboard(currentRunScore);
  _bonusFloorActive=false;
  document.getElementById('end-play-again').onclick=()=>{
    document.getElementById('end-screen').classList.add('hidden');
    document.getElementById('canvas-wrap').style.display='';
    if (LEVELS[LEVELS.length-1]?._isBonus) LEVELS.pop();
    level=0; deaths=0; timerActive=false; pausedTimeAccum=0; currentRunScore=null;
    initLevel(0); running=true; loop();
  };
}

// ─── LEADERBOARD ─────────────────────────────────────────────
function escapeHtml(t) { const d=document.createElement('div');d.textContent=t;return d.innerHTML; }
function renderLeaderboard(currentScore) {
  const topScores=leaderboard.getTop5();
  const tbody=document.querySelector('#leaderboard-table tbody');
  tbody.innerHTML='';
  if (!topScores.length) { const r=document.createElement('tr'); r.innerHTML='<td colspan="4" id="leaderboard-empty">No scores yet.</td>'; tbody.appendChild(r); return; }
  topScores.forEach((score,i)=>{
    const row=document.createElement('tr');
    if (currentScore&&score.id===currentScore.id) row.classList.add('current-player');
    row.innerHTML=`<td class="rank">#${i+1}</td><td class="name">${escapeHtml(score.name)}</td><td class="time">${formatTime(score.time)}</td><td class="deaths">${score.deaths}</td>`;
    tbody.appendChild(row);
  });
}
function bindLeaderboardInput() {
  const saveBtn=document.getElementById('save-name-btn');
  const nameEl =document.getElementById('player-name-input');
  const wipeBtn=document.getElementById('wipe-leaderboard-btn');
  saveBtn.addEventListener('click',()=>{
    const name=nameEl.value.trim()||'Anonymous';
    if (currentRunScore) {
      currentRunScore.name=name;
      leaderboard.entries=leaderboard.entries.map(e=>e.id===currentRunScore.id?currentRunScore:e);
      leaderboard.saveLeaderboard(); renderLeaderboard(currentRunScore); nameEl.value='';
    }
  });
  nameEl.addEventListener('keypress',e=>{if(e.key==='Enter')saveBtn.click();});
  if (wipeBtn) wipeBtn.addEventListener('click',()=>{ if(confirm('Wipe all scores?')){ leaderboard.clear(); currentRunScore=null; renderLeaderboard(null); } });
}

// ─── NPC ─────────────────────────────────────────────────────
function bindNPCSystem() {
  document.addEventListener('keydown',e=>{
    if ((e.key==='e'||e.key==='E')&&running&&level===0&&npcEntity) {
      const dx=player.x-npcEntity.x, dy=player.y-npcEntity.y;
      if (dx*dx+dy*dy<50*50) toggleNPCChat();
    }
  });
  document.getElementById('npc-send-btn').addEventListener('click',sendNPCMessage);
  document.getElementById('npc-input').addEventListener('keypress',e=>{if(e.key==='Enter')sendNPCMessage();});
  document.getElementById('npc-close-btn').addEventListener('click',closeNPCChat);
}
function toggleNPCChat() {
  const modal=document.getElementById('npc-modal');
  modal.classList.toggle('active');
  if (modal.classList.contains('active')) { document.getElementById('npc-input').focus(); running=false; }
  else { running=true; loop(); }
}
function closeNPCChat() { document.getElementById('npc-modal').classList.remove('active'); running=true; loop(); }
function sendNPCMessage() {
  const input=document.getElementById('npc-input');
  const text=input.value.trim(); if (!text) return;
  npc.addMessage('user',text); displayNPCMsg('user',text); input.value='';
  npc.getResponse(text).then(resp=>{ npc.addMessage('bot',resp); displayNPCMsg('bot',resp); });
  document.getElementById('npc-input').focus();
}
function displayNPCMsg(sender,text) {
  const c=document.getElementById('npc-messages');
  const d=document.createElement('div'); d.className=`npc-message ${sender}`;
  d.innerHTML=`<div class="npc-message-bubble">${escapeHtml(text)}</div>`;
  c.appendChild(d); c.scrollTop=c.scrollHeight;
}

// ─── PUBLIC API ──────────────────────────────────────────────
export function initGame({ canvasId, introScenes, onEndingCutscene }) {
  loadSettings(); loadProgress(); loadBestGhost();
  canvas=document.getElementById(canvasId); ctx=canvas.getContext('2d');
  canvas.width=W; canvas.height=H;
  _introScenes=introScenes;
  npc=initNPCSystem(); leaderboard=initLeaderboard();

  const wrap=document.getElementById('canvas-wrap');
  if (wrap&&!wrap.querySelector('.canvas-corner-tr')) {
    const tr=document.createElement('span'); tr.className='canvas-corner-tr';
    const bl=document.createElement('span'); bl.className='canvas-corner-bl';
    wrap.appendChild(tr); wrap.appendChild(bl);
  }
  const titleEl=document.getElementById('title');
  if (titleEl) titleEl.setAttribute('data-text',titleEl.textContent);

  bindCutsceneBtn(); bindNPCSystem(); bindLeaderboardInput();

  window.addEventListener('keydown',e=>{
    if (e.key==='Escape') { if (inSettings) closeSettings(); else if (running||paused) openSettings(); return; }
    if ((e.key==='3'||e.key==='3')&&running&&!dead) { level++; if(level>=LEVELS.length) showEndScreen(); else initLevel(level); }
    if ((e.key==='r'||e.key==='R')&&running) {
      if (LEVELS[LEVELS.length-1]?._isBonus) LEVELS.pop();
      level=0; deaths=0; timerActive=false; pausedTimeAccum=0; currentRunScore=null; initLevel(0);
    }
  });

  document.getElementById('settings-btn')?.addEventListener('click',()=>{ document.getElementById('settings-panel').classList.remove('hidden'); refreshSettingsUI(); });
  document.getElementById('ig-settings-close')?.addEventListener('click',closeSettings);
  document.getElementById('level-select-btn')?.addEventListener('click',()=>{ buildLevelSelectUI(); document.getElementById('level-select-panel').classList.remove('hidden'); });
  document.getElementById('level-select-close')?.addEventListener('click',()=>{ document.getElementById('level-select-panel').classList.add('hidden'); });
}

export function startGame() {
  document.getElementById('overlay').classList.add('hidden');
  showCutscene(_introScenes,()=>{ initLevel(0); running=true; loop(); });
}