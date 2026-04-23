// =============================================================
//  heist-game-setup.js  —  GameEngine Integration Example
//  Shows how to integrate Heist with the GameCore framework
// =============================================================

import GameCore from '{{site.baseurl}}/assets/js/GameEnginev1.1/essentials/Game.js';
import GameControl from '{{site.baseurl}}/assets/js/GameEnginev1.1/essentials/GameControl.js';
import HeistLevel from './HeistLevel.js';
import { LEVELS, registerLevel } from './heist-core.js';

// Import your level definitions
import '../Levels/heist-level-1.js';
import '../Levels/heist-level-2.js';
// ... import more levels as needed

/**
 * Initialize the Heist game with GameEngine
 * 
 * Usage:
 * ```html
 * <div id="gameContainer">
 *   <canvas id="gameCanvas"></canvas>
 * </div>
 * 
 * <script type="module">
 *   import initHeistGame from './heist-game-setup.js';
 *   initHeistGame();
 * </script>
 * ```
 */
export default async function initHeistGame() {
  // Configuration for the game environment
  const environment = {
    path: "{{site.baseurl}}",  // Jekyll template variable
    gameContainer: document.getElementById("gameContainer"),
    gameCanvas: document.getElementById("gameCanvas"),
    gameLevelClasses: [HeistLevel],
    disablePauseMenu: false,
    disableContainerAdjustment: false,
    pythonURI: window._pythonURI,
    javaURI: window._javaURI,
    fetchOptions: window._fetchOptions,
  };

  // Create and initialize the game
  try {
    const gameCore = new GameCore(environment, GameControl);
    console.log('Heist game initialized with GameEngine!');
    return gameCore;
  } catch (error) {
    console.error('Error initializing Heist game:', error);
  }
}

// Alternative: For immediate initialization on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeistGame);
} else {
  // Already loaded, initialize immediately
  initHeistGame();
}
