// Minimal stub for demo integration
// This should launch Heist Level 2 and then show the leaderboard, saving to localStorage
import { playHeistLevel2 } from './heist-level-2.js';
import { showLeaderboard } from './heist-leaderboard.js';

export function startHeistLevel2WithLeaderboard() {
  playHeistLevel2({
    onComplete: (score) => {
      localStorage.setItem('heist_score', score);
      showLeaderboard();
    }
  });
}
