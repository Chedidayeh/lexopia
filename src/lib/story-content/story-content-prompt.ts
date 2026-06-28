import type { StoryContentContext } from "./collect-story-context";
import {
  buildChallengeTypeSpecsForPrompt,
  CHALLENGE_OUTPUT_CONTRACT,
  MIN_CHALLENGE_PLACEMENT_CHAPTER,
} from "./challenge-type-specs";
import {
  formatPriorEpisodesRecap,
  formatCharacterContinuity,
  formatPlotThreadContinuity,
  formatWorldElementContinuity,
} from "./episode-continuity";
import { condenseChapterForChallengesPrompt } from "./story-llm-helpers";

export function buildStoryContentSystemPrompt(): string {
  return `You are a children's reading content author for a Lexopia-friendly learning app.

Write clear, engaging stories with:
- Short sentences and simple vocabulary matched to the child's reading level
- Warm, encouraging tone appropriate for the child's age
- Strong continuity within a multi-episode story arc
- No scary, violent, or inappropriate content
- Present tense or simple past tense; avoid complex clauses

EPISODE CONTINUITY REQUIREMENTS (CRITICAL):
- Stories within the same world MUST share consistent characters, settings, and narrative threads
- Maintain character consistency: names, traits, relationships, and roles must not change without explanation
- Advance ongoing plot threads from previous episodes; do not restart or ignore established storylines
- Respect world-building rules and geography established in prior episodes
- When characters are reintroduced, reference their prior appearances and relationships
- Ensure events logically follow from previous episode endings
- Use the continuity bible, prior episode recaps, and episode bridges to maintain narrative coherence
- New elements introduced must fit seamlessly into the established world and story arc
- Avoid contradictions with previously established facts, character knowledge, or world rules

Respect the reading plan configuration supplied in the user prompt. Do not exceed the configured chapter, episode, or challenge limits.

When generating challenges, you MUST follow the exact per-type JSON shape used by our reading UI
(same structure as the app's story preview test data: chapters with optional embedded challenges).
Never place challenges after chapters 1 or 2 — the child reads those chapters without interruption first.

${CHALLENGE_OUTPUT_CONTRACT}`;
}

export function buildChaptersUserPrompt(context: StoryContentContext): string {
  const {
    story,
    storyArc,
    world,
    child,
    readingPlanConfiguration,
    personalization,
    previousEpisodeBridge,
    priorEpisodesRecap,
    characterContinuity,
    plotThreadContinuity,
    worldElementContinuity,
  } = context;
  const childName = personalization.childName ?? child.name;
  const tone = personalization.storyTone ?? "adventurous";
  const characterType = personalization.favoriteCharacterType ?? "explorer";
  const priorEpisodesRecapText = formatPriorEpisodesRecap(priorEpisodesRecap);
  const characterContinuityText = formatCharacterContinuity(characterContinuity);
  const plotThreadContinuityText = formatPlotThreadContinuity(plotThreadContinuity);
  const worldElementContinuityText = formatWorldElementContinuity(worldElementContinuity);

  return `Write the full chapter text for this story episode.

Child: ${childName}, age ${child.age}, reading level ${story.readingLevel}
Story tone: ${tone}
Favorite character type: ${characterType}
World: ${world.name} — ${world.description ?? ""}
Story arc: ${storyArc.title} — ${storyArc.synopsis ?? ""}
Continuity bible: ${JSON.stringify(storyArc.continuityBible)}

Reading plan configuration (hard limits):
- Parent subscription plan: ${readingPlanConfiguration?.parentSubscriptionPlan ?? 'unknown'}
- Max themes allowed: ${readingPlanConfiguration?.maxThemesAllowed ?? 'unknown'}
- Max stories per week allowed: ${readingPlanConfiguration?.maxStoriesPerWeekAllowed ?? 'unknown'}
- Max challenge types: ${readingPlanConfiguration?.maxChallengeTypes ?? 'unknown'}
- Max worlds per roadmap allowed: ${readingPlanConfiguration?.maxWorldsPerRoadmapAllowed ?? 'unknown'}
- Max episodes per world allowed: ${readingPlanConfiguration?.maxEpisodesPerWorldAllowed ?? 'unknown'}
- Max chapters per story allowed: ${readingPlanConfiguration?.maxChaptersPerStoryAllowed ?? 'unknown'}

Episode ${story.episodeNumber ?? story.order} of ${storyArc.targetEpisodes}
Episode title: ${story.episodeTitle ?? story.title}
Episode summary: ${story.description ?? ""}
${
  priorEpisodesRecapText
    ? `Prior episodes recap (continue forward — do not restart or repeat these events):\n${priorEpisodesRecapText}`
    : "This is the first episode in the arc."
}
${previousEpisodeBridge ? `Previous episode ended with: ${previousEpisodeBridge}` : ""}

${characterContinuityText ? `CHARACTER CONTINUITY:\n${characterContinuityText}\n` : ""}
${plotThreadContinuityText ? `PLOT THREAD CONTINUITY:\n${plotThreadContinuityText}\n` : ""}
${worldElementContinuityText ? `WORLD ELEMENT CONTINUITY:\n${worldElementContinuityText}\n` : ""}

CONTINUITY REQUIREMENTS:
- This episode MUST continue the narrative from previous episodes, not restart the story
- Maintain all established characters with consistent names, traits, and relationships
- Advance ongoing plot threads; introduce new complications or developments
- Respect all world-building rules, geography, and lore established in prior episodes
- Reference prior events naturally when relevant to current action
- Ensure character knowledge and abilities align with what they've learned in previous episodes
- If introducing new characters or locations, connect them logically to the established world
- Maintain the same narrative tone and style as previous episodes
- End with a bridge or cliffhanger that naturally leads to the next episode

Requirements:
- Exactly ${story.chaptersPerStory} chapters (story pages)
- Each chapter MUST be ${context.sizing?.targetWordMin ?? 250}-${context.sizing?.targetWordMax ?? 350} words (aim for ~${story.wordsPerChapter} words per chapter)
- Count words carefully — chapters outside this range are rejected; expand short chapters with scene detail, dialogue, and sensory description
- Chapter 1 should hook the reader; final chapter should end with a light cliffhanger or bridge for the next episode
- Chapters 1 and 2 are warmup reading only — challenges are placed from chapter ${MIN_CHALLENGE_PLACEMENT_CHAPTER} onward, so seed useful nouns, events, and vocabulary from chapter ${MIN_CHALLENGE_PLACEMENT_CHAPTER} onward for later challenges
- Use the child's name naturally in the narrative
- Write content that later challenges can reference (specific nouns, events, words for phonics)
- Return chapters with order 1..${story.chaptersPerStory} and plain text content only
- The order field must be sequential integers starting at 1 (not 0-based)`;
}

export function buildChallengesUserPrompt(
  context: StoryContentContext,
  chapterSummaries: { order: number; content: string }[],
  batch?: { startOrder: number; batchTypes: string[] },
): string {
  const { story, plannedChallengeTypes } = context;
  const requiredTypes = batch?.batchTypes ?? plannedChallengeTypes ?? [];
  const challengeCount = requiredTypes.length;
  const startOrder = batch?.startOrder ?? 1;
  const endOrder = startOrder + challengeCount - 1;

  const chapterList = chapterSummaries
    .map(
      (chapter) =>
        `Chapter ${chapter.order} (excerpt):\n${condenseChapterForChallengesPrompt(chapter.content)}`,
    )
    .join("\n\n");

  const typeSpecs = buildChallengeTypeSpecsForPrompt(requiredTypes);
  const batchIntro = batch
    ? `Create challenges ${startOrder}-${endOrder} only (${challengeCount} challenges in this batch).`
    : `Create ${story.challengesPerStory} challenges for this story episode.`;

  return `${batchIntro}

Challenge types and order are fixed by the reading plan — do not change them.
You must produce EXACTLY ${challengeCount} challenge(s) in this type order:
${requiredTypes.map((type, index) => `${startOrder + index}. ${type}`).join("\n")}

Each challenge object fields:
- order: ${startOrder}${challengeCount > 1 ? `..${endOrder}` : ""} only
- type: one of the types above (in order)
- placementChapterOrder: which chapter (1..${story.chaptersPerStory}) the challenge appears after the child finishes reading that chapter
- NEVER use chapters 1 or 2 for placement — the first two chapters are uninterrupted warmup reading for Lexopia-friendly pacing
- Every challenge MUST use placementChapterOrder >= ${MIN_CHALLENGE_PLACEMENT_CHAPTER}; spread challenges across chapters ${MIN_CHALLENGE_PLACEMENT_CHAPTER}..${story.chaptersPerStory} using different chapters when possible
- question: short string (max 280 characters)
- hints: array of exactly 2 hint strings (each max 15 words — short clues only)
- sentenceTemplate: one short sentence only (max 180 characters); use a single "___" blank token for FILL_BLANK/COMPLETE_WORD — never repeat letters or fragments in a loop
- Never repeat the same substring over and over in any field
- Plus type-specific fields and answers as specified below

${typeSpecs}

Story chapters (use these for challenge content — questions, answers, and hints must be grounded here):
${chapterList}

Final checklist:
- Exactly ${challengeCount} challenge(s), types in the listed order
- Each challenge has exactly 2 short hints
- MULTIPLE_CHOICE, FILL_BLANK, SOUND_MATCH, LETTER_DISCRIMINATION, COMPLETE_WORD: exactly 4 answers
- TRUE_FALSE: exactly 2 answers with text "True" and "False", plus correctAnswerBoolean
- SEQUENCING: 3 or 4 answers with unique correctSequence 1..N
- READ_ALOUD: targetWord only, no answers field
- WORD_BUILD: at least 3 correct letter tiles spelling the target word plus 2+ decoy tiles, all with letterValue
- Every placementChapterOrder must be >= ${MIN_CHALLENGE_PLACEMENT_CHAPTER} (never 1 or 2)
- Return ONLY the ${challengeCount} challenge(s) for orders ${startOrder}${challengeCount > 1 ? `-${endOrder}` : ""}`;
}
