// ==================== IMPORTS ====================
import { KEYBOARDS } from "./keyboardArrays.js";
import { translations } from "./translations.js";

// ==================== GLOBAL STATE ====================
let wordOfTheDayTokens = [];
let fullWordTokens = [];
let currentGuess = [];
let currentRow = 0;
let maxGuesses = 6;
let segmentLength = 5;
let gameActive = false;

let correctTokens = new Set();
let presentTokens = new Set();
let absentTokens = new Set();

let keyboardLang = "en"; // drives KEYBOARDS
let uiLang = "en";       // drives translations

// ==================== LOAD GAME SETUP ====================
fullWordTokens = JSON.parse(localStorage.getItem("fullWord") || "[]");
wordOfTheDayTokens = JSON.parse(localStorage.getItem("wordToGuess") || "[]");
segmentLength = parseInt(localStorage.getItem("segmentLength"), 10);
maxGuesses = parseInt(localStorage.getItem("maxAttempts"), 10);
keyboardLang = localStorage.getItem("language") || "en";
uiLang = ["en", "fr"].includes(keyboardLang) ? keyboardLang : "en";

// Validate setup
if (!fullWordTokens.length || !wordOfTheDayTokens.length || Number.isNaN(segmentLength) || Number.isNaN(maxGuesses)) {
  alert(translations[uiLang].play.alerts.missingSetup);
  throw new Error("Missing or invalid game setup.");
}

// Clear one-time storage
localStorage.removeItem("fullWord");
localStorage.removeItem("wordToGuess");
localStorage.removeItem("segmentLength");
localStorage.removeItem("maxAttempts");

// Segment start
const startIndex = fullWordTokens.findIndex((_, i) => fullWordTokens.slice(i, i + segmentLength).join("") === wordOfTheDayTokens.join(""));
if (startIndex === -1) throw new Error("Segment not found in full word.");

// ==================== HINTS ====================
const hints = JSON.parse(localStorage.getItem("hints") || "[]");
const hintOrder = localStorage.getItem("hintOrder") || "sequential";
let usedHints = [];
let hintIndex = 0;

function getNextHint() {
  const t = translations[uiLang].play;

  if (!hints.length) return alert(t.alerts.noHints);

  if (hintOrder === "sequential") {
    if (hintIndex >= hints.length) return alert(t.alerts.noMoreHints);
    alert(hints[hintIndex]);
    hintIndex++;
  } else {
    if (usedHints.length >= hints.length) return alert(t.alerts.noMoreHints);
    const available = hints.map((_, i) => i).filter(i => !usedHints.includes(i));
    const i = available[Math.floor(Math.random() * available.length)];
    usedHints.push(i);
    alert(hints[i]);
  }
}

document.getElementById("hintBtn")?.addEventListener("click", getNextHint);

// ==================== GAME UI ====================
function updateAttemptsUI() {
  document.getElementById("attempts").textContent = maxGuesses - currentRow;
}

// ==================== INIT GAME ====================
function startGame() {
  gameActive = true;
  currentGuess = [];
  currentRow = 0;
  correctTokens.clear();
  presentTokens.clear();
  absentTokens.clear();

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

    for (let c = 0; c < fullWordTokens.length; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.id = `tile-${r}-${c}`;

      // Reveal non-play segment
      if (c < startIndex || c >= startIndex + segmentLength) {
        tile.textContent = fullWordTokens[c];
        tile.classList.add("correct");
        correctTokens.add(fullWordTokens[c]);
      }

      row.appendChild(tile);
    }
    game.appendChild(row);
  }
}

// ==================== KEYBOARD ====================
function getActiveKeys() {
  return [...(KEYBOARDS[keyboardLang] || KEYBOARDS.en), "DEL", "ENTER"];
}

function renderKeyboard() {
  const kb = document.getElementById("keyboard");
  kb.innerHTML = "";

  getActiveKeys().forEach(key => {
    const btn = document.createElement("div");
    btn.className = "key";
    btn.textContent = key;

    if (correctTokens.has(key)) btn.classList.add("correct");
    else if (presentTokens.has(key)) btn.classList.add("present");
    else if (absentTokens.has(key)) btn.classList.add("absent");

    btn.addEventListener("click", () => handleKey(key));
    kb.appendChild(btn);
  });
}

// ==================== INPUT ====================
function handleKey(key) {
  if (!gameActive) return;

  if (key === "DEL") {
    currentGuess.pop();
  } else if (key === "ENTER") {
    if (currentGuess.length !== segmentLength) return;
    checkGuess();
    return;
  } else {
    if (currentGuess.length < segmentLength) currentGuess.push(key);
  }

  updateTiles();
}

function updateTiles() {
  for (let i = 0; i < segmentLength; i++) {
    const tile = document.getElementById(`tile-${currentRow}-${startIndex + i}`);
    tile.textContent = currentGuess[i] || "";
  }
}

// ==================== GAME LOGIC ====================
function checkGuess() {
  const t = translations[uiLang].play;
  const guess = currentGuess;
  const feedback = Array(segmentLength).fill("absent");
  const used = Array(segmentLength).fill(false);

  // Correct tokens
  for (let i = 0; i < segmentLength; i++) {
    if (guess[i] === wordOfTheDayTokens[i]) {
      feedback[i] = "correct";
      used[i] = true;
    }
  }

  // Present tokens
  for (let i = 0; i < segmentLength; i++) {
    if (feedback[i] === "correct") continue;
    for (let j = 0; j < segmentLength; j++) {
      if (!used[j] && guess[i] === wordOfTheDayTokens[j]) {
        feedback[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  // Apply feedback
  for (let i = 0; i < segmentLength; i++) {
    const tile = document.getElementById(`tile-${currentRow}-${startIndex + i}`);
    tile.classList.add(feedback[i]);

    if (feedback[i] === "correct") correctTokens.add(guess[i]);
    else if (feedback[i] === "present") presentTokens.add(guess[i]);
    else absentTokens.add(guess[i]);
  }

  if (guess.join("") === wordOfTheDayTokens.join("")) {
    alert(t.alerts.win);
    gameActive = false;
    return;
  }

  currentRow++;
  currentGuess = [];
  updateAttemptsUI();

  if (currentRow >= maxGuesses) {
    alert(t.alerts.lose(fullWordTokens.join("")));
    gameActive = false;
  }

  renderKeyboard();
}

// ==================== INIT ====================
startGame();
