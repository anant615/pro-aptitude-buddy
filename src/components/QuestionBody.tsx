import { formatQuestion } from "@/lib/formatQuestion";

/**
 * Renders a question stem with the lead instruction and any embedded
 * numbered fragments (parajumble sentences, etc.) as visually separate blocks.
 * Use this anywhere a question.question is displayed.
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
        <p className="font-medium leading-relaxed whitespace-pre-line">
          {lead}
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
              <span className="flex-1 whitespace-pre-line">{f.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
