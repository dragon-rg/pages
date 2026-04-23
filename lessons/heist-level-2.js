// Minimal stub for Heist Level 2
export function playHeistLevel2({ onComplete }) {
  // Simulate gameplay
  setTimeout(() => {
    const score = Math.floor(Math.random() * 10000) + 1000;
    alert('Level 2 complete! Your score: ' + score);
    if (onComplete) onComplete(score);
  }, 2000);
}
