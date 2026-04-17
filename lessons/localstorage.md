---
comments: true
toc: true
layout: post
title: "Local Storage in Games: Save Your Progress!"
description: "A hands-on lesson for high school CS students on using localStorage to enhance games. Includes interactive demos, coding, and challenges."
courses: { csse: {week: 17} }
type: collab
author: Rishab, Vihaan, Seonyoo, Rigved
permalink: /localstorage
---

# 🎮 Local Storage in Games: Save Your Progress!

Welcome! In this lesson, you'll learn how to use `localStorage` to save game progress, high scores, and player preferences in your browser. By the end, you'll:
- Understand what `localStorage` is and why it's useful for games
- Play a real game demo that uses `localStorage`
- Write and test your own code to save and load data
- Extend a game to save custom settings

---

## 🚀 Demo: Play Heist Game Level 2 & Save Your Score!

Let's start with a hands-on demo. Play Level 2 of the Heist Game below. When you finish, you'll go straight to the leaderboard, which saves your score in `localStorage`.

> **Try it!**

```js GAME_RUNNER
// This cell launches Heist Game Level 2 and auto-moves to leaderboard on completion.
// The leaderboard uses localStorage to save your score.
import { startHeistLevel2WithLeaderboard } from '/lessons/heist-game-setup.js';

startHeistLevel2WithLeaderboard();
```

---

## 🗝️ What is localStorage?

- `localStorage` is a built-in browser feature that lets you save data as key-value pairs.
- Data stays even after you close or reload the page.
- Perfect for saving game progress, high scores, settings, and more!

**Example:**
```js
localStorage.setItem('score', 1000); // Save score
let score = localStorage.getItem('score'); // Load score
```

- Data is stored as strings. You can use `JSON.stringify` and `JSON.parse` for objects.

[MDN Docs: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## 🧑‍💻 Interactive Coding: Save & Load Data

Try saving and loading your own data using `localStorage`! Edit and run the code below.

```js CODE_RUNNER
// Save your name to localStorage
localStorage.setItem('playerName', 'Alex');

// Load your name from localStorage
let name = localStorage.getItem('playerName');
console.log('Welcome back, ' + name + '!');
```

**Challenge:**
- Change the code to save your own name.
- Try saving a number or an object (hint: use `JSON.stringify`).

## 🕹️ How Heist Game Uses localStorage

In the Heist Game, localStorage is used to:
- Save your score after you finish a level
- Load your score onto the leaderboard
- (Optionally) Save your player preferences and settings

Here's a simplified example of how the game saves and loads scores:

```js CODE_RUNNER
// Save score after level complete
function saveScore(score) {
  localStorage.setItem('heist_score', score);
}

// Load score for leaderboard
function loadScore() {
  return localStorage.getItem('heist_score');
}

// Try it!
saveScore(12345);
console.log('Loaded score:', loadScore());
```

**Test:**
- Change the score and re-run. Does it persist?
- Reload the page and run only the `loadScore()` part. Is your score still there?

## 🏗️ Extend the Game: Save Your Own Setting

Now it's your turn! Add a new setting to the game and save it with localStorage. For example, let’s save a custom game speed.

```js CODE_RUNNER
// Save a custom game speed
function saveGameSpeed(speed) {
  localStorage.setItem('game_speed', speed);
}

// Load the game speed
function loadGameSpeed() {
  return localStorage.getItem('game_speed');
}

// Try it!
saveGameSpeed(2.5);
console.log('Loaded speed:', loadGameSpeed());
```

**Challenge:**
- Change the code to save a different setting (e.g., keybinds, theme, gravity).
- Test: Does your setting persist after you reload the page?

## 🧪 Test Your Knowledge: Quiz

1. What is the difference between `localStorage` and a regular JavaScript variable?
2. How would you save an object (like `{level: 2, score: 500}`) in localStorage?
3. Why is localStorage useful for games?

**Try it!**
- Write your answers below, then check with your teacher or classmates.

## 🏆 Project: Make Your Own Leaderboard

- Use what you learned to build a simple leaderboard for any game you like.
- Save player names and scores in localStorage.
- Display the leaderboard on the page.

**Starter code:**
```js CODE_RUNNER
// Add a score to the leaderboard
function addScore(name, score) {
  let board = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  board.push({ name, score });
  localStorage.setItem('leaderboard', JSON.stringify(board));
}

// Show the leaderboard
function showLeaderboard() {
  let board = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  board.sort((a, b) => b.score - a.score);
  board.forEach(entry => console.log(entry.name + ': ' + entry.score));
}

// Try it!
addScore('Alex', 1000);
addScore('Jordan', 1500);
showLeaderboard();
```

**Challenge:**
- Make a form for players to enter their name and score.
- Show the leaderboard in the browser, not just the console.

## 📝 Reflection & Wrap-Up

- What did you learn about localStorage?
- How can you use it to make your games better?
- What else would you like to save in your games?

**Share your thoughts below!**
