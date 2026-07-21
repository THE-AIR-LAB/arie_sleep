"use client";

/**
 * Floating status pill for V2 training — same chrome as the simulation
 * "Running" pill, with a Training label. Click reopens the training modal.
 */
export function TrainingPill({
  floating = true,
  onClick,
}: {
  floating?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={"sim-controls-pill is-collapsed" + (floating ? " is-floating" : "")}
      role="status"
      aria-live="polite"
      aria-label="Training in progress"
    >
      <button
        type="button"
        className="sim-controls-pill-btn v2-train-pill-btn"
        onClick={onClick}
        title="Training in progress"
        aria-label="Training in progress"
      >
        <span className="v2-train-pill-spinner" aria-hidden="true" />
        <span>Training in progress</span>
      </button>
    </div>
  );
}
