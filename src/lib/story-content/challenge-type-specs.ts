/**
 * Challenge output contract aligned with FAKE_PREVIEW_STORY in
 * story-preview-interface/_data/data.ts and toReadingStory() mapping.
 */
export const MIN_CHALLENGE_PLACEMENT_CHAPTER = 3;

export const CHALLENGE_OUTPUT_CONTRACT = `Each challenge is placed on one chapter via placementChapterOrder.
Each challenge needs: order (1..N), type, placementChapterOrder, question, hints (exactly 2 strings).
Hints must guide the child without revealing the answer. Keep hints short (one sentence each).

Placement rule (important):
- placementChapterOrder is the chapter the child has just finished reading before the challenge appears.
- Chapters 1 and 2 are warmup reading only — NEVER set placementChapterOrder to 1 or 2.
- Every challenge must use placementChapterOrder >= ${MIN_CHALLENGE_PLACEMENT_CHAPTER}.
- The child should read at least two full chapters before any challenge.

Global rules:
- Answers use order starting at 1 (display order).
- Do not include ids — the database generates them.
- READ_ALOUD is the only type with no answers array.
- Every other type must include an answers array matching its type rules below.`;

export const CHALLENGE_TYPE_SPECS: Record<string, string> = {
  MULTIPLE_CHOICE: `MULTIPLE_CHOICE — comprehension question about the chapter just read.
Fields:
- question: specific question answerable from the story (e.g. "What did Mia see flicker between the mossy stones?")
- answers: exactly 4 options
  - order: 1, 2, 3, 4
  - text: short phrase (not a single letter)
  - isCorrect: exactly ONE answer must be true, the other three false
- hints: exactly 2 strings pointing to story clues
Do NOT set: targetWord, correctAnswerBoolean, sentenceTemplate, blankIndex, correctSequence, letterValue
Example answers:
  { text: "Warm, soft light", isCorrect: true, order: 1 }
  { text: "A large sleeping bear", isCorrect: false, order: 2 }`,

  TRUE_FALSE: `TRUE_FALSE — child judges if a statement matches the story.
Fields:
- question: a declarative statement (e.g. "The crystals in the cave glowed pink and green.")
- correctAnswerBoolean: true or false (whether the statement is correct per the story)
- answers: exactly 2 options:
  - { text: "True", isCorrect: true/false matching correctAnswerBoolean, order: 1 }
  - { text: "False", isCorrect: opposite of True, order: 2 }
- hints: exactly 2 strings referencing when/where in the story
Do NOT set: targetWord, sentenceTemplate, blankIndex`,

  SEQUENCING: `SEQUENCING — child orders story events chronologically.
Fields:
- question: e.g. "Put these events in the order they happened."
- answers: 3 or 4 event phrases from the story
  - text: short event description (e.g. "Mia walked into Wonder Woods")
  - correctSequence: 1, 2, 3, (4) — the correct chronological position (unique, consecutive from 1)
  - order: display order (can match correctSequence or be shuffled for UI)
  - isCorrect: omit or false (sequencing uses correctSequence, not isCorrect)
- hints: exactly 2 strings about first event and ordering clues
Do NOT set: targetWord, correctAnswerBoolean, sentenceTemplate, blankIndex`,

  FILL_BLANK: `FILL_BLANK — child picks one word to complete a sentence from the story.
Fields:
- question: "Complete the sentence from the story."
- sentenceTemplate: a sentence copied/adapted from the story with "___" marking the blank
  (e.g. "On a flat rock sat a map with a star ___.")
- blankIndex: 0-based index of the "___" token when sentenceTemplate is split by spaces
  (we accept "___" or "___." as the blank token; place "___" as its own word)
- answers: exactly 4 single-word options
  - exactly ONE isCorrect: true (the word that fills the blank)
  - order: 1..4
- hints: exactly 2 strings; do not give the answer word
Do NOT set: targetWord, correctAnswerBoolean, letterValue`,

  COMPLETE_WORD: `COMPLETE_WORD — child picks one letter to complete a partially hidden word.
Fields:
- question: e.g. "Which letter completes the word c_ve?"
- sentenceTemplate: story sentence showing the partial word with missing letter(s) as underscore
  (e.g. "Mia found a c_ve in the woods." where c_ve means cave)
- answers: exactly 4 single-letter options
  - text: one lowercase letter (e.g. "a")
  - letterValue: same letter as text
  - exactly ONE isCorrect: true
  - order: 1..4
- hints: exactly 2 strings about the word meaning or phonics
Do NOT set: blankIndex, correctAnswerBoolean, targetWord`,

  LETTER_DISCRIMINATION: `LETTER_DISCRIMINATION — child taps the correct letter (phonics).
Fields:
- question: phonics prompt (e.g. "Tap the letter that makes the /b/ sound at the start of 'bird'.")
- answers: exactly 4 single-letter options (visually similar distractors like b/d/p/q)
  - text: one lowercase letter
  - letterValue: same as text
  - exactly ONE isCorrect: true
  - order: 1..4
- hints: exactly 2 strings about letter shape or position in a word from the story
Do NOT set: sentenceTemplate, blankIndex, targetWord`,

  SOUND_MATCH: `SOUND_MATCH — child picks the word with the same starting sound.
Fields:
- question: e.g. "Which word starts with the same /s/ sound as 'seed'?"
- answers: exactly 4 word options from or related to the story
  - text: lowercase word
  - exactly ONE isCorrect: true
  - order: 1..4
- hints: exactly 2 strings linking to story vocabulary
Do NOT set: letterValue, sentenceTemplate, targetWord`,

  READ_ALOUD: `READ_ALOUD — child reads a target word aloud (speech recognition).
Fields:
- question: "Read this word aloud clearly."
- targetWord: one word from the story (e.g. "garden")
- hints: exactly 2 strings (syllables, context clue)
- answers: OMIT entirely — do not include an answers field
Do NOT set: correctAnswerBoolean, sentenceTemplate, blankIndex`,

  WORD_BUILD: `WORD_BUILD — child arranges letter tiles to spell a word from the story.
Fields:
- question: e.g. "Build the word for what the tiny sprouts began to do."
- answers: letter tiles — correct word letters PLUS at least 2 decoy letters (5+ tiles total for a 4-letter word)
  - For each letter of the target word in order: { text: "g", letterValue: "g", isCorrect: true, order: 1 }
  - Add 2+ decoy letters: { text: "s", letterValue: "s", isCorrect: false, order: 5 }
  - All tiles need text, letterValue, order, isCorrect
  - Correct tiles spell the target word when ordered by order among isCorrect:true tiles
- hints: exactly 2 strings about word meaning and length/first letter
Do NOT set: targetWord, sentenceTemplate, blankIndex, correctAnswerBoolean`,
};

export function buildChallengeTypeSpecsForPrompt(types: string[]): string {
  return types
    .map((type, index) => {
      const spec = CHALLENGE_TYPE_SPECS[type];
      return spec
        ? `### Challenge ${index + 1}: ${type}\n${spec}`
        : `### Challenge ${index + 1}: ${type}\n(Use standard rules for this type.)`;
    })
    .join("\n\n");
}
