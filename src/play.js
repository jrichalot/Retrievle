// ==================== IMPORTS ====================
import { KEYBOARDS } from "./keyboardArrays.js";
import { translations } from "./translations.js";

// ==================== GLOBAL STATE ====================
let fullWordTokens = [];
let wordOfTheDayTokens = [];

let selectedIndices = [];     // ✅ non-consecutive indices to guess (sorted)
let guessSlots = [];          // alias for clarity

let currentGuess = [];        // tokens entered by player (length <= segmentLength)
let currentRow = 0;
let maxGuesses = 6;
let segmentLength = 5;
let gameActive = false;

let correctTokens = new Set();
let presentTokens = new Set();
let absentTokens = new Set();

let keyboardLang = "en"; // drives KEYBOARDS
let uiLang = "en";       // drives translations (fallback)

// ==================== HELPERS ====================
function getPlayTranslations() {
  return translations[uiLang]?.play || translations["en"].play;
}

function safeParseJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// ==================== LOAD GAME SETUP ====================
fullWordTokens = safeParseJSON("fullWord", []);
wordOfTheDayTokens = safeParseJSON("wordToGuess", []);
selectedIndices = safeParseJSON("selectedIndices", []);

segmentLength = parseInt(localStorage.getItem("segmentLength"), 10);
maxGuesses = parseInt(localStorage.getItem("maxAttempts"), 10);

keyboardLang = localStorage.getItem("language") || "en";
uiLang = ["en", "fr"].includes(keyboardLang) ? keyboardLang : "en";

// Validate setup
if (
  !Array.isArray(fullWordTokens) || fullWordTokens.length === 0 ||
  !Array.isArray(wordOfTheDayTokens) || wordOfTheDayTokens.length === 0 ||
  !Array.isArray(selectedIndices) || selectedIndices.length === 0 ||
  Number.isNaN(segmentLength) || Number.isNaN(maxGuesses)
) {
  alert(getPlayTranslations().alerts.missingSetup);
  throw new Error("Missing or invalid game setup.");
}

// Basic consistency checks
selectedIndices = selectedIndices
  .map(n => Number(n))
  .filter(n => Number.isInteger(n))
  .sort((a, b) => a - b);

if (selectedIndices.length !== segmentLength) {
  alert(getPlayTranslations().alerts.missingSetup);
  throw new Error("Invalid setup: selectedIndices does not match segmentLength.");
}

if (selectedIndices.some(i => i < 0 || i >= fullWordTokens.length)) {
  alert(getPlayTranslations().alerts.missingSetup);
  throw new Error("Invalid setup: selectedIndices out of range.");
}

// (Optional but helpful) ensure the saved answer matches fullWord at those indices
const derivedAnswer = selectedIndices.map(i => fullWordTokens[i]);
const sameAnswer =
  derivedAnswer.length === wordOfTheDayTokens.length &&
  derivedAnswer.every((t, idx) => t === wordOfTheDayTokens[idx]);

if (!sameAnswer) {
  // Not fatal, but it means setup was inconsistent; better to fail fast
  alert(getPlayTranslations().alerts.missingSetup);
  throw new Error("Invalid setup: wordToGuess does not match fullWord at selectedIndices.");
}

// Clear one-time storage (keep hints + hintOrder if you want them to persist until used)
localStorage.removeItem("fullWord");
localStorage.removeItem("wordToGuess");
localStorage.removeItem("selectedIndices");
localStorage.removeItem("segmentLength");
localStorage.removeItem("maxAttempts");

// Slots to fill (left-to-right)
guessSlots = selectedIndices;

// ==================== HINTS ====================
const hints = safeParseJSON("hints", []);
const hintOrder = localStorage.getItem("hintOrder") || "sequential";
let usedHints = [];
let hintIndex = 0;

function getNextHint() {
  const t = getPlayTranslations();

  if (!Array.isArray(hints) || hints.length === 0) {
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
    const available = hints.map((_, i) => i).filter(i => !usedHints.includes(i));
    const i = available[Math.floor(Math.random() * available.length)];
    usedHints.push(i);
    alert(hints[i]);
  }
}

document.getElementById("hintBtn")?.addEventListener("click", getNextHint);

// ==================== GAME UI ====================
function updateAttemptsUI() {
  const el = document.getElementById("attempts");
  if (el) el.textContent = String(maxGuesses - currentRow);
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

  const guessable = new Set(guessSlots);

  for (let r = 0; r < maxGuesses; r++) {
    const row = document.createElement("div");
    row.className = "row";

    for (let c = 0; c < fullWordTokens.length; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.id = `tile-${r}-${c}`;

      // Reveal tiles not in the guess set
      if (!guessable.has(c)) {
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
  const keys = KEYBOARDS[keyboardLang] || KEYBOARDS.en;
  return [...keys, "DEL", "ENTER"];
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
  // Place the current guess into the non-consecutive slots for the current row
  for (let i = 0; i < segmentLength; i++) {
    const col = guessSlots[i];
    const tile = document.getElementById(`tile-${currentRow}-${col}`);
    if (!tile) continue;

    tile.textContent = currentGuess[i] || "";
  }
}

// ==================== GAME LOGIC ====================
function checkGuess() {
  const t = getPlayTranslations();
  const guess = currentGuess.slice(); // tokens
  const feedback = Array(segmentLength).fill("absent");

  // Use counts to support duplicates correctly
  const answerCounts = new Map();
  for (const tok of wordOfTheDayTokens) {
    answerCounts.set(tok, (answerCounts.get(tok) || 0) + 1);
  }

  // 1) Correct
  for (let i = 0; i < segmentLength; i++) {
    if (guess[i] === wordOfTheDayTokens[i]) {
      feedback[i] = "correct";
      answerCounts.set(guess[i], answerCounts.get(guess[i]) - 1);
    }
  }

  // 2) Present
  for (let i = 0; i < segmentLength; i++) {
    if (feedback[i] === "correct") continue;

    const tok = guess[i];
    const remaining = answerCounts.get(tok) || 0;
    if (remaining > 0) {
      feedback[i] = "present";
      answerCounts.set(tok, remaining - 1);
    }
  }

  // Apply feedback to tiles + token sets
  for (let i = 0; i < segmentLength; i++) {
    const col = guessSlots[i];
    const tile = document.getElementById(`tile-${currentRow}-${col}`);
    if (!tile) continue;

    tile.classList.remove("correct", "present", "absent");
    tile.classList.add(feedback[i]);

    if (feedback[i] === "correct") {
      correctTokens.add(guess[i]);
      presentTokens.delete(guess[i]); // correct overrides present
      absentTokens.delete(guess[i]);
    } else if (feedback[i] === "present") {
      if (!correctTokens.has(guess[i])) presentTokens.add(guess[i]);
      absentTokens.delete(guess[i]);
    } else {
      if (!correctTokens.has(guess[i]) && !presentTokens.has(guess[i])) {
        absentTokens.add(guess[i]);
      }
    }
  }

  // Win / lose
  const won = guess.every((tok, i) => tok === wordOfTheDayTokens[i]);

  if (won) {
    alert(t.alerts.win);
    gameActive = false;
    renderKeyboard();
    return;
  }

  currentRow++;
  currentGuess = [];
  updateAttemptsUI();

  if (currentRow >= maxGuesses) {
    // Show full phrase/word to player
    alert(t.alerts.lose(fullWordTokens.join(" ")));
    gameActive = false;
    renderKeyboard();
    return;
  }

  renderKeyboard();
}

// ==================== INIT ====================
startGame();
