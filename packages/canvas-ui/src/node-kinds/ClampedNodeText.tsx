import type { CSSProperties, ReactNode } from "react";
import ReactMarkdown from "react-markdown";

const clampBaseStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  wordBreak: "break-word",
};

const mdClassName =
  "rf-node-md [&_h1]:my-0.5 [&_h1]:text-[1.05em] [&_h1]:font-semibold [&_h2]:my-0.5 [&_h2]:text-[1.02em] [&_h2]:font-semibold [&_h3]:my-0.5 [&_h3]:font-semibold [&_p]:my-0.5 [&_p]:leading-[inherit] [&_ul]:my-0.5 [&_ul]:list-disc [&_ul]:pl-3.5 [&_ol]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-3.5 [&_li]:my-0 [&_li]:leading-[inherit] [&_strong]:font-semibold [&_em]:italic [&_code]:font-mono [&_code]:text-[0.92em]";

export function ClampedNodeText({
  children,
  className = "",
  lines = 4,
  title,
}: {
  children: ReactNode;
  className?: string;
  lines?: number;
  title?: string;
}) {
  const isMarkdown = typeof children === "string";

  return (
    <div
      className={`rf-node-desc ${isMarkdown ? mdClassName : ""} ${className}`.trim()}
      style={{
        ...clampBaseStyle,
        WebkitLineClamp: lines,
        whiteSpace: isMarkdown ? "normal" : "pre-wrap",
      }}
      title={title}
    >
      {isMarkdown ? <ReactMarkdown>{children}</ReactMarkdown> : children}
    </div>
  );
}
