---
layout: opencs
title: H.E.I.S.T.EXE
permalink: /heist
---

<link rel="stylesheet" href="{{site.baseurl}}/pages/_projects/H.E.I.S.T.EXE/Assets%20&%20Styling/heist-game.css">
<link rel="stylesheet" href="{{site.baseurl}}/pages/_projects/H.E.I.S.T.EXE/Assets%20&%20Styling/heist-leaderboard.css">

<div id="heist-shell">

  <button id="fullscreen-btn" onclick="voidToggleFullscreen()" title="Toggle fullscreen">
    <svg viewBox="0 0 24 24" id="fs-icon-expand">
      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
    <svg viewBox="0 0 24 24" id="fs-icon-compress" style="display:none">
      <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
      <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
    </svg>
  </button>

  <div id="wrapper">
    <div id="title">H.E.I.S.T.EXE</div>
    <div id="hud">
      <div class="hud-item">FLOOR <span id="h-level">1</span></div>
      <div class="hud-item">GEMS <span id="h-gems">0</span>/<span id="h-total">0</span></div>
      <div class="hud-item">CAUGHT <span id="h-deaths">0</span></div>
    </div>
    <div id="canvas-wrap">
      <canvas id="c"></canvas>
    </div>
  </div>

  <!-- START OVERLAY -->
  <div id="overlay">
    <div id="overlay-title" class="green">H.E.I.S.T.EXE</div>
    <div id="overlay-sub">
      Ghost Protocol Active<br>
      Collect all gems. Reach the extraction point.<br>
      Avoid the guards. Hold SHIFT to sprint.
    </div>
    <button class="void-btn" id="start-btn">[ BEGIN INFILTRATION ]</button>
    <div id="overlay-secondary-btns">
      <button class="void-btn-sm" id="level-select-btn">[ LEVEL SELECT ]</button>
      <button class="void-btn-sm" id="settings-btn">[ SETTINGS ]</button>
    </div>
    <div id="controls-hint">WASD / ARROWS — MOVE &nbsp;|&nbsp; SHIFT — SPRINT &nbsp;|&nbsp; ESC — SETTINGS &nbsp;|&nbsp; Z — SKIP &nbsp;|&nbsp; R — RESTART</div>
  </div>

  <!-- CUTSCENE -->
  <div id="cutscene" class="hidden">
    <div id="cs-bg"></div>
    <div id="cs-content">
      <div id="cs-header">
        <div id="cs-title-tag">H.E.I.S.T.EXE</div>
        <div id="cs-counter">1 / 5</div>
      </div>
      <div id="cs-label"></div>
      <div id="cs-text"></div>
      <button id="cs-btn">[ CONTINUE ]</button>
    </div>
  </div>

  <!-- NPC Chat Modal -->
  <div id="npc-modal">
    <div id="npc-chat">
      <div id="npc-chat-header">
        <div id="npc-chat-title">SECURE CHANNEL</div>
        <button id="npc-close-btn">✕</button>
      </div>
      <div id="npc-messages"></div>
      <div id="npc-input-area">
        <input type="text" id="npc-input" placeholder="Type message...">
        <button id="npc-send-btn">SEND</button>
      </div>
    </div>
  </div>

  <!-- NPC Hint -->
  <div id="npc-hint" style="display: none;">Press E to chat with AI</div>

  <!-- SETTINGS PANEL (overlay, works from menu and ESC in-game) -->
  <div id="settings-panel" class="hidden">
    <div id="settings-content">
      <div id="settings-header">
        <div id="settings-title">// SYSTEM SETTINGS</div>
        <button id="ig-settings-close">✕</button>
      </div>
      <div id="settings-section-label">KEY BINDINGS</div>
      <div id="keys-rebind"></div>
    </div>
  </div>

  <!-- LEVEL SELECT PANEL -->
  <div id="level-select-panel" class="hidden">
    <div id="level-select-content">
      <div id="level-select-header">
        <div id="level-select-title">// SELECT FLOOR</div>
        <button id="level-select-close">✕</button>
      </div>
      <div id="level-select-sub">Complete floors to unlock subsequent ones.</div>
      <div id="level-select-grid"></div>
    </div>
  </div>

  <!-- END SCREEN -->
  <div id="end-screen" class="hidden">
    <div id="end-panel">
      <div id="end-title">Mission Complete</div>
      <div id="end-stats">
        <div class="end-stat">
          <div class="end-stat-label">Time</div>
          <div class="end-stat-value" id="end-time">00:00.00</div>
        </div>
        <div class="end-stat-divider"></div>
        <div class="end-stat">
          <div class="end-stat-label">Times Caught</div>
          <div class="end-stat-value" id="end-deaths">0</div>
        </div>
      </div>
      <div id="leaderboard-section">
        <div id="leaderboard-title">TOP TIMES</div>
        <div id="player-name-input-group">
          <input type="text" id="player-name-input" placeholder="Enter your name...">
          <button id="save-name-btn">SAVE</button>
        </div>
        <table id="leaderboard-table">
          <thead>
            <tr>
              <th class="rank">Rank</th>
              <th class="name">Player</th>
              <th class="time">Time</th>
              <th class="deaths">Caught</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        <button id="wipe-leaderboard-btn">[ WIPE SCORES ]</button>
      </div>
      <button id="end-play-again">[ PLAY AGAIN ]</button>
    </div>
  </div>

</div>

<script type="module">
  window._siteBaseUrl = '{{site.baseurl}}';
  import { pythonURI, javaURI, fetchOptions } from '{{site.baseurl}}/assets/js/api/config.js';
  window._pythonURI    = pythonURI;
  window._javaURI      = javaURI;
  window._fetchOptions = fetchOptions;
</script>
<script type="module">

  import { initGame, startGame } from '{{site.baseurl}}/pages/_projects/H.E.I.S.T.EXE/Core/heist-core.js';
  import { INTRO_SCENES } from '{{site.baseurl}}/pages/_projects/H.E.I.S.T.EXE/Levels/heist-level-1.js';
  import '{{site.baseurl}}/pages/_projects/H.E.I.S.T.EXE/Levels/heist-level-2.js';
  import '{{site.baseurl}}/pages/_projects/H.E.I.S.T.EXE/Levels/heist-level-3.js';
  import { showEndingCutscene } from '{{site.baseurl}}/pages/_projects/H.E.I.S.T.EXE/Levels/heist-level-4.js';
  import '{{site.baseurl}}/pages/_projects/H.E.I.S.T.EXE/Core/heist-npc.js';
  import '{{site.baseurl}}/pages/_projects/H.E.I.S.T.EXE/Core/heist-leaderboard.js';

  initGame({
    canvasId:         'c',
    introScenes:      INTRO_SCENES,
    onEndingCutscene: showEndingCutscene,
  });

  document.getElementById('start-btn').addEventListener('click', startGame);

  window.voidToggleFullscreen = function () {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      document.getElementById('fs-icon-expand').style.display  = 'none';
      document.getElementById('fs-icon-compress').style.display = '';
    } else {
      document.exitFullscreen();
      document.getElementById('fs-icon-expand').style.display  = '';
      document.getElementById('fs-icon-compress').style.display = 'none';
    }
  };
  document.addEventListener('fullscreenchange', () => {
    const inFs = !!document.fullscreenElement;
    document.getElementById('fs-icon-expand').style.display  = inFs ? 'none' : '';
    document.getElementById('fs-icon-compress').style.display = inFs ? '' : 'none';
  });
</script>