// ==================== KEYBOARD ARRAYS ====================

import { KEYBOARDS } from './keyboardArrays.js';
import { TRANSLATIONS } from './translations.js';

// use KEYBOARDS
const keys_en = KEYBOARDS.en;
const keys_fr = KEYBOARDS.fr;
const keys_hiragana = KEYBOARDS.hiragana;
const keys_katakana = KEYBOARDS.katakana;
const keys_emoji = KEYBOARDS.emoji;



// ==================== GLOBAL STATE ====================
let currentWord = "";
let tiles = [];
let selectedStartIndex = null;
let segmentLength = 5;
let maxAttempts = 6;
let hintOrder = "sequential";
let currentLang = "en"; // default

// ==================== UI RENDERING ====================
function updateUI() {
  const t = TRANSLATIONS[currentLang === "fr" ? "fr" : "en"];

  document.querySelector("h1").innerHTML = t.title;
  document.querySelector(".instructions").innerHTML = t.instructions;
  document.querySelector("label[for='segmentLength']").innerHTML = t.segmentLengthLabel;
  document.querySelector("label[for='maxAttempts']").innerHTML = t.maxAttemptsLabel;
  document.querySelector("fieldset legend").innerHTML = t.hintsLegend;

  for (let i = 1; i <= 5; i++) {
    document.querySelector(`label[for='hint1']`).innerHTML = t.hintLabel(1);
    document.querySelector(`label[for='hint2']`).innerHTML = t.hintLabel(2);
    document.querySelector(`label[for='hint3']`).innerHTML = t.hintLabel(3);
    document.querySelector(`label[for='hint4']`).innerHTML = t.hintLabel(4);
    document.querySelector(`label[for='hint5']`).innerHTML = t.hintLabel(5);
  }

  document.querySelector("label[for='hintOrder']").innerHTML = t.hintOrderLabel;
  document.querySelector("#hintOrder option[value='sequential']").innerHTML = t.hintOrderSequential;
  document.querySelector("#hintOrder option[value='random']").innerHTML = t.hintOrderRandom;
  document.getElementById("validateBtn").innerHTML = t.validateButton;
}

// ==================== WORD TILES ====================
function renderWordTiles() {
  const wordDiv = document.getElementById("word");
  wordDiv.innerHTML = "";
  tiles = [];

  for (let i = 0; i < currentWord.length; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.textContent = currentWord[i] || "";
    tile.dataset.index = i;

    tile.addEventListener("click", () => {
      if (
        currentWord.length >= segmentLength &&
        i <= currentWord.length - segmentLength
      ) {
        selectedStartIndex = i;
        highlightSelectedTiles();
      } else {
        const t = translations[currentLang === "fr" ? "fr" : "en"];
        alert(t.alerts.selectSegment(segmentLength));
      }
    });

    tiles.push(tile);
    wordDiv.appendChild(tile);
  }

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
function handleKey(key) {
  if (key === "DEL") {
    currentWord = currentWord.slice(0, -1);
    if (
      selectedStartIndex !== null &&
      selectedStartIndex > currentWord.length - segmentLength
    ) {
      selectedStartIndex = null;
    }
  } else if (key === "ENTER") {
    saveGameSettings();
  } else if (currentWord.length < 10) {
    currentWord += key;
  }

  renderWordTiles();
}

function getActiveKeys() {
  if (currentLang === "fr") return [...keys_fr, "DEL", "ENTER"];
  if (currentLang === "en") return [...keys_en, "DEL", "ENTER"];
  if (currentLang === "hiragana") return [...keys_hiragana, "DEL", "ENTER"];
  if (currentLang === "katakana") return [...keys_katakana, "DEL", "ENTER"];
  if (currentLang === "emoji") return [...keys_emoji, "DEL", "ENTER"];
}

function renderKeyboard() {
  const kb = document.getElementById("keyboard");
  kb.innerHTML = "";
  getActiveKeys().forEach(key => {
    const btn = document.createElement("div");
    btn.className = "key";
    btn.textContent = key;
    btn.addEventListener("click", () => handleKey(key));
    kb.appendChild(btn);
  });
}

// ==================== HINTS ====================
function collectHints() {
  const hints = [];
  for (let i = 1; i <= 5; i++) {
    const hintValue = document.getElementById(`hint${i}`).value.trim();
    if (hintValue) {
      hints.push(hintValue);
    }
  }
  return hints;
}

// ==================== SAVE ====================
function saveGameSettings() {
  const t = translations[currentLang === "fr" ? "fr" : "en"];

  if (currentWord.length < 5 || currentWord.length > 10) {
    alert(t.alerts.wordLength);
    return;
  }
  if (selectedStartIndex === null) {
    alert(t.alerts.selectSegment(segmentLength));
    return;
  }
  
  const wordToGuess = currentWord
    .slice(selectedStartIndex, selectedStartIndex + segmentLength)
    .toUpperCase();

  const hints = collectHints();

  localStorage.setItem("wordToGuess", wordToGuess);
  localStorage.setItem("fullWord", currentWord.toUpperCase());
  localStorage.setItem("segmentLength", segmentLength);
  localStorage.setItem("maxAttempts", maxAttempts);
  localStorage.setItem("hints", JSON.stringify(hints));
  localStorage.setItem("hintOrder", hintOrder);
  localStorage.setItem("language", currentLang);

  alert(
    t.alerts.saved(wordToGuess, maxAttempts, hints.length, hintOrder)
  );
}

// ==================== EVENT LISTENERS ====================
document.getElementById("validateBtn").addEventListener("click", saveGameSettings);

document.getElementById("segmentLength").addEventListener("input", (e) => {
  segmentLength = parseInt(e.target.value, 10);
  selectedStartIndex = null;
  renderWordTiles();
});

document.getElementById("maxAttempts").addEventListener("input", (e) => {
  maxAttempts = parseInt(e.target.value, 10);
});

document.getElementById("hintOrder").addEventListener("change", (e) => {
  hintOrder = e.target.value;
});

document.getElementById("language").addEventListener("change", (e) => {
  currentLang = e.target.value;
  updateUI();
  renderKeyboard();
  renderWordTiles();
});

// ==================== INIT ====================
updateUI();
renderWordTiles();
renderKeyboard();
