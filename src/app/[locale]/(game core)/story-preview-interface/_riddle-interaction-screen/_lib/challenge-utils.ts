export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function normalizeText(value: string): string {
  return value.toLowerCase().trim().replace(/[^\w\s\u0600-\u06FF]/g, "");
}

export function resolveLanguageCode(locale?: string): string {
  return (locale || "EN").split("-")[0].toUpperCase();
}
