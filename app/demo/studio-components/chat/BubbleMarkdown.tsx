"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Empty `[]`, underscore blanks, yes/no, or short placeholder tokens like `[city]`. */
const BLANK_TOKEN =
  /\[(?:\s*|_{2,}|yes\s*\/\s*no|[a-z][a-z0-9_\s/-]{0,24})\]/gi;

/** Bare fill-ins LLMs often emit: `Seller: ______` or `$______`. */
const BARE_BLANK = /\$?_{3,}/g;

export function looksLikeWorksheet(text: string): boolean {
  const blanks = text.match(BLANK_TOKEN) ?? [];
  if (blanks.length >= 3) return true;
  const bare = text.match(BARE_BLANK) ?? [];
  // Two+ underscore runs (common in templates) → treat as a form worksheet.
  if (bare.length >= 2) return true;
  // "Label: ____" lines even when only one blank is present.
  if (/^[^\n:]{1,40}:\s*\$?_{3,}\s*$/m.test(text) && bare.length >= 1) return true;
  if (
    /fill[- ]?in[- ]the[- ]blank|worksheet|intake\s+form|fill\s+out|document\s+index\s+template/i.test(
      text
    ) &&
    (blanks.length >= 1 || bare.length >= 1)
  ) {
    return true;
  }
  return false;
}

export function worksheetSectionCount(text: string): number {
  const normalized = normalizeWorksheetText(text);
  const matches = normalized.match(/^\s*\d{1,2}\.\s+\S/gm);
  return matches?.length ?? 0;
}

/**
 * One-line plain preview for collapsed bubbles. Strips markdown structure so
 * lists / breaks can't force the collapsed shell taller than a single line.
 */
export function collapsedPlainPreview(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~|>]+/g, "")
    .replace(/\$?_{3,}/g, "…")
    .replace(/\[[^\]]*\]/g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * LLMs often jam the next numbered section onto the same line as a blank.
 * Pull those apart so the form can stack cleanly.
 */
function normalizeWorksheetText(text: string): string {
  let t = text.replace(/\r\n/g, "\n").trim();
  // "…blank] 4. Next section" → break before the number
  t = t.replace(/([^\n])\s+(\d{1,2}\.\s+[A-Za-z*])/g, "$1\n\n$2");
  // "…blank] Exact wording:" / "…blank] If yes," → own line
  t = t.replace(/(\[[^\]]*\])\s+(?=(?:If\s|Exact\s|Date\s|Who\s|What\s|When\s|Where\s|How\s|[A-Z][^.\n]{0,48}:))/g, "$1\n");
  // Collapse 3+ blank lines
  t = t.replace(/\n{3,}/g, "\n\n");
  return t;
}

type BlankKind = "empty" | "line" | "choice" | "token";

function classifyBlank(raw: string): { kind: BlankKind; label: string } {
  // Bare underscore / $____ runs
  if (/^\$?_+$/.test(raw)) return { kind: "line", label: "" };
  const inner = raw.startsWith("[") ? raw.slice(1, -1).trim() : raw.trim();
  if (!inner) return { kind: "empty", label: "" };
  if (/^_+$/.test(inner)) return { kind: "line", label: "" };
  if (/^yes\s*\/\s*no$/i.test(inner)) return { kind: "choice", label: "yes / no" };
  return { kind: "token", label: inner };
}

/** Match bracket blanks or bare underscore fill-ins, in document order. */
const ANY_BLANK =
  /\[(?:\s*|_{2,}|yes\s*\/\s*no|[a-z][a-z0-9_\s/-]{0,24})\]|\$?_{3,}/gi;

function renderInlineWithBlanks(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = new RegExp(ANY_BLANK.source, "gi");
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(
        <span key={`t-${key++}`} className="bubble-form-text">
          {text.slice(last, m.index)}
        </span>
      );
    }
    const { kind, label } = classifyBlank(m[0]);
    nodes.push(
      <span
        key={`b-${key++}`}
        className={
          "bubble-form-blank" +
          (kind === "choice" ? " is-choice" : "") +
          (kind === "line" || kind === "empty" ? " is-line" : "") +
          (kind === "token" ? " is-token" : "")
        }
        aria-label={label ? `Blank: ${label}` : "Blank"}
      >
        {kind === "choice" ? "yes / no" : kind === "token" ? label : "\u00a0"}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(
      <span key={`t-${key++}`} className="bubble-form-text">
        {text.slice(last)}
      </span>
    );
  }
  return nodes;
}

function stripMdNoise(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#+\s+/, "")
    .trim();
}

type FormSection = { number?: string; title: string; rows: string[] };

function parseWorksheet(text: string): { intro: string; sections: FormSection[] } {
  const normalized = normalizeWorksheetText(text);
  const lines = normalized.split("\n");
  const introLines: string[] = [];
  const sections: FormSection[] = [];
  let current: FormSection | null = null;

  const sectionStart = /^(\d{1,2})\.\s+(.*)$/;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (!current) introLines.push("");
      continue;
    }
    const sm = line.match(sectionStart);
    if (sm) {
      current = {
        number: sm[1],
        title: stripMdNoise(sm[2]),
        rows: [],
      };
      sections.push(current);
      continue;
    }
    if (current) {
      current.rows.push(stripMdNoise(line));
    } else {
      introLines.push(line);
    }
  }

  // If we never found numbered sections, treat the whole body as one block of rows
  // (still nicer than a jammed paragraph).
  if (sections.length === 0) {
    const body = normalizeWorksheetText(text);
    const introEnd = body.search(/\n\s*\d{1,2}\.\s|\n\s*[-*]\s|\[/);
    const intro =
      introEnd > 0 ? stripMdNoise(body.slice(0, introEnd).trim()) : "";
    const rest = introEnd > 0 ? body.slice(introEnd) : body;
    return {
      intro,
      sections: [
        {
          title: "Worksheet",
          rows: rest
            .split("\n")
            .map((l) => stripMdNoise(l))
            .filter(Boolean),
        },
      ],
    };
  }

  return {
    intro: stripMdNoise(introLines.join("\n").trim()),
    sections,
  };
}

function BubbleWorksheet({ text }: { text: string }) {
  const { intro, sections } = parseWorksheet(text);
  return (
    <div className="bubble-form">
      {intro ? (
        <div className="bubble-form-intro">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro}</ReactMarkdown>
        </div>
      ) : null}
      <div className="bubble-form-sections">
        {sections.map((section, si) => (
          <section key={`${section.number ?? "s"}-${si}`} className="bubble-form-section">
            <header className="bubble-form-section-head">
              {section.number ? (
                <span className="bubble-form-num">{section.number}</span>
              ) : null}
              <span className="bubble-form-section-title">{section.title}</span>
            </header>
            {section.rows.length > 0 ? (
              <ul className="bubble-form-rows">
                {section.rows.map((row, ri) => (
                  <li key={ri} className="bubble-form-row">
                    {renderInlineWithBlanks(row)}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}

/**
 * Markdown renderer for chat bubbles — GFM so tables (intake forms, comparison
 * sheets) render as real HTML tables instead of raw `|` pipes. Fill-in-the-blank
 * worksheets are detected and laid out as structured form cards. Raw JSON
 * objects/arrays render as readable field cards (not a monospace wall).
 */
export function BubbleMarkdown({ children }: { children: string }) {
  if (looksLikeWorksheet(children)) {
    return <BubbleWorksheet text={children} />;
  }

  const json = parseJsonMessage(children);
  if (json) {
    return (
      <>
        {json.prose ? (
          <div className="bubble-json-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{json.prose}</ReactMarkdown>
          </div>
        ) : null}
        <BubbleJson value={json.data} />
      </>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children: tableChildren }) => (
          <div className="bubble-md-table-wrap">
            <table>{tableChildren}</table>
          </div>
        ),
        pre: ({ children: preChildren }) => (
          <pre className="bubble-md-pre">{preChildren}</pre>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function BubbleJsonValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="bubble-json-empty">—</span>;
  }
  if (typeof value === "boolean") {
    return <span className="bubble-json-scalar">{value ? "Yes" : "No"}</span>;
  }
  if (typeof value === "number") {
    return <span className="bubble-json-scalar">{value}</span>;
  }
  if (typeof value === "string") {
    return <span className="bubble-json-text">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="bubble-json-empty">None</span>;
    const allPrimitive = value.every(
      (v) => v === null || ["string", "number", "boolean"].includes(typeof v)
    );
    if (allPrimitive) {
      return (
        <ul className="bubble-json-list">
          {value.map((item, i) => (
            <li key={i}>
              {item === null || item === undefined ? "—" : String(item)}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="bubble-json-stack">
        {value.map((item, i) => (
          <div key={i} className="bubble-json-card">
            <BubbleJson value={item} />
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    return <BubbleJson value={value} />;
  }
  return <span className="bubble-json-text">{String(value)}</span>;
}

function BubbleJson({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return <BubbleJsonValue value={value} />;
  }
  if (value === null || typeof value !== "object") {
    return <BubbleJsonValue value={value} />;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return <span className="bubble-json-empty">Empty</span>;
  }
  return (
    <dl className="bubble-json">
      {entries.map(([key, val]) => (
        <div key={key} className="bubble-json-row">
          <dt className="bubble-json-key">{humanizeKey(key)}</dt>
          <dd className="bubble-json-val">
            <BubbleJsonValue value={val} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Parse a message that is (or ends with) a JSON object/array. */
function parseJsonMessage(
  text: string
): { prose: string | null; data: unknown } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const tryParse = (raw: string): unknown | null => {
    const t = raw.trim();
    if (!(t.startsWith("{") || t.startsWith("["))) return null;
    try {
      const parsed = JSON.parse(t) as unknown;
      if (parsed === null || typeof parsed !== "object") return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const whole = tryParse(trimmed);
  if (whole) return { prose: null, data: whole };

  const startObj = trimmed.indexOf("\n{");
  const startArr = trimmed.indexOf("\n[");
  let splitAt = -1;
  if (startObj >= 0 && (startArr < 0 || startObj < startArr)) splitAt = startObj + 1;
  else if (startArr >= 0) splitAt = startArr + 1;
  if (splitAt > 0) {
    const head = trimmed.slice(0, splitAt).trimEnd();
    const data = tryParse(trimmed.slice(splitAt));
    if (data) return { prose: head || null, data };
  }

  return null;
}
