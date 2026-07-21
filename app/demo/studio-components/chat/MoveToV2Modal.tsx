"use client";

import { useEffect, useState } from "react";
import { Ic } from "../ra-icons";
import SiteLogo from "../../../components/SiteLogo";

type PolicyNodeSummary = {
  id: string;
  type: string;
  label: string;
};

type PolicyCanvasSummary = {
  id: string;
  name: string;
  freeText: string;
  nodes: PolicyNodeSummary[];
};

type FeedbackRow = {
  conversation_id: string;
  conversation_title?: string;
  message_index: number;
  message_role: string;
  message_excerpt?: string;
  rating: number | null;
  signal: string;
  comment: string;
};

function nodeLabel(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  for (const key of ["label", "text", "prompt", "condition", "title"]) {
    const v = d[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function summarizePolicyCanvases(raw: unknown[]): PolicyCanvasSummary[] {
  return raw.map((row, i) => {
    const r = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
    const canvas = (r.canvas && typeof r.canvas === "object" ? r.canvas : {}) as Record<
      string,
      unknown
    >;
    const graph = (canvas.graph && typeof canvas.graph === "object" ? canvas.graph : {}) as Record<
      string,
      unknown
    >;
    const nodesRaw = Array.isArray(graph.nodes) ? graph.nodes : [];
    const nodes: PolicyNodeSummary[] = nodesRaw.map((n, ni) => {
      const node = (n && typeof n === "object" ? n : {}) as Record<string, unknown>;
      const label = nodeLabel(node.data) || String(node.type ?? "node");
      return {
        id: String(node.id ?? `n-${ni}`),
        type: String(node.type ?? "node"),
        label,
      };
    });
    const freeText = typeof canvas.freeText === "string" ? canvas.freeText.trim() : "";
    return {
      id: String(r.canvas_id ?? `policy-${i}`),
      name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : `Policy ${i + 1}`,
      freeText,
      nodes,
    };
  });
}

function signalLabel(signal: string): string {
  switch (signal) {
    case "score":
      return "Score";
    case "text_correction":
      return "Text correction";
    case "correct_output":
      return "Ideal output";
    case "comment":
      return "Note";
    default:
      return signal;
  }
}

/** Uniform title case for policy node kinds (Start, Condition, Prompt). */
function formatNodeType(type: string): string {
  const cleaned = type.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (!cleaned) return "Node";
  return cleaned.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function formatFeedbackLine(row: FeedbackRow): string {
  const bits: string[] = [];
  if (row.signal === "score") {
    if (row.rating === 1) bits.push("👍 positive");
    else if (row.rating === -1) bits.push("👎 negative");
    else bits.push("Score");
  } else {
    bits.push(signalLabel(row.signal));
  }
  const comment = (row.comment ?? "").trim();
  if (comment) bits.push(comment);
  return bits.join(" — ");
}

/**
 * "Move to V2" summary dialog: shows the policy canvases and all feedback that
 * will be folded into the next custom model, in two expandable sections.
 * Create switches the body to a training-in-progress state; closing after
 * Create notifies the host so it can show the floating Training pill.
 */
export function MoveToV2Modal({
  apiTopic,
  titleId = "thread-model-v2-title",
  onClose,
  onTrainingStarted,
  onTrainingStopped,
  initialTraining = false,
}: {
  apiTopic: string;
  titleId?: string;
  onClose: () => void;
  /** Fired when the user closes the modal after pressing Create. */
  onTrainingStarted?: () => void;
  /** Fired when the user stops training from the progress view. */
  onTrainingStopped?: () => void;
  /** Reopen in the "your model is being trained" state (e.g. from the Training pill). */
  initialTraining?: boolean;
}) {
  const [openSection, setOpenSection] = useState<"policy" | "feedback" | null>("policy");
  const [loading, setLoading] = useState(!initialTraining);
  const [error, setError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<PolicyCanvasSummary[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [training, setTraining] = useState(initialTraining);
  /** Stays true after Create so closing from the setup form still keeps the Training pill. */
  const [trainingStarted, setTrainingStarted] = useState(initialTraining);
  const [setupNonce, setSetupNonce] = useState(0);

  useEffect(() => {
    // Skip fetch when reopening already-in-training; Setup bumps setupNonce to load.
    if (initialTraining && setupNonce === 0) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [setupRes, fbRes] = await Promise.all([
          fetch(`/api/admin/setup/${encodeURIComponent(apiTopic)}`),
          fetch(`/api/feedback?topic=${encodeURIComponent(apiTopic)}`),
        ]);
        if (!setupRes.ok) {
          const body = await setupRes.json().catch(() => ({}));
          throw new Error(
            typeof body.error === "string" ? body.error : `Setup load failed (${setupRes.status})`
          );
        }
        if (!fbRes.ok) {
          const body = await fbRes.json().catch(() => ({}));
          throw new Error(
            typeof body.error === "string" ? body.error : `Feedback load failed (${fbRes.status})`
          );
        }
        const setup = (await setupRes.json()) as { policyCanvases?: unknown[] };
        const fb = (await fbRes.json()) as { feedback?: FeedbackRow[] };
        if (cancelled) return;
        setPolicies(summarizePolicyCanvases(setup.policyCanvases ?? []));
        setFeedback(fb.feedback ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load training inputs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiTopic, initialTraining, setupNonce]);

  const handleClose = () => {
    if (trainingStarted) onTrainingStarted?.();
    onClose();
  };

  const toggle = (section: "policy" | "feedback") =>
    setOpenSection((cur) => (cur === section ? null : section));

  const policyCount = policies.reduce((n, p) => n + p.nodes.length, 0);
  const feedbackCount = feedback.length;

  return (
    <div
      className="obs-info-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleClose}
    >
      <div className="obs-info-card v2-train-card" onClick={(e) => e.stopPropagation()}>
        <div className="obs-info-head">
          <span id={titleId} className="obs-info-title">
            Move to V2
          </span>
          <button
            type="button"
            className="obs-info-close"
            aria-label="Close"
            onClick={handleClose}
          >
            <Ic.Close size={16} />
          </button>
        </div>
        <div className="obs-info-body">
          {training ? (
            <div className="v2-train-progress">
              <SiteLogo size={122} href={false} animateColors />
              <p className="v2-train-progress-text">Your model is being trained.</p>
              <div className="v2-train-progress-actions">
                <button
                  type="button"
                  className="v2-train-action-pill"
                  onClick={() => {
                    setTraining(false);
                    // Reload if we never fetched (e.g. reopened from the Training pill).
                    if (policies.length === 0 && feedback.length === 0) {
                      setSetupNonce((n) => n + 1);
                    }
                  }}
                >
                  Setup
                </button>
                <button
                  type="button"
                  className="v2-train-action-pill"
                  onClick={() => {
                    onTrainingStopped?.();
                    onClose();
                  }}
                >
                  Stop
                </button>
              </div>
            </div>
          ) : (
            <>
              <p>
                All the information defined in the <b>policy</b> and <b>state</b>, and all the
                feedback you have provided, will be used to train the V2 custom model.
              </p>

              {loading ? (
                <p className="v2-train-status">Loading policy and feedback…</p>
              ) : error ? (
                <p className="v2-train-status v2-train-error">{error}</p>
              ) : (
                <div className="v2-train-accs">
                  <div className={"sim-acc" + (openSection === "policy" ? " open" : "")}>
                    <button
                      type="button"
                      className="sim-acc-head"
                      aria-expanded={openSection === "policy"}
                      onClick={() => toggle("policy")}
                    >
                      <span className="sim-acc-title">
                        Policy
                        <span className="v2-train-count">
                          {policies.length} canvas{policies.length === 1 ? "" : "es"}
                          {policyCount > 0 ? ` · ${policyCount} nodes` : ""}
                        </span>
                      </span>
                      <Ic.Chevron size={16} />
                    </button>
                    {openSection === "policy" && (
                      <div className="sim-acc-body v2-train-body">
                        {policies.length === 0 ? (
                          <p className="sim-acc-text">No policy canvases saved yet.</p>
                        ) : (
                          policies.map((canvas) => (
                            <div key={canvas.id} className="v2-train-block">
                              <div className="v2-train-block-title">{canvas.name}</div>
                              {canvas.freeText ? (
                                <pre className="v2-train-pre">{canvas.freeText}</pre>
                              ) : null}
                              {canvas.nodes.length === 0 ? (
                                <p className="sim-acc-text">Empty canvas.</p>
                              ) : (
                                <ul className="v2-train-list">
                                  {canvas.nodes.map((node) => (
                                    <li key={node.id}>
                                      <span className="v2-train-node-type">{formatNodeType(node.type)}</span>
                                      <span className="v2-train-node-label">{node.label}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className={"sim-acc" + (openSection === "feedback" ? " open" : "")}>
                    <button
                      type="button"
                      className="sim-acc-head"
                      aria-expanded={openSection === "feedback"}
                      onClick={() => toggle("feedback")}
                    >
                      <span className="sim-acc-title">
                        Feedback
                        <span className="v2-train-count">
                          {feedbackCount} entr{feedbackCount === 1 ? "y" : "ies"}
                        </span>
                      </span>
                      <Ic.Chevron size={16} />
                    </button>
                    {openSection === "feedback" && (
                      <div className="sim-acc-body v2-train-body">
                        {feedback.length === 0 ? (
                          <p className="sim-acc-text">No feedback saved yet.</p>
                        ) : (
                          <ul className="v2-train-list">
                            {feedback.map((row, i) => (
                              <li
                                key={`${row.conversation_id}-${row.message_index}-${row.signal}-${i}`}
                              >
                                <div className="v2-train-fb-meta">
                                  <span>
                                    {row.conversation_title ?? "Conversation"} · msg #
                                    {row.message_index + 1} · {row.message_role}
                                  </span>
                                </div>
                                {row.message_excerpt ? (
                                  <div className="v2-train-fb-excerpt">
                                    “{row.message_excerpt}”
                                  </div>
                                ) : null}
                                <div className="v2-train-fb-body">{formatFeedbackLine(row)}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!training && (
            <div className="obs-info-actions">
              <button
                type="button"
                className="obs-info-btn primary"
                onClick={() => {
                  setTraining(true);
                  setTrainingStarted(true);
                }}
                title={
                  trainingStarted
                    ? "Continue training"
                    : "Create V2 from policy and feedback"
                }
              >
                {trainingStarted ? "Next" : "Create"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
