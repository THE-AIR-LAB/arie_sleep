"use client";

/* Speaker (voice-reply) toggle — lives in the composer, left of the mic while recording. */
export function VoiceReplyButton({
  autoSpeak,
  onToggleAutoSpeak,
  isSpeaking,
  onStopSpeaking,
  className,
  iconSize = 18,
}: {
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  className: string;
  iconSize?: number;
}) {
  return (
    <button
      type="button"
      className={className}
      title={autoSpeak ? "Voice replies on — click to mute" : "Voice replies off — click to enable"}
      aria-label={autoSpeak ? "Turn off voice replies" : "Turn on voice replies"}
      aria-pressed={autoSpeak}
      onClick={() => {
        if (isSpeaking) onStopSpeaking();
        onToggleAutoSpeak();
      }}
      style={autoSpeak ? { color: "var(--accent, #F05025)" } : { opacity: 0.55 }}
    >
      {autoSpeak ? (
        isSpeaking ? (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ) : (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}
