// translations.js
// Centralised translations for Retrievle (Admin + Play)

export const translations = {
  // ==================== ENGLISH ====================
  en: {
    // ---------- ADMIN / CREATE ----------
    admin: {
      title: "Retrievle – Teacher Version",
      instructions: `
        <h3>How to set up a game</h3>
  <ol>
    <li>Use the keyboard below to enter a word, phrase, or expression (5–10 tokens).</li>
    <li>Choose how many tokens the player must guess, then select those tokens (they don’t have to be consecutive).</li>
    <li>Set the maximum number of attempts.</li>
    <li>Optionally, add up to five hints and choose whether they appear sequentially or at random.</li>
  </ol>
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
        wordLength: "The word, phrase, or expression must be between 5 and 10 tokens.",
        selectSegment: (len) => `Please select ${len} tokens.`,
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
        lose: (word) => `Too bad! The solution was: ${word}`,
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
<h3>Comment configurer une partie</h3>
<ol>
  <li>Utilisez le clavier ci-dessous pour saisir un mot, une expression ou une phrase (5 à 10 signes [caractères/symboles/syllabes/mots]).</li>
  <li>Choisissez le nombre de signes que le joueur devra deviner, puis sélectionnez-les (ils n’ont pas besoin d’être consécutifs).</li>
  <li>Définissez le nombre maximum de tentatives.</li>
  <li>Facultativement, ajoutez jusqu’à cinq indices et choisissez s’ils sont affichés de manière séquentielle ou aléatoire.</li>
</ol>

      `,
      segmentLengthLabel: "Nombre de signes à deviner :",
      maxAttemptsLabel: "Nombre maximum de tentatives :",
      hintsLegend: "Indices",
      hintLabel: (i) => `Indice ${i} :`,
      hintOrderLabel: "Ordre des indices :",
      hintOrderSequential: "Séquentiel",
      hintOrderRandom: "Aléatoire",
      validateButton: "Valider",
      alerts: {
        wordLength: "Le mot, l'expression, la phrase, doit contenir entre 5 et 10 signes.",
        selectSegment: (len) => `Veuillez sélectionner ${len} signes.`,
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
        lose: (word) => `Dommage ! La solution était : ${word}`,
        noHints: "Aucun indice n’a été défini.",
        noMoreHints: "Plus d’indices disponibles."
      }
    }
  }
};
