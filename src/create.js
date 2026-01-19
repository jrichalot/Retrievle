// ==================== IMPORTS ====================
import { translations } from "./translations.js";
import {
  getKeyboardOptions,
  getKeyboardById,
} from "./keyboardStore.js";

// ==================== GLOBAL STATE ====================
let currentTokens = [];
let tiles = [];
let selectedIndices = new Set();

let segmentLength = 5;
let maxAttempts = 6;
let hintOrder = "sequential";

// NEW keyboard system
let keyboardId = "builtin:en";
let uiLang = "en";

// ==================== HELPERS ====================
function getAdminTranslations() {
  return translations[uiLang]?.admin || translations["en"].admin;
}

function setUiLangFromKeyboardId() {
  const kb = getKeyboardById(keyboardId);
  if (!kb || kb.kind !== "builtin") {
    uiLang = "en";
    return;
  }

  const key = keyboardId.replace("builtin:", "");
  uiLang = translations[key] ? key : "en";
}

function normalizeSelectionToSegmentLength() {
  while (selectedIndices.size > segmentLength) {
    const max = Math.max(...selectedIndices);
    selectedIndices.delete(max);
  }
}

function clampSelectionToTokenLength() {
  const n = currentTokens.length;
  selectedIndices = new Set([...selectedIndices].filter(i => i >= 0 && i < n));
  normalizeSelectionToSegmentLength();
}

// ==================== KEYBOARD SELECTOR ====================
function renderKeyboardSelector() {
  const select = document.getElementById("language");
  select.innerHTML = "";

  const options = getKeyboardOptions();

  options.forEach(kb => {
    const option = document.createElement("option");
    option.value = kb.id;
    option.textContent = kb.name;
    select.appendChild(option);
  });

  // Restore previous selection if possible
  if (getKeyboardById(keyboardId)) {
    select.value = keyboardId;
  } else {
    keyboardId = "builtin:en";
    select.value = keyboardId;
  }
}

// ==================== UI TEXT ====================
function updateUI() {
  const t = getAdminTranslations();

  document.querySelector("h1").textContent = t.title;
  document.querySelector(".instructions").innerHTML = t.instructions;

  document.querySelector("label[for='segmentLength']").textContent =
    t.segmentLengthLabel;
  document.querySelector("label[for='maxAttempts']").textContent =
    t.maxAttemptsLabel;

  document.querySelector("fieldset legend").textContent = t.hintsLegend;

  for (let i = 1; i <= 5; i++) {
    const label = document.querySelector(`label[for='hint${i}']`);
    if (label) label.textContent = t.hintLabel(i);
  }

  const hintOrderLabel = document.querySelector("label[for='hintOrder']");
  if (hintOrderLabel) hintOrderLabel.textContent = t.hintOrderLabel;

  const seq = document.querySelector("#hintOrder option[value='sequential']");
  const rnd = document.querySelector("#hintOrder option[value='random']");
  if (seq) seq.textContent = t.hintOrderSequential;
  if (rnd) rnd.textContent = t.hintOrderRandom;

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
      if (selectedIndices.has(i)) {
        selectedIndices.delete(i);
      } else {
        if (selectedIndices.size >= segmentLength) {
          alert(getAdminTranslations().alerts.selectSegment(segmentLength));
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
  const kb = getKeyboardById(keyboardId);
  return [...(kb?.tokens || []), "DEL", "ENTER"];
}

function renderKeyboard() {
  const kbDiv = document.getElementById("keyboard");
  kbDiv.innerHTML = "";

  getActiveKeys().forEach(token => {
    const btn = document.createElement("div");
    btn.className = "key";
    btn.textContent = token;
    btn.addEventListener("click", () => handleKey(token));
    kbDiv.appendChild(btn);
  });
}

// ==================== HINTS ====================
function collectHints() {
  const hints = [];
  for (let i = 1; i <= 5; i++) {
    const v = document.getElementById(`hint${i}`)?.value.trim();
    if (v) hints.push(v);
  }
  return hints;
}

// ==================== SAVE GAME ====================
function saveGameSettings() {
  const t = getAdminTranslations();

  if (currentTokens.length < segmentLength) {
    alert(t.alerts.wordLength);
    return;
  }

  if (selectedIndices.size !== segmentLength) {
    alert(t.alerts.selectSegment(segmentLength));
    return;
  }

  const sortedIndices = [...selectedIndices].sort((a, b) => a - b);
  const wordToGuessTokens = sortedIndices.map(i => currentTokens[i]);

  localStorage.setItem("fullWord", JSON.stringify(currentTokens));
  localStorage.setItem("wordToGuess", JSON.stringify(wordToGuessTokens));
  localStorage.setItem("selectedIndices", JSON.stringify(sortedIndices));
  localStorage.setItem("segmentLength", segmentLength);
  localStorage.setItem("maxAttempts", maxAttempts);
  localStorage.setItem("hints", JSON.stringify(collectHints()));
  localStorage.setItem("hintOrder", hintOrder);

  // 🔑 NEW
  localStorage.setItem("keyboardId", keyboardId);

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
document.getElementById("validateBtn")
  .addEventListener("click", saveGameSettings);

document.getElementById("segmentLength")
  .addEventListener("input", e => {
    segmentLength = parseInt(e.target.value, 10);
    normalizeSelectionToSegmentLength();
    highlightSelectedTiles();
  });

document.getElementById("maxAttempts")
  .addEventListener("input", e => {
    maxAttempts = parseInt(e.target.value, 10);
  });

document.getElementById("hintOrder")
  .addEventListener("change", e => {
    hintOrder = e.target.value;
  });

document.getElementById("language")
  .addEventListener("change", e => {
    keyboardId = e.target.value;
    setUiLangFromKeyboardId();
    updateUI();
    renderKeyboard();
    renderWordTiles();
  });

// ==================== INIT ====================
renderKeyboardSelector();
setUiLangFromKeyboardId();
updateUI();
renderKeyboard();
renderWordTiles();
