import { Story, Chapter } from "@readdly/shared-types";

export function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?؟\n]+[.!?؟]*\n*/g);
  if (!parts || parts.length === 0) return [text];
  const filtered = parts.filter((s) =>
    /[a-zA-Z0-9\u0600-\u06FF\u00C0-\u024F]/.test(s),
  );
  return filtered.length > 0 ? filtered : [text];
}

/**
 * StoryPage interface represents a single readable page in the UI
 * Maps from backend Chapter structure
 */
export interface StoryPage {
  pageNumber: number;
  text: string;
  image: string | null;
  alt: string;
  hasRiddle: boolean;
}

/**
 * Transform a Story object into an array of StoryPage objects for UI consumption
 * Each chapter becomes a page
 *
 * @param story - The Story object from backend
 * @returns Array of StoryPage objects sorted by chapter order
 */
export function transformStoryToPages(story: Story): StoryPage[] {
  if (!story.chapters || story.chapters.length === 0) {
    return [];
  }

  // Sort chapters by order to ensure correct page sequence
  const sortedChapters = [...story.chapters].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return sortedChapters.map((chapter: Chapter, index: number) => ({
    pageNumber: index + 1,
    text: chapter.content || "",
    image: chapter.imageUrl ?? null,
    alt: `Page ${index + 1}`,
    hasRiddle: !!chapter.challenge,
  }));
}

/**
 * Get the chapter object for a specific page number
 *
 * @param story - The Story object
 * @param pageNumber - The page number (1-indexed)
 * @returns The Chapter object or undefined
 */
export function getChapterByPageNumber(
  story: Story,
  pageNumber: number,
): Chapter | undefined {
  if (!story.chapters) return undefined;

  // Sort and adjust for 1-indexing
  const sortedChapters = [...story.chapters].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return sortedChapters[pageNumber - 1];
}

/**
 * Map ChallengeType enum values to RiddleInteractive's expected type format
 */
export function mapChallengeTypeToRiddleType(
  challengeType: string,
): "text" | "multiple-choice" | "ordering" | "tiles" | "voice" {
  switch (challengeType) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE":
    case "FILL_BLANK":
    case "SOUND_MATCH":
      return "multiple-choice";
    case "SEQUENCING":
    case "WORD_BUILD":
      return "ordering";
    case "COMPLETE_WORD":
    case "LETTER_DISCRIMINATION":
      return "tiles";
    case "READ_ALOUD":
      return "voice";
    default:
      return "multiple-choice";
  }
}
