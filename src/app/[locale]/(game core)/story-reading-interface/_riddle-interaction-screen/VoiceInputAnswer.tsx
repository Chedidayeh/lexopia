"use client";

import { Button } from "@/src/components/ui/button";
import { Mic, StopCircle, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import {
  getBrowserSpeechRecognition,
  type BrowserSpeechRecognition,
} from "@/src/lib/speech-recognition/browser-speech-recognition";

interface VoiceInputAnswerProps {
  onSubmit: (answer: string) => void;
  isDisabled: boolean;
  isLoading?: boolean;
  languageCode?: string;
}

const VoiceInputAnswer = ({
  onSubmit,
  isDisabled,
  isLoading = false,
  languageCode = "en",
}: VoiceInputAnswerProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported] = useState(() => !!getBrowserSpeechRecognition());

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognitionClass = getBrowserSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setError(t("voiceInputAnswer.notSupported"));
      return;
    }

    try {
      setError(null);
      setTranscript("");
      setRecordingTime(0);

      const recognition = new SpeechRecognitionClass();
      recognition.lang = languageCode;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const latest = event.results[event.results.length - 1];
        if (latest?.[0]?.transcript) {
          setTranscript(latest[0].transcript.trim());
        }
      };

      recognition.onerror = () => {
        setError(t("voiceInputAnswer.recognitionError"));
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setError(t("voiceInputAnswer.recognitionError"));
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onSubmit(transcript.trim());
      setTranscript("");
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!speechSupported) {
    return (
      <div className="w-full space-y-3 sm:space-y-4">
        <div className="p-4 sm:p-6 bg-secondary/10 border border-secondary/20 rounded-xl">
          <p className="text-foreground text-sm sm:text-base font-body">
            {t("voiceInputAnswer.notSupported")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      <label className="block font-body text-foreground text-base sm:text-lg">
        {t("voiceInputAnswer.yourAnswer")}
      </label>

      {error && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm sm:text-base font-body">{error}</p>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {isRecording && (
          <div className="flex items-center justify-between p-4 sm:p-6 bg-secondary/10 rounded-xl border border-secondary/20">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse" />
              <span className="text-foreground font-body text-sm sm:text-base">
                {t("voiceInputAnswer.recording")} {formatTime(recordingTime)}
              </span>
            </div>
          </div>
        )}

        {transcript && (
          <div className="p-4 sm:p-6 bg-secondary/10 rounded-xl border border-secondary/20">
            <p className="text-foreground font-body text-sm sm:text-base">
              <span className="font-semibold">{t("voiceInputAnswer.transcript")}:</span>{" "}
              {transcript}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          {!isRecording ? (
            <>
              <Button
                onClick={startRecording}
                disabled={isDisabled || isLoading}
                variant="secondary"
                className="w-full sm:flex-1 flex items-center justify-center gap-2"
              >
                <Mic size={20} />
                {t("voiceInputAnswer.startRecording")}
              </Button>
              {transcript && (
                <Button
                  onClick={handleSubmit}
                  disabled={!transcript.trim() || isDisabled || isLoading}
                  variant="secondary"
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={20} />
                      {t("voiceInputAnswer.submit")}
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={stopRecording}
              disabled={isDisabled}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <StopCircle size={20} />
              {t("voiceInputAnswer.stopRecording")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceInputAnswer;
