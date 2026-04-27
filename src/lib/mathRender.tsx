import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

/**
 * Renders text that may contain LaTeX math written in CAT-style notation:
 *   $$ ... $$   inline math (CAT papers wrap with $$ … $$)
 *   $ ... $     also inline
 *   \( ... \)   inline
 *   \[ ... \]   block
 *
 * Anything outside math delimiters is rendered as plain text, preserving
 * line breaks.
 */
export function renderMath(text: string): React.ReactNode[] {
  if (!text) return [];

  // Normalize: many CAT JSONs use $$...$$ for inline. Convert \( \) and \[ \] too.
  // We tokenize by walking through and matching delimiters in order.
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const len = text.length;

  const pushText = (s: string) => {
    if (!s) return;
    // Preserve newlines via <br/>
    const parts = s.split("\n");
    parts.forEach((p, idx) => {
      if (p) nodes.push(<React.Fragment key={key++}>{p}</React.Fragment>);
      if (idx < parts.length - 1) nodes.push(<br key={key++} />);
    });
  };

  while (i < len) {
    // Block math \[ ... \]
    if (text.startsWith("\\[", i)) {
      const end = text.indexOf("\\]", i + 2);
      if (end !== -1) {
        const expr = text.slice(i + 2, end).trim();
        try {
          nodes.push(<BlockMath key={key++} math={expr} />);
        } catch {
          pushText(text.slice(i, end + 2));
        }
        i = end + 2;
        continue;
      }
    }
    // Inline math \( ... \)
    if (text.startsWith("\\(", i)) {
      const end = text.indexOf("\\)", i + 2);
      if (end !== -1) {
        const expr = text.slice(i + 2, end).trim();
        try {
          nodes.push(<InlineMath key={key++} math={expr} />);
        } catch {
          pushText(text.slice(i, end + 2));
        }
        i = end + 2;
        continue;
      }
    }
    // $$ ... $$ — CAT JSONs use this for inline
    if (text.startsWith("$$", i)) {
      const end = text.indexOf("$$", i + 2);
      if (end !== -1) {
        const expr = text.slice(i + 2, end).trim();
        try {
          nodes.push(<InlineMath key={key++} math={expr} />);
        } catch {
          pushText(text.slice(i, end + 2));
        }
        i = end + 2;
        continue;
      }
    }
    // $ ... $  (only treat as math when content looks math-like; avoid swallowing
    // currency like "$5" or stray dollar signs in plain prose)
    if (text[i] === "$") {
      const end = text.indexOf("$", i + 1);
      if (end !== -1 && end - i < 200 && end > i + 1) {
        const expr = text.slice(i + 1, end);
        const trimmed = expr.trim();
        const looksLikeMath =
          trimmed.length > 0 &&
          !/^\s/.test(expr) && // no leading space (currency-style "$ 5")
          /[\\^_={}\/]|\\[a-zA-Z]+|\d\s*[+\-*\/^]\s*\d|[a-zA-Z]\s*[\^_]/.test(trimmed);
        if (looksLikeMath) {
          try {
            nodes.push(<InlineMath key={key++} math={trimmed} />);
          } catch {
            pushText(text.slice(i, end + 1));
          }
          i = end + 1;
          continue;
        }
      }
      // not math — emit the $ as text and move on
      pushText("$");
      i += 1;
      continue;
    }

    // Plain text: accumulate until next potential delimiter
    let next = len;
    for (const d of ["\\[", "\\(", "$$", "$"]) {
      const idx = text.indexOf(d, i);
      if (idx !== -1 && idx < next) next = idx;
    }
    pushText(text.slice(i, next));
    i = next;
  }

  return nodes;
}

/** Convenience component */
export function MathText({ text, className = "" }: { text: string; className?: string }) {
  return <span className={className}>{renderMath(text)}</span>;
}
