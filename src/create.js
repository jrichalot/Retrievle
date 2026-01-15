// ==================== IMPORTS ====================
import { KEYBOARDS } from "./keyboardArrays.js";
import { translations } from "./translations.js";

// ==================== GLOBAL STATE ====================
let currentTokens = [];               // Token-based
let tiles = [];
let selectedIndices = new Set();      // ✅ non-consecutive selection

let segmentLength = 5;                // N tiles to guess
let maxAttempts = 6;
let hintOrder = "sequential";

let keyboardLang = "en";              // drives KEYBOARDS
let uiLang = "en";                    // drives translations (fallback to EN if missing)

// ==================== HELPERS ====================
function getAdminTranslations() {
  return translations[uiLang]?.admin || translations["en"].admin;
}

function normalizeSelectionToSegmentLength() {
  // If N decreased, trim selection (remove highest indices first)
  while (selectedIndices.size > segmentLength) {
    const max = Math.max(...selectedIndices);
    selectedIndices.delete(max);
  }
}

function clampSelectionToTokenLength() {
  // Remove any selected indices that are out of range after deletions
  const n = currentTokens.length;
  selectedIndices = new Set([...selectedIndices].filter(i => i >= 0 && i < n));
  normalizeSelectionToSegmentLength();
}

// ==================== LANGUAGE SELECTOR ====================
function renderLanguageSelector() {
  const select = document.getElementById("language");
  select.innerHTML = "";

  const labels = {
    en: "English",
    fr: "Français",
    hiragana: "日本語 (ひらがな)",
    katakana: "日本語 (カタカナ)",
    emoji: "Emoji",
    fr_food: "Français – Nourriture",
    zh_basic: "中文 – 基础"
  };

  Object.keys(KEYBOARDS).forEach(lang => {
    const option = document.createElement("option");
    option.value = lang;
    option.textContent = labels[lang] || lang;
    select.appendChild(option);
  });

  select.value = keyboardLang;
}

// ==================== UI TEXT ====================
function updateUI() {
  const t = getAdminTranslations();

  document.querySelector("h1").textContent = t.title;
  // NOTE: if your instructions contain HTML, use innerHTML instead of textContent.
  document.querySelector(".instructions").innerHTML = t.instructions;

  document.querySelector("label[for='segmentLength']").textContent = t.segmentLengthLabel;
  document.querySelector("label[for='maxAttempts']").textContent = t.maxAttemptsLabel;
  document.querySelector("fieldset legend").textContent = t.hintsLegend;

  for (let i = 1; i <= 5; i++) {
    const label = document.querySelector(`label[for='hint${i}']`);
    if (label) label.textContent = t.hintLabel(i);
  }

  const hintOrderLabel = document.querySelector("label[for='hintOrder']");
  if (hintOrderLabel) hintOrderLabel.textContent = t.hintOrderLabel;

  const sequentialOption = document.querySelector("#hintOrder option[value='sequential']");
  const randomOption = document.querySelector("#hintOrder option[value='random']");
  if (sequentialOption) sequentialOption.textContent = t.hintOrderSequential;
  if (randomOption) randomOption.textContent = t.hintOrderRandom;

  const validateBtn = document.getElementById("validateBtn");
  if (validateBtn) validateBtn.textContent = t.validateButton;
}

// ==================== WORD TILES ====================
function renderWordTiles() {
  const wordDiv = document.getElementById("word");
  wordDiv.innerHTML = "";
  tiles = [];

  currentTokens.forEach((token, i) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.textContent = token;
    tile.dataset.index = i;

    tile.addEventListener("click", () => {
      // Toggle selection
      if (selectedIndices.has(i)) {
        selectedIndices.delete(i);
      } else {
        // Only allow selecting if we haven't reached N yet
        if (selectedIndices.size >= segmentLength) {
          const t = getAdminTranslations();
          alert(t.alerts.selectSegment(segmentLength));
          return;
        }
        selectedIndices.add(i);
      }
      highlightSelectedTiles();
    });

    tiles.push(tile);
    wordDiv.appendChild(tile);
  });

  highlightSelectedTiles();
}

function highlightSelectedTiles() {
  tiles.forEach((tile, index) => {
    tile.classList.toggle("green", selectedIndices.has(index));
  });
}

// ==================== KEYBOARD ====================
function handleKey(token) {
  if (token === "DEL") {
    currentTokens.pop();
    clampSelectionToTokenLength();
  } else if (token === "ENTER") {
    saveGameSettings();
    return;
  } else if (currentTokens.length < 10) {
    currentTokens.push(token);
  }

  renderWordTiles();
}

function getActiveKeys() {
  const keys = KEYBOARDS[keyboardLang] || KEYBOARDS.en;
  return [...keys, "DEL", "ENTER"];
}

function renderKeyboard() {
  const kb = document.getElementById("keyboard");
  kb.innerHTML = "";

  getActiveKeys().forEach(token => {
    const btn = document.createElement("div");
    btn.className = "key";
    btn.textContent = token;
    btn.addEventListener("click", () => handleKey(token));
    kb.appendChild(btn);
  });
}

// ==================== HINTS ====================
function collectHints() {
  const hints = [];
  for (let i = 1; i <= 5; i++) {
    const value = document.getElementById(`hint${i}`)?.value.trim();
    if (value) hints.push(value);
  }
  return hints;
}

// ==================== SAVE GAME ====================
function saveGameSettings() {
  const t = getAdminTranslations();

  // Require enough tokens to make a meaningful game
  if (currentTokens.length < segmentLength) {
    alert(t.alerts.wordLength);
    return;
  }

  // Require exactly N selected tiles
  if (selectedIndices.size !== segmentLength) {
    alert(t.alerts.selectSegment(segmentLength));
    return;
  }

  const sortedIndices = [...selectedIndices].sort((a, b) => a - b);
  const wordToGuessTokens = sortedIndices.map(i => currentTokens[i]);

  localStorage.setItem("wordToGuess", JSON.stringify(wordToGuessTokens));
  localStorage.setItem("fullWord", JSON.stringify(currentTokens));

  // Keep segmentLength as "number of tiles to guess"
  localStorage.setItem("segmentLength", segmentLength);

  // ✅ NEW: store the indices so play.js can blank/reveal correctly
  localStorage.setItem("selectedIndices", JSON.stringify(sortedIndices));

  localStorage.setItem("maxAttempts", maxAttempts);
  localStorage.setItem("hints", JSON.stringify(collectHints()));
  localStorage.setItem("hintOrder", hintOrder);
  localStorage.setItem("language", keyboardLang);

  alert(
    t.alerts.saved(
      wordToGuessTokens.join(" "),
      maxAttempts,
      collectHints().length,
      hintOrder
    )
  );
}

// ==================== EVENT LISTENERS ====================
document.getElementById("validateBtn").addEventListener("click", saveGameSettings);

document.getElementById("segmentLength").addEventListener("input", e => {
  segmentLength = parseInt(e.target.value, 10);

  // Reset or trim selection if needed
  normalizeSelectionToSegmentLength();
  highlightSelectedTiles();
});

document.getElementById("maxAttempts").addEventListener("input", e => {
  maxAttempts = parseInt(e.target.value, 10);
});

document.getElementById("hintOrder").addEventListener("change", e => {
  hintOrder = e.target.value;
});

document.getElementById("language").addEventListener("change", e => {
  keyboardLang = e.target.value;

  // UI text only switches if translations exist for that lang
  if (translations[keyboardLang]) {
    uiLang = keyboardLang;
  } else {
    uiLang = "en";
  }

  updateUI();
  renderKeyboard();
  // Keep current tokens/selection; just rerender
  renderWordTiles();
});

// ==================== INIT ====================
renderLanguageSelector();
updateUI();
renderKeyboard();
renderWordTiles();
