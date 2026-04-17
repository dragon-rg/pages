// =============================================================
//  H.E.I.S.T.EXE  —  heist-level-1.js
//  Sector: THE LOBBY  |  Difficulty: ROOKIE
// =============================================================

const _coreUrl = new URL('../Core/heist-core.js', import.meta.url).href;
const { registerLevel, buildBorderWalls, rectWall, COLS, ROWS, CELL } = await import(_coreUrl);

registerLevel({
  walls: buildBorderWalls(COLS, ROWS).concat([
    ...rectWall(2,4,6,1), ...rectWall(10,4,5,1),
    ...rectWall(2,9,4,1), ...rectWall(8,9,5,1),
    ...rectWall(15,6,1,5),...rectWall(5,7,2,1),
    ...rectWall(12,11,3,1),...rectWall(18,3,2,3),
    ...rectWall(18,9,2,3),
  ]),
  start: { x:1, y:7 },
  goal:  { x:19, y:6, w:2, h:3 },
  gems: [
    {x:4, y:2, color:'#00c8ff'},{x:8, y:2, color:'#ff00cc'},
    {x:12,y:2, color:'#00c8ff'},{x:16,y:2, color:'#ff00cc'},
    {x:2, y:6, color:'#00c8ff'},{x:7, y:6, color:'#ff00cc'},
    {x:11,y:6, color:'#00c8ff'},
    {x:4, y:11,color:'#ff00cc'},{x:8, y:12,color:'#00c8ff'},
    {x:13,y:13,color:'#ff00cc'},{x:17,y:11,color:'#00c8ff'},
    {x:20,y:2, color:'#ff00cc'},{x:20,y:13,color:'#00c8ff'},
  ],
  guards: [],
});

export const INTRO_SCENES = [
  { label:'// GHOST PROTOCOL — MISSION INIT',
    text:'Booting <span class="highlight">H.E.I.S.T.EXE</span>...\nHigh-Efficiency Infiltration & Stealth Toolkit\n\nAgent status: <span class="success">ACTIVE</span>\nTarget facility: AEGIS FINANCIAL TOWER\nMission classification: <span class="danger">BLACK OPS</span>' },
  { label:'// OPERATIVE DOSSIER',
    text:'You are <span class="highlight">GHOST</span> — the most elusive thief in the world.\n\nYour specialty: penetrating impossible security,\nvanishing without a trace, and walking out\nwith everything they said couldn\'t be stolen.\n\nYou\'ve cracked 14 vaults across 9 countries.\n<span class="highlight">No one has ever seen your face.</span>' },
  { label:'// INTELLIGENCE BRIEFING',
    text:'<span class="danger">SITUATION CRITICAL.</span>\n\nAEGIS Corporation has seized assets belonging\nto dozens of whistleblowers — evidence locked\nbehind their vault network.\n\nFour floors. Four vaults. All interconnected.\n<span class="highlight">You have 90 minutes before the system reboots.</span>' },
  { label:'// TARGET: THE GEMS',
    text:'Each floor contains encrypted <span class="highlight">data gems</span> —\nstolen evidence encoded into quantum crystals.\n\nCollect every gem. Reach the extraction point.\nDo not get caught.\n\nGuards project <span class="danger">vision cones</span>. Enter one and they alert.\nThe bouncing guards will <span class="danger">chase you</span> on sight.' },
  { label:'// DEPLOYING TO FLOOR 1',
    text:'Floor 1: THE LOBBY\nSecurity level: <span class="success">MINIMAL</span>\nGuards on duty: <span class="success">NONE</span>\n\nAn informant named <span class="highlight">CIPHER</span> is waiting in the lobby.\nPress <span class="highlight">[E]</span> near them to chat.\n\nPress <span class="highlight">ESC</span> to access settings.\n<span class="highlight">The vault awaits. Move silently.</span>' },
];