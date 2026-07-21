import { Avatar } from "../ra-shared";
import SiteLogo from "../../../components/SiteLogo";
import type { StudioChatConfig } from "./types";

const LOGO_DIV_CLASS = {
  th: "th-logo",
  bubble: "bubble-logo",
} as const;

/**
 * The assistant's brand mark, rendered wherever the studio needs to show
 * "this came from the assistant" — thread header, bubbles, empty state.
 * `config.assistantMark` picks between the site's square logo (law, analyst)
 * and a photo/mono Avatar (sleep); everything else about the mark (size, ring)
 * is fixed per call-site variant.
 */
export function AssistantMark({
  variant,
  config,
}: {
  variant: "th" | "bubble" | "empty";
  config: Pick<StudioChatConfig, "assistantMark" | "avatarMono" | "emptyStateHref">;
}) {
  if (config.assistantMark === "avatar") {
    if (variant === "th") {
      return <Avatar kind="assistant" size={18} ring mono={config.avatarMono} />;
    }
    if (variant === "bubble") {
      return <Avatar kind="assistant" size={28} mono={config.avatarMono} />;
    }
    return <Avatar kind="assistant" size={96} ring mono={config.avatarMono} className="empty-orb" />;
  }
  if (variant === "empty") {
    return (
      <div className="empty-logo">
        <SiteLogo size={96} href={config.emptyStateHref} />
      </div>
    );
  }
  return <div className={LOGO_DIV_CLASS[variant]} aria-hidden="true" />;
}
