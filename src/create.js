// ==================== IMPORTS ====================
import { KEYBOARDS } from "./keyboardArrays.js";
import { translations } from "./translations.js";

// ==================== GLOBAL STATE ====================
let currentTokens = [];            // Token-based
let tiles = [];
let selectedStartIndex = null;

let segmentLength = 5;
let maxAttempts = 6;
let hintOrder = "sequential";

let keyboardLang = "en";           // drives KEYBOARDS
let uiLang = "en";                 // drives translations (fallback to EN if missing)

// ==================== LANGUAGE SELECTOR ====================
function renderLanguageSelector() {
  const select = document.getElementById("language");
  select.innerHTML = "";

  const labels = {
    en: "English",
    fr: "Français",
    hiragana: "日本語 (ひらがな)",
    katakana: "日本語 (カタカナ)",
    emoji: "Emoji"
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
  const t = translations[uiLang]?.admin || translations["en"].admin;

  document.querySelector("h1").textContent = t.title;
  document.querySelector(".instructions").textContent = t.instructions;
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
      if (
        currentTokens.length >= segmentLength &&
        i <= currentTokens.length - segmentLength
      ) {
        selectedStartIndex = i;
        highlightSelectedTiles();
      } else {
        const t = translations[uiLang]?.admin || translations["en"].admin;
        alert(t.alerts.selectSegment(segmentLength));
      }
    });

    tiles.push(tile);
    wordDiv.appendChild(tile);
  });

  highlightSelectedTiles();
}

function highlightSelectedTiles() {
  tiles.forEach((tile, index) => {
    tile.classList.remove("green");
    if (
      selectedStartIndex !== null &&
      index >= selectedStartIndex &&
      index < selectedStartIndex + segmentLength
    ) {
      tile.classList.add("green");
    }
  });
}

// ==================== KEYBOARD ====================
function handleKey(token) {
  if (token === "DEL") {
    currentTokens.pop();
    if (
      selectedStartIndex !== null &&
      selectedStartIndex > currentTokens.length - segmentLength
    ) {
      selectedStartIndex = null;
    }
  } else if (token === "ENTER") {
    saveGameSettings();
    return;
  } else if (currentTokens.length < 10) {
    currentTokens.push(token);
  }

  renderWordTiles();
}

function getActiveKeys() {
  return [...KEYBOARDS[keyboardLang], "DEL", "ENTER"];
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
  const t = translations[uiLang]?.admin || translations["en"].admin;

  if (currentTokens.length < segmentLength) {
    alert(t.alerts.wordLength);
    return;
  }

  if (selectedStartIndex === null) {
    alert(t.alerts.selectSegment(segmentLength));
    return;
  }

  const wordToGuessTokens = currentTokens.slice(
    selectedStartIndex,
    selectedStartIndex + segmentLength
  );

  localStorage.setItem("wordToGuess", JSON.stringify(wordToGuessTokens));
  localStorage.setItem("fullWord", JSON.stringify(currentTokens));
  localStorage.setItem("segmentLength", segmentLength);
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
  selectedStartIndex = null;
  renderWordTiles();
});

document.getElementById("maxAttempts").addEventListener("input", e => {
  maxAttempts = parseInt(e.target.value, 10);
});

document.getElementById("hintOrder").addEventListener("change", e => {
  hintOrder = e.target.value;
});

document.getElementById("language").addEventListener("change", e => {
  keyboardLang = e.target.value;
  if (translations[keyboardLang]) {
    uiLang = keyboardLang; // only switch UI text for EN or FR
  }

  updateUI();
  renderKeyboard();
  renderWordTiles();
});

// ==================== INIT ====================
renderLanguageSelector();
updateUI();
renderKeyboard();
renderWordTiles();
