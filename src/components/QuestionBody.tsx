import { formatQuestion } from "@/lib/formatQuestion";
import { renderMath } from "@/lib/mathRender";

/**
 * Renders a question stem with the lead instruction and any embedded
 * numbered fragments (parajumble sentences, etc.) as visually separate blocks.
 * Math expressions written in $...$, $$...$$, \(...\), \[...\] are rendered
 * via KaTeX so CAT-style notation like $$(625)^{65}$$ displays correctly.
 */
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
        <p className="font-medium leading-relaxed">
          {renderMath(lead)}
        </p>
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
              <span className="flex-1">{renderMath(f.text)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
