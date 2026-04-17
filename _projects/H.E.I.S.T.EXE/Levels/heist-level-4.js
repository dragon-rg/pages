// =============================================================
//  H.E.I.S.T.EXE  —  heist-level-4.js
//  Sector: THE VAULT CORE  |  Difficulty: GHOST TIER
// =============================================================

const _coreUrl = new URL('../Core/heist-core.js', import.meta.url).href;
const { registerLevel, buildBorderWalls, rectWall, COLS, ROWS, CELL } = await import(_coreUrl);

registerLevel({
  walls: buildBorderWalls(COLS, ROWS).concat([
    ...rectWall(2,2,6,4), ...rectWall(14,2,6,4),
    ...rectWall(2,10,6,4),...rectWall(14,10,6,4),
    ...rectWall(9,6,4,1), ...rectWall(9,9,4,1),
  ]),
  start: { x:1, y:7 },
  goal:  { x:9, y:7, w:4, h:2 },
  gems: [
    {x:4, y:7, color:'#00c8ff'},{x:7, y:7, color:'#ff00cc'},
    {x:14,y:7, color:'#00c8ff'},{x:17,y:7, color:'#ff00cc'},
    {x:10,y:3, color:'#ff00cc'},{x:11,y:3, color:'#00c8ff'},
    {x:10,y:12,color:'#00c8ff'},{x:11,y:12,color:'#ff00cc'},
    {x:2, y:7, color:'#ff00cc'},{x:19,y:7, color:'#00c8ff'},
  ],
  guards: [
    {x:4*CELL+CELL/2, y:8*CELL+CELL/2,  vx:4.8,  vy:0},
    {x:17*CELL+CELL/2,y:7*CELL+CELL/2,  vx:-4.8, vy:0},
    {x:10*CELL+CELL/2,y:3*CELL+CELL/2,  vx:0,    vy:4.8},
    {x:11*CELL+CELL/2,y:12*CELL+CELL/2, vx:0,    vy:-4.8},
    {x:8*CELL+CELL/2, y:7*CELL+CELL/2,  vx:3.39, vy:3.39, bounce:true},
    {x:13*CELL+CELL/2,y:8*CELL+CELL/2,  vx:-3.39,vy:-3.39,bounce:true},
    {x:1*CELL+CELL/2, y:3*CELL+CELL/2,  vx:0,    vy:4.8},
    {x:20*CELL+CELL/2,y:12*CELL+CELL/2, vx:0,    vy:-4.8},
  ],
});

const OUTRO_SCENES = [
  { label:'// VAULT CORE — FINAL SECTOR CLEARED',
    text:'You did it.\n\nFour floors. Every gem. Every guard outmaneuvered.\n\nThe vault door slides open in front of you.\nInside: <span class="highlight">terabytes of stolen evidence.</span>\nNames. Accounts. Transactions. All of it.\n\nEnough to bring AEGIS down.' },
  { label:'// EXTRACTION SEQUENCE',
    text:'You load the data to the encrypted uplink.\nTransmission begins.\n\n<span class="success">12%... 38%... 71%... 99%...</span>\n\n<span class="danger">ALERT. SECURITY LOCKDOWN INITIATED.</span>\n\nHeavy boots echo in the corridor outside.\nYou have thirty seconds.' },
  { label:'// TRANSMISSION COMPLETE',
    text:'The data is out.\n\nYou close the uplink, pocket the drive.\nThe vault door seals behind you — <span class="highlight">just another wall.</span>\n\nThey\'ll find the empty vault in the morning.\nThey\'ll find the cameras — <span class="highlight">wiped.</span>\nThey\'ll find your fingerprints — <span class="highlight">none.</span>' },
  { label:'// DEBRIEF — AGENCY ENCRYPTED CHANNEL',
    text:'The evidence hits every major news outlet\nbefore sunrise.\n\nAEGIS\'s board is indicted by noon.\n\n<span class="highlight">47 accounts unfrozen.\n12 whistleblowers protected.\n1 ghost, never identified.</span>' },
  { label:'// END TRANSMISSION',
    text:'Somewhere in the city, in an unmarked apartment,\na figure closes a laptop and pours a drink.\n\nNo headlines. No credit. No face.\n\nJust the quiet satisfaction of a job\n<span class="highlight">no one will ever prove you did.</span>\n\n<span class="success">MISSION COMPLETE. GHOST OUT.</span>' },
];

export function showEndingCutscene() {
  const heist = window._heistGameInstance;
  if (heist) heist.showCutscene(OUTRO_SCENES, () => heist.showEndScreen());
}