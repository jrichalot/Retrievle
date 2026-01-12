export const TRANSLATIONS = {
    en: {
      title: "Retrievle – Teacher Version",
      instructions: `
        <p>Enter a word of 5 to 10 characters using the keyboard below.</p>
        <p>Select how many consecutive characters (1 to the word length) must be guessed.</p>
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
  
    fr: {
      title: "Retrievle – Version Enseignant",
      instructions: `
        <p>Entrez un mot de 5 à 10 lettres en utilisant le clavier ci-dessous.</p>
        <p>Choisissez combien de lettres consécutives (1 à la longueur du mot) seront à deviner.</p>
        <p>Définissez le nombre maximum de tentatives autorisées.</p>
        <p>Ajoutez jusqu’à 5 indices (facultatifs). Ils peuvent être donnés séquentiellement ou aléatoirement.</p>
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
          `Mot enregistré : ${word}\n(Tentatives max : ${attempts})\n(Nombre d'indices : ${hints}, Mode : ${order})`
      }
    }
  };
  