// =============================================================
//  HeistLevel.js  —  GameEngine v1.1 Heist Level Integration
//  Implements the GameLevel interface for H.E.I.S.T.EXE game
// =============================================================

import { HeistGame } from './heist-core.js';

/**
 * HeistLevel implements the GameLevel interface for integration with GameCore.
 * This allows the Heist game to run within the GameEngine framework.
 */
class HeistLevel {
  constructor(gameEnv) {
    this.gameEnv = gameEnv;
    this.heistGame = null;
    
    // GameEngine expects these properties
    this.gameObjectClasses = [];
    this.gameObjects = [];
  }

  /**
   * Initialize the Heist game
   */
  initialize() {
    // Create a HeistGame instance with the GameEnv's canvas
    this.heistGame = new HeistGame(this.gameEnv);
    this.heistGame.initialize();
  }

  /**
   * Game update method - called each frame by GameEngine
   */
  update() {
    if (this.heistGame && this.heistGame.running) {
      this.heistGame.update();
    }
  }

  /**
   * Cleanup when level is destroyed
   */
  destroy() {
    if (this.heistGame) {
      this.heistGame.destroy();
      this.heistGame = null;
    }
  }
}

export default HeistLevel;
