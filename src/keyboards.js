import {
    getKeyboardOptions,
    getKeyboardById,
    isProtectedKeyboardId,
    upsertUserKeyboard,
    deleteUserKeyboard,
    parseTokensFromText,
    downloadUserKeyboardsJson,
    importUserKeyboardsFromJsonString
  } from "./keyboardStore.js";
  
  const kbSelect = document.getElementById("kbSelect");
  const tokensText = document.getElementById("tokensText");
  const preview = document.getElementById("preview");
  
  const createBtn = document.getElementById("createKbBtn");
  const renameBtn = document.getElementById("renameKbBtn");
  const duplicateBtn = document.getElementById("duplicateKbBtn");
  const deleteBtn = document.getElementById("deleteKbBtn");
  
  const saveTokensBtn = document.getElementById("saveTokensBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");
  
  function renderPreview(tokens) {
    preview.innerHTML = "";
    (tokens || []).forEach(t => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = t;
      preview.appendChild(tile);
    });
  }
  
  function setControlsForSelection(id) {
    const protectedKb = isProtectedKeyboardId(id);
  
    // Protected can only be duplicated; tokens editing disabled
    renameBtn.disabled = protectedKb;
    deleteBtn.disabled = protectedKb;
    saveTokensBtn.disabled = protectedKb;
    tokensText.disabled = protectedKb;
  
    if (protectedKb) {
      tokensText.value = "(Protected keyboard — duplicate to edit)";
    }
  }
  
  function refreshSelector(selectId = null) {
    const options = getKeyboardOptions();
  
    kbSelect.innerHTML = "";
  
    // Grouped display
    const builtins = options.filter(o => o.kind === "builtin");
    const users = options.filter(o => o.kind === "user");
  
    if (builtins.length) {
      const og = document.createElement("optgroup");
      og.label = "Built-in (protected)";
      builtins.forEach(o => {
        const opt = document.createElement("option");
        opt.value = o.id;
        opt.textContent = o.name;
        og.appendChild(opt);
      });
      kbSelect.appendChild(og);
    }
  
    if (users.length) {
      const og = document.createElement("optgroup");
      og.label = "My keyboards";
      users.forEach(o => {
        const opt = document.createElement("option");
        opt.value = o.id;
        opt.textContent = o.name;
        og.appendChild(opt);
      });
      kbSelect.appendChild(og);
    }
  
    // Select desired
    const fallback = builtins[0]?.id || users[0]?.id || "";
    kbSelect.value = selectId || kbSelect.value || fallback;
  
    loadSelectedIntoEditor();
  }
  
  function loadSelectedIntoEditor() {
    const id = kbSelect.value;
    const kb = getKeyboardById(id);
    if (!kb) return;
  
    setControlsForSelection(id);
  
    if (!isProtectedKeyboardId(id)) {
      tokensText.value = (kb.tokens || []).join("\n");
    }
  
    renderPreview(kb.tokens || []);
  }
  
  function ensureNotProtected(id) {
    if (isProtectedKeyboardId(id)) {
      alert("This keyboard is protected. Duplicate it to edit.");
      return false;
    }
    return true;
  }
  
  function duplicateKeyboard(id) {
    const kb = getKeyboardById(id);
    if (!kb) return;
  
    const baseName = kb.name || "Keyboard";
    const newName = `${baseName} (copy)`;
  
    // Create as a user keyboard
    const created = upsertUserKeyboard({
      name: newName,
      tokens: kb.tokens
    });
  
    refreshSelector(`user:${created.id}`);
  }
  
  createBtn.addEventListener("click", () => {
    const name = prompt("Keyboard name?");
    if (!name) return;
  
    // Create with 1 placeholder token so it passes store validation;
    // user can replace immediately.
    const created = upsertUserKeyboard({
      name,
      tokens: ["token"]
    });
  
    refreshSelector(`user:${created.id}`);
  });
  
  renameBtn.addEventListener("click", () => {
    const id = kbSelect.value;
    if (!ensureNotProtected(id)) return;
  
    const kb = getKeyboardById(id);
    if (!kb) return;
  
    const newName = prompt("New keyboard name:", kb.name);
    if (!newName) return;
  
    // Update user kb by id (strip prefix)
    const rawId = id.replace("user:", "");
    upsertUserKeyboard({
      id: rawId,
      name: newName,
      tokens: kb.tokens
    });
  
    refreshSelector(id);
  });
  
  duplicateBtn.addEventListener("click", () => {
    duplicateKeyboard(kbSelect.value);
  });
  
  deleteBtn.addEventListener("click", () => {
    const id = kbSelect.value;
    if (!ensureNotProtected(id)) return;
  
    const kb = getKeyboardById(id);
    if (!kb) return;
  
    if (!confirm(`Delete "${kb.name}"? This cannot be undone.`)) return;
  
    deleteUserKeyboard(id.replace("user:", ""));
    refreshSelector();
  });
  
  saveTokensBtn.addEventListener("click", () => {
    const id = kbSelect.value;
    if (!ensureNotProtected(id)) return;
  
    const kb = getKeyboardById(id);
    if (!kb) return;
  
    const tokens = parseTokensFromText(tokensText.value);
    if (tokens.length === 0) {
      alert("Please add at least 1 token.");
      return;
    }
  
    upsertUserKeyboard({
      id: id.replace("user:", ""),
      name: kb.name,
      tokens
    });
  
    refreshSelector(id);
  });
  
  exportBtn.addEventListener("click", () => {
    downloadUserKeyboardsJson();
  });
  
  importBtn.addEventListener("click", () => {
    importFile.click();
  });
  
  importFile.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    if (!file) return;
  
    const text = await file.text();
    try {
      const result = importUserKeyboardsFromJsonString(text);
      alert(`Import complete: ${result.imported} imported, ${result.skipped} skipped.`);
      refreshSelector();
    } catch (e) {
      alert(`Import failed: ${e.message || e}`);
    } finally {
      importFile.value = "";
    }
  });
  
  kbSelect.addEventListener("change", loadSelectedIntoEditor);
  
  // Init
  refreshSelector();
  