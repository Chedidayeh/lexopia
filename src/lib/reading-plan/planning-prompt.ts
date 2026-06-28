import type { PlanningContext, ContentHistory } from "./collect-planning-context";

export function buildPlanningSystemPrompt(): string {
  return `You are a children's reading curriculum planning agent for Lexopia-friendly learning.

Design a personalized reading plan as structured JSON matching the required schema.

You must respect the reading plan configuration provided in the user prompt. Do not exceed any configured plan limits.

CREATIVITY AND UNIQUENESS REQUIREMENTS (CRITICAL):
- Every new reading plan MUST be creative and different from previous plans
- Avoid reusing world names, character names, or story arc concepts from the content history
- Create fresh, original content that expands the child's reading experience
- Vary story tones, settings, character types, and narrative structures
- Be imaginative and innovative while staying age-appropriate
- If the child has completed certain interests, explore new angles or fresh perspectives
- The goal is to provide variety and prevent content fatigue

Rules:
- Create exactly one roadmap per child interest (no more, no fewer).
- Each roadmap must have between worldsPerRoadmapMin and worldsPerRoadmapMax worlds (inclusive).
- Each world must have exactly storiesPerWorld connected episodes forming ONE continuous story arc.
- Episodes must be numbered 1 through storiesPerWorld sequentially.
- All episodes in a world share the same characters, setting, and plot (one saga).
- Episode summaries should flow as a serial narrative with clear continuity.
- Every episode must include a challengeTypes array with the planned challenge types for that story.
- Each episode is sized for one reading session (chapter count and word targets are fixed per session duration).
- Titles and descriptions must be age-appropriate, Lexopia-friendly, and match the child's story tone and character preference.
- Use the child's primary language context for naming style (content will be translated later).
- Do not include markdown or extra keys outside the schema.`;
}

export function buildPlanningUserPrompt(context: PlanningContext): string {
  const { readingPlan, child, readingPlanConfiguration, sizing, contentHistory } = context;
  const minStories =
    readingPlan.sourceInterests.length *
    readingPlan.worldsPerRoadmapMin *
    readingPlan.storiesPerWorld;
  const maxStories =
    readingPlan.sourceInterests.length *
    readingPlan.worldsPerRoadmapMax *
    readingPlan.storiesPerWorld;

  const contentHistorySection = buildContentHistorySection(contentHistory);

  return `Create a reading plan blueprint for this child.

Child profile:
- Name: ${child.name}
- Age: ${child.age}
- Gender: ${child.gender}
- Reading level: ${readingPlan.readingLevel}
- Primary language: ${readingPlan.primaryLanguage}
- Interests (one roadmap each): ${readingPlan.sourceInterests.join(", ")}
- Assigned challenge types: ${readingPlan.assignedChallenges.join(", ")}
- Favorite character type: ${readingPlan.favoriteCharacterType ?? "explorer"}
- Story tone: ${readingPlan.storyTone ?? "adventurous"}
- Session duration (minutes): ${readingPlan.sessionDurationMins}
- Stories per week: ${readingPlan.storiesPerWeek}

Reading plan configuration (hard limits from the parent's subscription tier):
- Parent subscription plan: ${readingPlanConfiguration.parentSubscriptionPlan}
- Max themes allowed: ${readingPlanConfiguration.maxThemesAllowed}
- Max stories per week allowed: ${readingPlanConfiguration.maxStoriesPerWeekAllowed}
- Max challenge types: ${readingPlanConfiguration.maxChallengeTypes}
- Max worlds per roadmap allowed: ${readingPlanConfiguration.maxWorldsPerRoadmapAllowed}
- Max episodes per world allowed: ${readingPlanConfiguration.maxEpisodesPerWorldAllowed}
- Max chapters per story allowed: ${readingPlanConfiguration.maxChaptersPerStoryAllowed}

Story length per episode (one session = one episode; fixed targets for content generation):
- Session duration: ${readingPlan.sessionDurationMins} minutes
- Chapters per episode: ${sizing.chaptersPerStory}
- Target words per chapter: ~${sizing.wordsPerChapter} (${sizing.targetWordMin}-${sizing.targetWordMax})
- Challenges per episode: ${sizing.challengesPerStory}

Structural requirements:
- Roadmaps: exactly ${readingPlan.sourceInterests.length} (one per interest listed above)
- Worlds per roadmap: ${readingPlan.worldsPerRoadmapMin} to ${readingPlan.worldsPerRoadmapMax}
- Episodes per world (connected arc): exactly ${readingPlan.storiesPerWorld}
- Total stories in plan: approximately ${minStories} to ${maxStories}

${contentHistorySection}

Challenge distribution (required on every episode):
- Each episode must include challengeTypes: an array of exactly ${sizing.challengesPerStory} challenge type strings
- Only use types from the assigned list: ${readingPlan.assignedChallenges.join(", ")}
- Order challengeTypes within each episode as a pedagogical learning path (simpler types before harder ones — you decide the progression)
- The same challenge type may appear in multiple episodes across the plan
- Across the ENTIRE plan, every assigned challenge type must appear at least once
- The order in challengeTypes is the order the content agent will generate challenges for that episode

For each roadmap, pick the matching interest slug from the interests list.
For each world, provide a storyArc with title, synopsis, continuityBible (characters, setting, plotThreads, tone), and ${readingPlan.storiesPerWorld} episodes.
Each episode needs: episodeNumber, episodeTitle, episodeSummary, and challengeTypes.`;
}

function buildContentHistorySection(contentHistory: ContentHistory): string {
  const sections: string[] = [];

  if (contentHistory.usedWorlds.length > 0) {
    sections.push(`PREVIOUSLY USED WORDS (avoid these names): ${contentHistory.usedWorlds.join(", ")}`);
  }

  if (contentHistory.usedCharacters.length > 0) {
    sections.push(`PREVIOUSLY USED CHARACTERS (avoid these names): ${contentHistory.usedCharacters.join(", ")}`);
  }

  if (contentHistory.usedStoryArcs.length > 0) {
    sections.push(`PREVIOUSLY USED STORY ARCS (avoid these concepts): ${contentHistory.usedStoryArcs.join(", ")}`);
  }

  if (contentHistory.completedInterests.length > 0) {
    sections.push(`COMPLETED INTERESTS (explore fresh perspectives): ${contentHistory.completedInterests.join(", ")}`);
  }

  if (sections.length === 0) {
    return "CONTENT HISTORY: This is the child's first reading plan. Be creative and original!";
  }

  return `CONTENT HISTORY:
${sections.join("\n")}

Use this history to create fresh, original content that differs from previous plans while still matching the child's interests and preferences.`;
}
