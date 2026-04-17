// Minimal stub for leaderboard
export function showLeaderboard() {
  const score = localStorage.getItem('heist_score') || 0;
  document.body.innerHTML = `<h2>Leaderboard</h2><p>Your score: ${score}</p>`;
}
