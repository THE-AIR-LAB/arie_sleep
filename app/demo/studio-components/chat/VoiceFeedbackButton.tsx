"use client";

import { useState } from "react";
import { Ic } from "../ra-icons";
import { useVoiceRecorder } from "../useVoice";
import type { FeedbackEntry } from "../FeedbackControls";

/**
 * Mic next to Feedback: click to speak, stop to transcribe and save as the
 * ideal-output feedback signal (same signal the fullscreen editor submits).
 */
export function VoiceFeedbackButton({
  existing,
  onSubmit,
}: {
  existing: FeedbackEntry[];
  onSubmit: (entries: FeedbackEntry[]) => void;
}) {
  const [hint, setHint] = useState("");
  const { isRecording, isTranscribing, toggle } = useVoiceRecorder({
    onTranscript: (text) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setHint("No speech heard");
        window.setTimeout(() => setHint(""), 1800);
        return;
      }
      const kept = existing.filter((e) => e.signal !== "correct_output");
      onSubmit([
        ...kept,
        { rating: null, signal: "correct_output", comment: trimmed },
      ]);
      setHint("Saved");
      window.setTimeout(() => setHint(""), 1600);
    },
    onError: (message) => {
      setHint(message);
      window.setTimeout(() => setHint(""), 2200);
    },
  });

  const label = isTranscribing
    ? "Saving…"
    : isRecording
      ? "Listening…"
      : hint || "Voice feedback";

  return (
    <button
      type="button"
      className={
        "trace-act bubble-voice-fb" +
        (isRecording ? " recording" : "") +
        (hint === "Saved" ? " saved" : "")
      }
      data-tip={
        hint
          ? hint
          : isTranscribing
            ? "Saving…"
            : isRecording
              ? "Stop recording"
              : "Voice feedback"
      }
      aria-label={label}
      aria-pressed={isRecording}
      disabled={isTranscribing}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
    >
      <Ic.Mic size={14} />
    </button>
  );
}
