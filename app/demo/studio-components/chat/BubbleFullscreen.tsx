"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Ic } from "../ra-icons";
import type { FeedbackEntry } from "../FeedbackControls";
import { BubbleMarkdown } from "./BubbleMarkdown";
import { VoiceFeedbackButton } from "./VoiceFeedbackButton";
import type { Message } from "./types";

/**
 * Fullscreen overlay for a reply — mirrors the canvas full mode. It has its own
 * Feedback button: pressing it turns the reply into an editable input with a
 * Submit button; submitting saves the edited text as the "ideal output" feedback
 * signal, which tints the bubble and shows in the message's feedback component.
 */
export function BubbleFullscreen({
  productName,
  messages,
  startIndex,
  feedbackMode,
  feedbackByIdx,
  onSubmitFeedbackAt,
  onClose,
}: {
  productName: string;
  messages: Message[];
  startIndex: number;
  feedbackMode?: boolean;
  feedbackByIdx?: Record<number, FeedbackEntry[]>;
  onSubmitFeedbackAt?: (index: number, entries: FeedbackEntry[]) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, startIndex), Math.max(0, messages.length - 1))
  );
  const m = messages[index] ?? messages[0];
  const text = m?.text ?? "";
  const initialEntries = feedbackByIdx?.[index] ?? [];
  const canFeedback = !!onSubmitFeedbackAt;
  const existingIdeal = initialEntries.find((e) => e.signal === "correct_output")?.comment ?? "";
  const existingRating = initialEntries.find((e) => e.signal === "score")?.rating ?? null;
  // Feedback edit mode: opened by the Feedback button (or straight away when the
  // studio's global feedback mode is on). Prefill with a prior correction if any.
  const [editing, setEditing] = useState(!!feedbackMode && canFeedback);
  const [draft, setDraft] = useState(existingIdeal || text);
  const [rating, setRating] = useState<1 | -1 | null>(existingRating);
  const [saved, setSaved] = useState(false);

  const turnMeta = useMemo(() => {
    const turnIds: string[] = [];
    const turnOfIndex: number[] = [];
    const seen = new Map<string, number>();
    for (let i = 0; i < messages.length; i++) {
      const tid = messages[i].turnId;
      if (tid) {
        let n = seen.get(tid);
        if (n == null) {
          n = turnIds.length + 1;
          seen.set(tid, n);
          turnIds.push(tid);
        }
        turnOfIndex[i] = n;
      } else {
        const n = turnIds.length + 1;
        turnIds.push(`__orphan_${i}`);
        turnOfIndex[i] = n;
      }
    }
    return { turnTotal: turnIds.length, turnOfIndex };
  }, [messages]);

  const turnPos = turnMeta.turnOfIndex[index] ?? (messages.length === 0 ? 0 : 1);
  const turnTotal = turnMeta.turnTotal;
  const canPrev = index > 0;
  const canNext = index < messages.length - 1;
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(messages.length - 1, i + 1));

  // Reset editor state when cycling to another message.
  useEffect(() => {
    const entries = feedbackByIdx?.[index] ?? [];
    const ideal = entries.find((e) => e.signal === "correct_output")?.comment ?? "";
    const score = entries.find((e) => e.signal === "score")?.rating ?? null;
    const body = messages[index]?.text ?? "";
    setEditing(!!feedbackMode && canFeedback);
    setDraft(ideal || body);
    setRating(score);
    setSaved(false);
  }, [index, feedbackMode, canFeedback, feedbackByIdx, messages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, messages.length]);

  const submit = () => {
    if (!onSubmitFeedbackAt) return;
    // Preserve any other signals already on this message; replace score + ideal.
    const kept = (feedbackByIdx?.[index] ?? []).filter(
      (e) => e.signal !== "score" && e.signal !== "correct_output"
    );
    const entries: FeedbackEntry[] = [...kept];
    if (rating !== null) entries.push({ rating, signal: "score", comment: "" });
    const corrected = draft.trim();
    if (corrected && corrected !== text.trim()) {
      entries.push({ rating: null, signal: "correct_output", comment: corrected });
    }
    onSubmitFeedbackAt(index, entries);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const roleTitle = m?.role === "user" ? "You" : productName;

  // Mount inside `.ra-scope` so theme tokens (mono accent, surfaces) apply —
  // portaling to <body> left the modal on the fallback orange accent.
  const host =
    (typeof document !== "undefined" &&
      (document.querySelector(".ra-scope") as HTMLElement | null)) ||
    document.body;

  const nav = (
    <div className="bubble-fs-nav">
      <button
        type="button"
        className="bubble-fs-nav-btn"
        aria-label="Previous message"
        title="Previous message"
        disabled={!canPrev}
        onClick={goPrev}
      >
        <Ic.Chevron size={18} style={{ transform: "rotate(90deg)" }} />
      </button>
      <span className="bubble-fs-nav-count" aria-live="polite">
        {turnTotal === 0 ? "0 / 0" : `${turnPos} / ${turnTotal}`}
      </span>
      <button
        type="button"
        className="bubble-fs-nav-btn"
        aria-label="Next message"
        title="Next message"
        disabled={!canNext}
        onClick={goNext}
      >
        <Ic.Chevron size={18} style={{ transform: "rotate(-90deg)" }} />
      </button>
    </div>
  );

  return createPortal(
    <div className="bubble-fs-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bubble-fs" onClick={(e) => e.stopPropagation()}>
        <div className="bubble-fs-head">
          <div className="bubble-fs-head-left">
            <div className="bubble-fs-title-block">
              <div className="bubble-fs-title">{roleTitle}</div>
            </div>
            <div className="bubble-fs-nav-slot bubble-fs-nav-slot--head">{nav}</div>
          </div>
          <div className="bubble-fs-head-right">
            <button
              className="bubble-fs-close"
              type="button"
              aria-label="Exit full screen"
              title="Exit full screen"
              onClick={onClose}
            >
              <Ic.Close size={20} />
            </button>
          </div>
        </div>
        <div className="bubble-fs-body">
          {editing ? (
            <textarea
              className="bubble-fs-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck
              autoFocus
            />
          ) : m?.role === "user" ? (
            text
          ) : (
            <BubbleMarkdown>{text}</BubbleMarkdown>
          )}
        </div>
        <div className="bubble-fs-foot">
          {editing ? (
            <>
              <div className="bubble-fs-foot-left">
                <div className="bubble-fs-thumbs">
                  <button
                    type="button"
                    className={"bubble-fs-thumb" + (rating === 1 ? " active" : "")}
                    title="Thumbs up"
                    onClick={() => setRating((r) => (r === 1 ? null : 1))}
                  >
                    👍
                  </button>
                  <button
                    type="button"
                    className={"bubble-fs-thumb" + (rating === -1 ? " active" : "")}
                    title="Thumbs down"
                    onClick={() => setRating((r) => (r === -1 ? null : -1))}
                  >
                    👎
                  </button>
                </div>
                <span className="bubble-fs-hint">Edit the answer, then submit it as the ideal response.</span>
              </div>
              <div className="bubble-fs-foot-right">
                <button
                  type="button"
                  className="bubble-fs-cancel"
                  onClick={() => {
                    setEditing(false);
                    setDraft(existingIdeal || text);
                  }}
                >
                  Cancel
                </button>
                <button type="button" className="bubble-fs-submit" onClick={submit}>
                  {saved ? "Saved" : "Submit feedback"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bubble-fs-foot-left bubble-fs-nav-slot bubble-fs-nav-slot--foot">{nav}</div>
              {canFeedback ? (
                <div className="bubble-fs-foot-right">
                  <VoiceFeedbackButton
                    existing={initialEntries}
                    onSubmit={(entries) => onSubmitFeedbackAt?.(index, entries)}
                  />
                  <button type="button" className="bubble-fs-fb" title="Feedback" aria-label="Feedback" onClick={() => setEditing(true)}>
                    <Ic.Edit size={15} />
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>,
    host
  );
}
