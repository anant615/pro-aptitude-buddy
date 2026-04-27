import React from "react";
import { formatQuestion } from "@/lib/formatQuestion";
import { renderMath } from "@/lib/mathRender";

/**
 * Render a string that may contain markdown image syntax `![alt](url)` and/or
 * raw image URLs. Non-image text segments are passed through `renderMath` so
 * LaTeX still works.
 */
function renderWithImages(text: string): React.ReactNode[] {
  if (!text) return [];
  const out: React.ReactNode[] = [];
  // Match either ![alt](url) markdown or a bare image URL
  const regex = /!\[([^\]]*)\]\(([^)\s]+)\)|(https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|svg)(?:\?\S*)?)/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      const chunk = text.slice(last, m.index);
      out.push(<React.Fragment key={`t-${key++}`}>{renderMath(chunk)}</React.Fragment>);
    }
    const url = m[2] || m[3];
    const alt = m[1] || "Question image";
    out.push(
      <img
        key={`img-${key++}`}
        src={url}
        alt={alt}
        className="my-3 max-w-full h-auto rounded-lg border bg-card"
        loading="lazy"
      />,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push(<React.Fragment key={`t-${key++}`}>{renderMath(text.slice(last))}</React.Fragment>);
  }
  return out;
}

export default function QuestionBody({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const { lead, fragments } = formatQuestion(text);

  return (
    <div className={className}>
      {lead && (
        <div className="font-medium leading-relaxed">
          {renderWithImages(lead)}
        </div>
      )}
      {fragments.length > 0 && (
        <ol className="mt-4 space-y-2.5">
          {fragments.map((f) => (
            <li
              key={f.label}
              className="flex gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm leading-relaxed"
            >
              <span className="flex-shrink-0 font-semibold text-primary tabular-nums w-6">
                {f.label}.
              </span>
              <span className="flex-1">{renderWithImages(f.text)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
