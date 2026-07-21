import { Avatar } from "../ra-shared";
import type { StudioChatConfig } from "./types";

const LOGO_DIV_CLASS = {
  th: "th-logo",
  bubble: "bubble-logo",
} as const;

/**
 * The assistant's brand mark, rendered wherever the studio needs to show
 * "this came from the assistant" — thread header, bubbles, empty state.
 * `config.assistantMark` picks between a square photo mark (law, analyst)
 * and a circular photo Avatar (sleep); size/ring are fixed per variant.
 */
export function AssistantMark({
  variant,
  config,
}: {
  variant: "th" | "bubble" | "empty";
  config: Pick<StudioChatConfig, "assistantMark" | "avatarMono" | "avatarSrc" | "emptyStateHref">;
}) {
  if (config.assistantMark === "avatar") {
    if (variant === "th") {
      return <Avatar kind="assistant" size={18} ring mono={config.avatarMono} src={config.avatarSrc} />;
    }
    if (variant === "bubble") {
      return <Avatar kind="assistant" size={28} mono={config.avatarMono} src={config.avatarSrc} />;
    }
    return (
      <Avatar
        kind="assistant"
        size={96}
        ring
        mono={config.avatarMono}
        src={config.avatarSrc}
        className="empty-orb"
      />
    );
  }
  const src = config.avatarSrc;
  if (variant === "empty") {
    return (
      <div className="empty-logo">
        <a href={config.emptyStateHref} aria-label="Home">
          {src ? (
            <img className="empty-logo-sq" src={src} alt="" />
          ) : (
            <div className="empty-logo-sq" aria-hidden="true" />
          )}
        </a>
      </div>
    );
  }
  if (src) {
    return (
      <img
        className={LOGO_DIV_CLASS[variant]}
        src={src}
        alt=""
        aria-hidden="true"
      />
    );
  }
  return <div className={LOGO_DIV_CLASS[variant]} aria-hidden="true" />;
}
