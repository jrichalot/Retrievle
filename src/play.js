// ==================== IMPORTS ====================
import { KEYBOARDS } from "./keyboardArrays.js";
import { translations } from "./translations.js";

// ==================== KEYBOARD ARRAYS ====================
const keys_en = KEYBOARDS.en;
const keys_fr = KEYBOARDS.fr;
const keys_hiragana = KEYBOARDS.hiragana;
const keys_katakana = KEYBOARDS.katakana;
const keys_emoji = KEYBOARDS.emoji;

// ==================== GLOBAL STATE ====================
let wordOfTheDay = "";
let fullWord = "";
let currentGuess = "";
let currentRow = 0;
let maxGuesses = 6;
let wordLength = 5;
let gameActive = false;

let correctLetters = new Set();
let presentLetters = new Set();
let absentLetters = new Set();

let currentLang = "en";

// ==================== LOAD GAME SETUP ====================
fullWord = localStorage.getItem("fullWord");
wordOfTheDay = localStorage.getItem("wordToGuess");
wordLength = parseInt(localStorage.getItem("segmentLength"), 10);
maxGuesses = parseInt(localStorage.getItem("maxAttempts"), 10);
currentLang = localStorage.getItem("language") || "en";

// Validate setup
if (
  !fullWord ||
  !wordOfTheDay ||
  Number.isNaN(wordLength) ||
  Number.isNaN(maxGuesses)
) {
  alert(translations[currentLang].play.alerts.missingSetup);
  throw new Error("Missing or invalid game setup.");
}

// Clear setup (one-time play)
localStorage.removeItem("fullWord");
localStorage.removeItem("wordToGuess");
localStorage.removeItem("segmentLength");
localStorage.removeItem("maxAttempts");

// Segment position
const startIndex = fullWord.indexOf(wordOfTheDay);
if (startIndex === -1) {
  throw new Error("Invalid setup: segment not found in full word.");
}

// ==================== HINTS ====================
const hints = JSON.parse(localStorage.getItem("hints") || "[]");
const hintOrder = localStorage.getItem("hintOrder") || "sequential";

let usedHints = [];
let hintIndex = 0;

function getNextHint() {
  const t = translations[currentLang].play;

  if (!hints.length) {
    alert(t.alerts.noHints);
    return;
  }

  if (hintOrder === "sequential") {
    if (hintIndex >= hints.length) {
      alert(t.alerts.noMoreHints);
      return;
    }
    alert(hints[hintIndex]);
    hintIndex++;
  } else {
    if (usedHints.length >= hints.length) {
      alert(t.alerts.noMoreHints);
      return;
    }
    const available = hints
      .map((_, i) => i)
      .filter(i => !usedHints.includes(i));
    const i = available[Math.floor(Math.random() * available.length)];
    usedHints.push(i);
    alert(hints[i]);
  }
}

document.getElementById("hintBtn").addEventListener("click", getNextHint);

// ==================== GAME UI ====================
function updateAttemptsUI() {
  document.getElementById("attempts").textContent =
    maxGuesses - currentRow;
}

// ==================== GAME INIT ====================
function startGame() {
  gameActive = true;
  currentGuess = "";
  currentRow = 0;

  correctLetters.clear();
  presentLetters.clear();
  absentLetters.clear();

  renderBoard();
  renderKeyboard();
  updateAttemptsUI();
}

// ==================== BOARD ====================
function renderBoard() {
  const game = document.getElementById("game");
  game.innerHTML = "";

  for (let r = 0; r < maxGuesses; r++) {
    const row = document.createElement("div");
    row.className = "row";

    for (let c = 0; c < fullWord.length; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.id = `tile-${r}-${c}`;

      // Reveal non-play segment
      if (c < startIndex || c >= startIndex + wordLength) {
        tile.textContent = fullWord[c];
        tile.classList.add("correct");
        correctLetters.add(fullWord[c]);
      }

      row.appendChild(tile);
    }
    game.appendChild(row);
  }
}

// ==================== KEYBOARD ====================
function getActiveKeys() {
  if (currentLang === "fr") return [...keys_fr, "DEL", "ENTER"];
  if (currentLang === "hiragana") return [...keys_hiragana, "DEL", "ENTER"];
  if (currentLang === "katakana") return [...keys_katakana, "DEL", "ENTER"];
  if (currentLang === "emoji") return [...keys_emoji, "DEL", "ENTER"];
  return [...keys_en, "DEL", "ENTER"];
}

function renderKeyboard() {
  const kb = document.getElementById("keyboard");
  kb.innerHTML = "";

  getActiveKeys().forEach(key => {
    const btn = document.createElement("div");
    btn.className = "key";
    btn.textContent = key;

    if (correctLetters.has(key)) btn.classList.add("correct");
    else if (presentLetters.has(key)) btn.classList.add("present");
    else if (absentLetters.has(key)) btn.classList.add("absent");

    btn.addEventListener("click", () => handleKey(key));
    kb.appendChild(btn);
  });
}

// ==================== INPUT ====================
function handleKey(key) {
  if (!gameActive) return;

  if (key === "DEL") {
    currentGuess = currentGuess.slice(0, -1);
  } else if (key === "ENTER") {
    if (currentGuess.length !== wordLength) return;
    checkGuess();
    return;
  } else {
    if (currentGuess.length < wordLength) currentGuess += key;
  }

  updateTiles();
}

function updateTiles() {
  for (let i = 0; i < wordLength; i++) {
    const tile = document.getElementById(
      `tile-${currentRow}-${startIndex + i}`
    );
    tile.textContent = currentGuess[i] || "";
  }
}

// ==================== GAME LOGIC ====================
function checkGuess() {
  const t = translations[currentLang].play;
  const guess = currentGuess.toUpperCase();
  const feedback = Array(wordLength).fill("absent");
  const used = Array(wordLength).fill(false);

  // Correct letters
  for (let i = 0; i < wordLength; i++) {
    if (guess[i] === wordOfTheDay[i]) {
      feedback[i] = "correct";
      used[i] = true;
    }
  }

  // Present letters
  for (let i = 0; i < wordLength; i++) {
    if (feedback[i] === "correct") continue;
    for (let j = 0; j < wordLength; j++) {
      if (!used[j] && guess[i] === wordOfTheDay[j]) {
        feedback[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  // Apply feedback
  for (let i = 0; i < wordLength; i++) {
    const tile = document.getElementById(
      `tile-${currentRow}-${startIndex + i}`
    );
    tile.classList.add(feedback[i]);

    if (feedback[i] === "correct") correctLetters.add(guess[i]);
    else if (feedback[i] === "present") presentLetters.add(guess[i]);
    else absentLetters.add(guess[i]);
  }

  if (guess === wordOfTheDay) {
    alert(t.alerts.win);
    gameActive = false;
    return;
  }

  currentRow++;
  currentGuess = "";
  updateAttemptsUI();

  if (currentRow >= maxGuesses) {
    alert(t.alerts.lose(fullWord));
    gameActive = false;
  }

  renderKeyboard();
}

// ==================== INIT ====================
startGame();
