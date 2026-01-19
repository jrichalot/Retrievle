// ==================== IMPORTS ====================
import { translations } from "./translations.js";
import { getKeyboardById } from "./keyboardStore.js";

// ==================== GLOBAL STATE ====================
let fullWordTokens = [];
let wordOfTheDayTokens = [];

let selectedIndices = [];     // non-consecutive indices to guess (sorted)
let guessSlots = [];

let currentGuess = [];
let currentRow = 0;
let maxGuesses = 6;
let segmentLength = 5;
let gameActive = false;

let correctTokens = new Set();
let presentTokens = new Set();
let absentTokens = new Set();

// Keyboard handling
let keyboardId = "builtin:en";
let uiLang = "en";

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

function setUiLangFromKeyboardId() {
  const kb = getKeyboardById(keyboardId);
  if (!kb) {
    uiLang = "en";
    return;
  }

  if (kb.kind === "builtin") {
    const key = keyboardId.replace("builtin:", "");
    if (translations[key]) {
      uiLang = key;
      return;
    }
  }

  uiLang = "en";
}

// ==================== LOAD GAME SETUP ====================
fullWordTokens = safeParseJSON("fullWord", []);
wordOfTheDayTokens = safeParseJSON("wordToGuess", []);
selectedIndices = safeParseJSON("selectedIndices", []);

segmentLength = parseInt(localStorage.getItem("segmentLength"), 10);
maxGuesses = parseInt(localStorage.getItem("maxAttempts"), 10);

// NEW keyboard system
keyboardId =
  localStorage.getItem("keyboardId") ||
  (localStorage.getItem("language")
    ? `builtin:${localStorage.getItem("language")}`
    : "builtin:en");

setUiLangFromKeyboardId();

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

// Normalize & validate indices
selectedIndices = selectedIndices
  .map(Number)
  .filter(Number.isInteger)
  .sort((a, b) => a - b);

if (selectedIndices.length !== segmentLength) {
  alert(getPlayTranslations().alerts.missingSetup);
  throw new Error("selectedIndices does not match segmentLength");
}

if (selectedIndices.some(i => i < 0 || i >= fullWordTokens.length)) {
  alert(getPlayTranslations().alerts.missingSetup);
  throw new Error("selectedIndices out of range");
}

// Ensure consistency
const derivedAnswer = selectedIndices.map(i => fullWordTokens[i]);
if (!derivedAnswer.every((t, i) => t === wordOfTheDayTokens[i])) {
  alert(getPlayTranslations().alerts.missingSetup);
  throw new Error("wordToGuess mismatch");
}

// Cleanup one-time setup values
[
  "fullWord",
  "wordToGuess",
  "selectedIndices",
  "segmentLength",
  "maxAttempts",
].forEach(k => localStorage.removeItem(k));

// Guess slots (left → right)
guessSlots = selectedIndices;

// ==================== HINTS ====================
const hints = safeParseJSON("hints", []);
const hintOrder = localStorage.getItem("hintOrder") || "sequential";
let usedHints = [];
let hintIndex = 0;

function getNextHint() {
  const t = getPlayTranslations();

  if (!hints.length) return alert(t.alerts.noHints);

  if (hintOrder === "sequential") {
    if (hintIndex >= hints.length) return alert(t.alerts.noMoreHints);
    alert(hints[hintIndex++]);
  } else {
    if (usedHints.length >= hints.length) return alert(t.alerts.noMoreHints);
    const remaining = hints
      .map((_, i) => i)
      .filter(i => !usedHints.includes(i));
    const i = remaining[Math.floor(Math.random() * remaining.length)];
    usedHints.push(i);
    alert(hints[i]);
  }
}

document.getElementById("hintBtn")?.addEventListener("click", getNextHint);

// ==================== UI ====================
function updateAttemptsUI() {
  const el = document.getElementById("attempts");
  if (el) el.textContent = String(maxGuesses - currentRow);
}

// ==================== GAME INIT ====================
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
  const kb = getKeyboardById(keyboardId);
  return [...(kb?.tokens || []), "DEL", "ENTER"];
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
    const col = guessSlots[i];
    const tile = document.getElementById(`tile-${currentRow}-${col}`);
    if (tile) tile.textContent = currentGuess[i] || "";
  }
}

// ==================== GAME LOGIC ====================
function checkGuess() {
  const t = getPlayTranslations();
  const guess = currentGuess.slice();
  const feedback = Array(segmentLength).fill("absent");

  const counts = new Map();
  wordOfTheDayTokens.forEach(tok =>
    counts.set(tok, (counts.get(tok) || 0) + 1)
  );

  // Correct
  for (let i = 0; i < segmentLength; i++) {
    if (guess[i] === wordOfTheDayTokens[i]) {
      feedback[i] = "correct";
      counts.set(guess[i], counts.get(guess[i]) - 1);
    }
  }

  // Present
  for (let i = 0; i < segmentLength; i++) {
    if (feedback[i] !== "absent") continue;
    const tok = guess[i];
    if ((counts.get(tok) || 0) > 0) {
      feedback[i] = "present";
      counts.set(tok, counts.get(tok) - 1);
    }
  }

  // Apply
  for (let i = 0; i < segmentLength; i++) {
    const col = guessSlots[i];
    const tile = document.getElementById(`tile-${currentRow}-${col}`);
    if (!tile) continue;

    tile.classList.add(feedback[i]);

    if (feedback[i] === "correct") {
      correctTokens.add(guess[i]);
      presentTokens.delete(guess[i]);
      absentTokens.delete(guess[i]);
    } else if (feedback[i] === "present") {
      if (!correctTokens.has(guess[i])) presentTokens.add(guess[i]);
    } else {
      if (!correctTokens.has(guess[i]) && !presentTokens.has(guess[i])) {
        absentTokens.add(guess[i]);
      }
    }
  }

  if (guess.every((t, i) => t === wordOfTheDayTokens[i])) {
    alert(t.alerts.win);
    gameActive = false;
    renderKeyboard();
    return;
  }

  currentRow++;
  currentGuess = [];
  updateAttemptsUI();

  if (currentRow >= maxGuesses) {
    alert(t.alerts.lose(fullWordTokens.join(" ")));
    gameActive = false;
  }

  renderKeyboard();
}

// ==================== INIT ====================
startGame();
