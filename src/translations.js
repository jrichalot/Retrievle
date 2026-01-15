// translations.js
// Centralised translations for Retrievle (Admin + Play)

export const translations = {
  // ==================== ENGLISH ====================
  en: {
    // ---------- ADMIN / CREATE ----------
    admin: {
      title: "Retrievle – Teacher Version",
      instructions: `
        <p>Enter a word of 5 to 10 characters using the keyboard below.</p>
        <p>Select how many consecutive characters must be guessed.</p>
        <p>Set the maximum number of attempts allowed.</p>
        <p>Add up to 5 hints (optional). They can be given sequentially or randomly.</p>
      `,
      segmentLengthLabel: "Number of characters to guess:",
      maxAttemptsLabel: "Maximum number of attempts:",
      hintsLegend: "Hints",
      hintLabel: (i) => `Hint ${i}:`,
      hintOrderLabel: "Order of hints:",
      hintOrderSequential: "Sequential",
      hintOrderRandom: "Random",
      validateButton: "Validate",
      alerts: {
        wordLength: "The word must be between 5 and 10 characters.",
        selectSegment: (len) => `Please select ${len} consecutive characters.`,
        saved: (word, attempts, hints, order) =>
          `Word saved: ${word}\n(Max attempts: ${attempts})\n(Hints: ${hints}, Mode: ${order})`
      }
    },

    // ---------- PLAY ----------
    play: {
      title: "Retrievle – Player",
      hintButton: "💡 Hint",
      alerts: {
        missingSetup: "Game not configured. Please ask the teacher.",
        win: "Well done!",
        lose: (word) => `Too bad! The word was: ${word}`,
        noHints: "No hints have been defined.",
        noMoreHints: "No more hints available."
      }
    }
  },

  // ==================== FRENCH ====================
  fr: {
    // ---------- ADMIN / CREATE ----------
    admin: {
      title: "Retrievle – Version Enseignant",
      instructions: `
        <p>Entrez un mot de 5 à 10 lettres à l’aide du clavier ci-dessous.</p>
        <p>Choisissez le nombre de lettres consécutives à deviner.</p>
        <p>Définissez le nombre maximum de tentatives.</p>
        <p>Ajoutez jusqu’à 5 indices (facultatifs), séquentiels ou aléatoires.</p>
      `,
      segmentLengthLabel: "Nombre de lettres à deviner :",
      maxAttemptsLabel: "Nombre maximum de tentatives :",
      hintsLegend: "Indices",
      hintLabel: (i) => `Indice ${i} :`,
      hintOrderLabel: "Ordre des indices :",
      hintOrderSequential: "Séquentiel",
      hintOrderRandom: "Aléatoire",
      validateButton: "Valider",
      alerts: {
        wordLength: "Le mot doit contenir entre 5 et 10 lettres.",
        selectSegment: (len) => `Veuillez sélectionner ${len} lettres consécutives.`,
        saved: (word, attempts, hints, order) =>
          `Mot enregistré : ${word}\n(Tentatives max : ${attempts})\n(Indices : ${hints}, Mode : ${order})`
      }
    },

    // ---------- PLAY ----------
    play: {
      title: "Retrievle – Élève",
      hintButton: "💡 Indice",
      alerts: {
        missingSetup: "Paramètres manquants. Veuillez utiliser l’interface enseignant.",
        win: "Bravo !",
        lose: (word) => `Dommage ! Le mot était : ${word}`,
        noHints: "Aucun indice n’a été défini.",
        noMoreHints: "Plus d’indices disponibles."
      }
    }
  }
};
