export type PriorEpisodeRecapEntry = {
  episodeNumber: number;
  episodeTitle: string;
  summary: string | null;
  ending: string | null;
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
  if (entries.length === 0) {
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
