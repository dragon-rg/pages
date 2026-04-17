// =============================================================
//  H.E.I.S.T.EXE  —  heist-level-3.js
//  Sector: VAULT ANTECHAMBER  |  Difficulty: SPECIALIST
// =============================================================

const _coreUrl = new URL('../Core/heist-core.js', import.meta.url).href;
const { registerLevel, buildBorderWalls, rectWall, COLS, ROWS, CELL } = await import(_coreUrl);

registerLevel({
  walls: buildBorderWalls(COLS, ROWS).concat([
    ...rectWall(3,3,16,1),...rectWall(3,12,16,1),
    ...rectWall(3,4,1,4), ...rectWall(3,9,1,3),
    ...rectWall(18,4,1,8),
    ...rectWall(6,6,8,1), ...rectWall(6,9,8,1),
  ]),
  start: { x:1, y:7 },
  goal:  { x:9, y:7, w:4, h:2 },
  gems: [
    {x:5, y:4, color:'#00c8ff'},{x:10,y:4, color:'#ff00cc'},
    {x:16,y:4, color:'#00c8ff'},{x:5, y:11,color:'#ff00cc'},
    {x:10,y:11,color:'#00c8ff'},{x:16,y:11,color:'#ff00cc'},
    {x:2, y:7, color:'#00c8ff'},{x:19,y:7, color:'#ff00cc'},
    {x:8, y:5, color:'#ff00cc'},{x:13,y:5, color:'#00c8ff'},
    {x:8, y:10,color:'#00c8ff'},{x:13,y:10,color:'#ff00cc'},
  ],
  guards: [
    {x:10*CELL+CELL/2,y:4*CELL+CELL/2,  vx:4.8, vy:0},
    {x:10*CELL+CELL/2,y:11*CELL+CELL/2, vx:-4.8,vy:0},
    {x:4*CELL+CELL/2, y:5*CELL+CELL/2,  vx:0,   vy:4.8},
    {x:17*CELL+CELL/2,y:10*CELL+CELL/2, vx:0,   vy:-4.8},
    {x:7*CELL+CELL/2, y:7*CELL+CELL/2,  vx:0,   vy:4.8},
    {x:14*CELL+CELL/2,y:8*CELL+CELL/2,  vx:3.39,vy:3.39,bounce:true},
  ],
});