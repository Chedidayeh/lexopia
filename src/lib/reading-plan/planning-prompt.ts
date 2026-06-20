import type { PlanningContext } from "./collect-planning-context";

export function buildPlanningSystemPrompt(): string {
  return `You are a children's reading curriculum planning agent for dyslexia-friendly learning.

Design a personalized reading plan as structured JSON matching the required schema.

Rules:
- Create exactly one roadmap per child interest (no more, no fewer).
- Each roadmap must have between worldsPerRoadmapMin and worldsPerRoadmapMax worlds (inclusive).
- Each world must have exactly storiesPerWorld connected episodes forming ONE continuous story arc.
- Episodes must be numbered 1 through storiesPerWorld sequentially.
- All episodes in a world share the same characters, setting, and plot (one saga).
- Episode summaries should flow as a serial narrative with clear continuity.
- Every episode must include a challengeTypes array with the planned challenge types for that story.
- Each episode is sized for one reading session (chapter count and word targets are fixed per session duration).
- Titles and descriptions must be age-appropriate, dyslexia-friendly, and match the child's story tone and character preference.
- Use the child's primary language context for naming style (content will be translated later).
- Do not include markdown or extra keys outside the schema.`;
}

export function buildPlanningUserPrompt(context: PlanningContext): string {
  const { readingPlan, child, sizing } = context;
  const minStories =
    readingPlan.sourceInterests.length *
    readingPlan.worldsPerRoadmapMin *
    readingPlan.storiesPerWorld;
  const maxStories =
    readingPlan.sourceInterests.length *
    readingPlan.worldsPerRoadmapMax *
    readingPlan.storiesPerWorld;

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
