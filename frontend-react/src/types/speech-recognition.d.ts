// Minimal ambient types for the Web Speech API (not in TS's default DOM
// lib) - only the surface useVoiceRecording.ts actually uses.

declare global {
  interface SpeechRecognitionAlternative {
    transcript: string;
  }
  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    start(): void;
    stop(): void;
  }
  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export {};
