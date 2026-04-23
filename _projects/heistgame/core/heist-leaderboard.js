// =============================================================
//  H.E.I.S.T.EXE Leaderboard System (LocalStorage)
// =============================================================

const LEADERBOARD_KEY = 'heist_leaderboard';
const MAX_ENTRIES = 5;

export class Leaderboard {
  constructor() {
    this.entries = this.loadLeaderboard();
  }

  loadLeaderboard() {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveLeaderboard() {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.entries));
  }

  addScore(playerName, timeMs, deaths) {
    const entry = {
      name: playerName || 'Anonymous',
      time: timeMs,
      deaths: deaths,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    };

    this.entries.push(entry);
    this.entries.sort((a, b) => a.time - b.time);
    this.entries = this.entries.slice(0, MAX_ENTRIES);
    this.saveLeaderboard();
    return entry;
  }

  getTop5() {
    return this.entries.slice(0, 5);
  }

  getRank(entryId) {
    return this.entries.findIndex(e => e.id === entryId) + 1;
  }

  clear() {
    this.entries = [];
    this.saveLeaderboard();
  }
}

export function initLeaderboard() {
  return new Leaderboard();
}