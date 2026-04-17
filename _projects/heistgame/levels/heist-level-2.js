// =============================================================
//  H.E.I.S.T.EXE  —  heist-level-2.js
//  Sector: SECURITY HUB  |  Difficulty: OPERATIVE
// =============================================================

const _coreUrl = new URL('../Core/heist-core.js', import.meta.url).href;
const { registerLevel, buildBorderWalls, rectWall, COLS, ROWS, CELL } = await import(_coreUrl);

registerLevel({
  walls: buildBorderWalls(COLS, ROWS).concat([
    ...rectWall(2,5,7,1), ...rectWall(11,5,9,1),
    ...rectWall(2,11,9,1),...rectWall(13,11,7,1),
    ...rectWall(10,1,1,4),...rectWall(10,12,1,3),
    ...rectWall(5,8,2,1), ...rectWall(15,8,2,1),
  ]),
  start: { x:1, y:1 },
  goal:  { x:19, y:7, w:2, h:2 },
  gems: [
    {x:4, y:3, color:'#00c8ff'},{x:8, y:3, color:'#ff00cc'},
    {x:13,y:3, color:'#00c8ff'},{x:17,y:3, color:'#ff00cc'},
    {x:8, y:13,color:'#00c8ff'},{x:13,y:13,color:'#ff00cc'},
    {x:2, y:8, color:'#ff00cc'},{x:20,y:8, color:'#00c8ff'},
    {x:11,y:7, color:'#ff00cc'},
  ],
  guards: [
    {x:4*CELL+CELL/2,  y:3*CELL+CELL/2,  vx:4.9, vy:0},
    {x:17*CELL+CELL/2, y:3*CELL+CELL/2,  vx:-4.9,vy:0},
    {x:4*CELL+CELL/2,  y:13*CELL+CELL/2, vx:0,   vy:-4.9},
    {x:17*CELL+CELL/2, y:13*CELL+CELL/2, vx:0,   vy:4.9},
  ],
});