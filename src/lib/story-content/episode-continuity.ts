export type PriorEpisodeRecapEntry = {
  episodeNumber: number;
  episodeTitle: string;
  summary: string | null;
  ending: string | null;
};

export type CharacterContinuityEntry = {
  name: string;
  role: string;
  traits: string[];
  firstAppearanceEpisode: number;
  lastAppearanceEpisode: number;
  status: string; // "active", "inactive", "resolved"
};

export type PlotThreadContinuityEntry = {
  id: string;
  name: string;
  description: string;
  introducedEpisode: number;
  status: string; // "ongoing", "paused", "resolved"
  lastMentionedEpisode: number;
};

export type WorldElementContinuityEntry = {
  name: string;
  type: string; // "location", "object", "rule", "lore"
  description: string;
  introducedEpisode: number;
};

const RECAP_SUMMARY_MAX_CHARS = 200;
const RECAP_ENDING_MAX_CHARS = 300;
const DEFAULT_CLIFFHANGER_MAX_CHARS = 600;
const IMMEDIATE_BRIDGE_MAX_CHARS = 800;

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+/g);
  if (!matches?.length) {
    return [text.trim()];
  }
  return matches.map((sentence) => sentence.trim()).filter(Boolean);
}

export function truncateForRecap(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars - 3).trimEnd()}...`;
}

export function extractEpisodeCliffhanger(
  content: string,
  maxChars = DEFAULT_CLIFFHANGER_MAX_CHARS,
): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return "";
  }

  const tail = splitSentences(trimmed).slice(-3).join(" ");
  if (tail.length <= maxChars) {
    return tail;
  }

  return tail.slice(-maxChars).trimStart();
}

export function resolveEpisodeEnding(params: {
  episodeBridge: string | null | undefined;
  lastChapterContent?: string | null;
  maxChars?: number;
}): string | null {
  const maxChars = params.maxChars ?? IMMEDIATE_BRIDGE_MAX_CHARS;

  if (params.episodeBridge?.trim()) {
    return truncateForRecap(params.episodeBridge, maxChars);
  }

  if (params.lastChapterContent?.trim()) {
    return extractEpisodeCliffhanger(params.lastChapterContent, maxChars);
  }

  return null;
}

export function buildPriorEpisodeRecapEntry(params: {
  episodeNumber: number;
  episodeTitle: string;
  description: string | null | undefined;
  episodeBridge: string | null | undefined;
  lastChapterContent?: string | null;
}): PriorEpisodeRecapEntry {
  const ending = resolveEpisodeEnding({
    episodeBridge: params.episodeBridge,
    lastChapterContent: params.lastChapterContent,
    maxChars: RECAP_ENDING_MAX_CHARS,
  });

  return {
    episodeNumber: params.episodeNumber,
    episodeTitle: params.episodeTitle,
    summary: params.description
      ? truncateForRecap(params.description, RECAP_SUMMARY_MAX_CHARS)
      : null,
    ending,
  };
}

export function formatPriorEpisodesRecap(
  entries: PriorEpisodeRecapEntry[],
): string | null {
  if (!entries || entries.length === 0) {
    return null;
  }

  return entries
    .map((episode) => {
      const lines = [`Episode ${episode.episodeNumber} "${episode.episodeTitle}":`];
      if (episode.summary) {
        lines.push(episode.summary);
      }
      if (episode.ending) {
        lines.push(`Ended with: ${episode.ending}`);
      }
      return lines.join(" ");
    })
    .join("\n");
}

export function formatCharacterContinuity(
  characters: CharacterContinuityEntry[],
): string | null {
  if (!characters || characters.length === 0) {
    return null;
  }

  return characters
    .map((char) => {
      const traits = char.traits && char.traits.length > 0 ? ` (traits: ${char.traits.join(", ")})` : "";
      return `- ${char.name}: ${char.role}${traits} [ep ${char.firstAppearanceEpisode}-${char.lastAppearanceEpisode}, status: ${char.status}]`;
    })
    .join("\n");
}

export function formatPlotThreadContinuity(
  threads: PlotThreadContinuityEntry[],
): string | null {
  if (!threads || threads.length === 0) {
    return null;
  }

  return threads
    .map((thread) => {
      return `- ${thread.name}: ${thread.description} [introduced ep ${thread.introducedEpisode}, status: ${thread.status}]`;
    })
    .join("\n");
}

export function formatWorldElementContinuity(
  elements: WorldElementContinuityEntry[],
): string | null {
  if (!elements || elements.length === 0) {
    return null;
  }

  return elements
    .map((elem) => {
      return `- ${elem.name} (${elem.type}): ${elem.description} [introduced ep ${elem.introducedEpisode}]`;
    })
    .join("\n");
}
