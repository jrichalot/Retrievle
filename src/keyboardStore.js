// keyboardStore.js
// Phase 1: local keyboards + protected built-ins
// - Protected: en, fr, hiragana, katakana (from KEYBOARDS)
// - User keyboards: stored in localStorage
//
// IDs:
// - Built-in: "builtin:<key>"   e.g. "builtin:en"
// - User:     "user:<id>"       e.g. "user:kb_ab12cd"

import { KEYBOARDS } from "./keyboardArrays.js";

const STORAGE_KEY = "retrievle_user_keyboards_v1";

// Only these built-ins are protected (not editable/deletable)
export const PROTECTED_BUILTINS = ["en", "fr", "hiragana", "katakana"];

const DEFAULT_LABELS = {
  en: "English (protected)",
  fr: "Français (protected)",
  hiragana: "日本語 (ひらがな) (protected)",
  katakana: "日本語 (カタカナ) (protected)"
};

// -------------------- Utilities --------------------
function now() {
  return Date.now();
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function normalizeToken(t) {
  // Keep case as-is (you explicitly said words don't need capitals)
  // Trim only; do not upper-case.
  return String(t ?? "").trim();
}

function dedupePreserveOrder(tokens) {
  const out = [];
  const seen = new Set();
  for (const t of tokens) {
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function parseTokensFromText(text) {
  // Accept commas, newlines, tabs; collapse multiple separators.
  // Users can paste: "pomme, riz\nbanane"
  const raw = String(text ?? "")
    .split(/[\n,\t]+/g)
    .map(s => normalizeToken(s))
    .filter(Boolean);

  return dedupePreserveOrder(raw);
}

function makeId() {
  // Simple local unique id
  return "kb_" + Math.random().toString(16).slice(2) + "_" + now().toString(16);
}

function isBuiltinId(id) {
  return typeof id === "string" && id.startsWith("builtin:");
}

function isUserId(id) {
  return typeof id === "string" && id.startsWith("user:");
}

function builtinKeyFromId(id) {
  return id.replace("builtin:", "");
}

function userKeyFromId(id) {
  return id.replace("user:", "");
}

// -------------------- Load / Save user keyboards --------------------
export function loadUserKeyboards() {
  const arr = safeJsonParse(localStorage.getItem(STORAGE_KEY), []);
  if (!Array.isArray(arr)) return [];

  // sanitize shape
  return arr
    .map(kb => ({
      id: typeof kb?.id === "string" ? kb.id : makeId(),
      name: typeof kb?.name === "string" ? kb.name : "Untitled keyboard",
      tokens: Array.isArray(kb?.tokens) ? kb.tokens.map(normalizeToken).filter(Boolean) : [],
      createdAt: typeof kb?.createdAt === "number" ? kb.createdAt : now(),
      updatedAt: typeof kb?.updatedAt === "number" ? kb.updatedAt : now()
    }))
    .map(kb => ({ ...kb, tokens: dedupePreserveOrder(kb.tokens) }))
    .filter(kb => kb.tokens.length > 0);
}

export function saveUserKeyboards(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// Create or update a user keyboard
export function upsertUserKeyboard({ id, name, tokens }) {
  const list = loadUserKeyboards();

  const cleanedTokens = dedupePreserveOrder((tokens || []).map(normalizeToken).filter(Boolean));
  if (cleanedTokens.length === 0) {
    throw new Error("Keyboard must contain at least 1 token.");
  }

  const cleanedName = normalizeToken(name) || "Untitled keyboard";

  // if id not provided -> create new
  if (!id) {
    const kb = {
      id: makeId(),
      name: cleanedName,
      tokens: cleanedTokens,
      createdAt: now(),
      updatedAt: now()
    };
    list.push(kb);
    saveUserKeyboards(list);
    return kb;
  }

  // update existing
  const idx = list.findIndex(kb => kb.id === id);
  if (idx === -1) {
    // treat as new if not found (safer than failing)
    const kb = {
      id,
      name: cleanedName,
      tokens: cleanedTokens,
      createdAt: now(),
      updatedAt: now()
    };
    list.push(kb);
    saveUserKeyboards(list);
    return kb;
  }

  list[idx] = {
    ...list[idx],
    name: cleanedName,
    tokens: cleanedTokens,
    updatedAt: now()
  };

  saveUserKeyboards(list);
  return list[idx];
}

export function deleteUserKeyboard(id) {
  const list = loadUserKeyboards();
  const next = list.filter(kb => kb.id !== id);
  saveUserKeyboards(next);
}

// -------------------- Unified keyboard catalogue (protected + users) --------------------
export function getKeyboardOptions() {
  // Only show protected built-ins + user keyboards (as you requested).
  const builtins = PROTECTED_BUILTINS
    .filter(k => Array.isArray(KEYBOARDS[k]) && KEYBOARDS[k].length > 0)
    .map(k => ({
      id: `builtin:${k}`,
      kind: "builtin",
      protected: true,
      key: k,
      name: DEFAULT_LABELS[k] || `${k} (protected)`,
      tokens: KEYBOARDS[k]
    }));

  const users = loadUserKeyboards().map(kb => ({
    id: `user:${kb.id}`,
    kind: "user",
    protected: false,
    key: kb.id,
    name: kb.name,
    tokens: kb.tokens,
    createdAt: kb.createdAt,
    updatedAt: kb.updatedAt
  }));

  return [...builtins, ...users];
}

export function getKeyboardById(id) {
  if (isBuiltinId(id)) {
    const key = builtinKeyFromId(id);
    const tokens = KEYBOARDS[key];
    if (!tokens) return null;
    return {
      id,
      kind: "builtin",
      protected: PROTECTED_BUILTINS.includes(key),
      name: DEFAULT_LABELS[key] || key,
      tokens
    };
  }

  if (isUserId(id)) {
    const userId = userKeyFromId(id);
    const kb = loadUserKeyboards().find(k => k.id === userId);
    if (!kb) return null;
    return {
      id,
      kind: "user",
      protected: false,
      name: kb.name,
      tokens: kb.tokens
    };
  }

  // Back-compat: if you stored just "en" earlier etc.
  if (typeof id === "string" && KEYBOARDS[id]) {
    const key = id;
    return {
      id: `builtin:${key}`,
      kind: "builtin",
      protected: PROTECTED_BUILTINS.includes(key),
      name: DEFAULT_LABELS[key] || key,
      tokens: KEYBOARDS[key]
    };
  }

  return null;
}

export function isProtectedKeyboardId(id) {
  const kb = getKeyboardById(id);
  return !!kb?.protected;
}

// -------------------- Export / Import --------------------
export function exportUserKeyboardsToJsonString() {
  const payload = {
    app: "retrievle",
    version: 1,
    exportedAt: new Date().toISOString(),
    keyboards: loadUserKeyboards()
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadUserKeyboardsJson(filename = "") {
  const json = exportUserKeyboardsToJsonString();
  const blob = new Blob([json], { type: "application/json" });

  const safeName =
    filename ||
    `retrievle-keyboards-${new Date().toISOString().slice(0, 10)}.json`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

/**
 * Import JSON payload produced by exportUserKeyboardsToJsonString.
 * Merge strategy:
 * - If an imported keyboard has same name AND same tokens -> skip
 * - If same name but different tokens -> import with " (imported)" suffix
 * Returns summary object.
 */
export function importUserKeyboardsFromJsonString(jsonText) {
  const parsed = safeJsonParse(jsonText, null);
  if (!parsed || !Array.isArray(parsed.keyboards)) {
    throw new Error("Invalid import file (missing keyboards array).");
  }

  const existing = loadUserKeyboards();
  const existingSignatures = new Set(
    existing.map(kb => signature(kb.name, kb.tokens))
  );

  let imported = 0;
  let skipped = 0;

  for (const raw of parsed.keyboards) {
    const name = normalizeToken(raw?.name) || "Untitled keyboard";
    const tokens = dedupePreserveOrder(
      (Array.isArray(raw?.tokens) ? raw.tokens : []).map(normalizeToken).filter(Boolean)
    );

    if (tokens.length === 0) {
      skipped++;
      continue;
    }

    const sig = signature(name, tokens);
    if (existingSignatures.has(sig)) {
      skipped++;
      continue;
    }

    // name collision with different content? add suffix
    let finalName = name;
    if (existing.some(kb => kb.name === finalName)) {
      finalName = `${finalName} (imported)`;
    }

    existing.push({
      id: makeId(),
      name: finalName,
      tokens,
      createdAt: now(),
      updatedAt: now()
    });

    existingSignatures.add(signature(finalName, tokens));
    imported++;
  }

  saveUserKeyboards(existing);
  return { imported, skipped, total: parsed.keyboards.length };
}

function signature(name, tokens) {
  return `${name}::${tokens.join("|")}`;
}
