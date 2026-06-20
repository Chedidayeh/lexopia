type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionResultEntry = {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
};

export type BrowserSpeechRecognitionResultEvent = {
  results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultEntry;
  };
  resultIndex: number;
};

export type BrowserSpeechRecognitionErrorEvent = {
  error: string;
  message?: string;
};

export type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: BrowserSpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export function getBrowserSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}
