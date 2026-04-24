/**
 * Splits a question body into a clean lead instruction and any
 * embedded numbered fragments (parajumble sentences, sentence-insertion
 * paragraph blanks, "options" pasted inside the stem, etc.).
 *
 * The original `question` field often arrives like:
 *
 *   Five jumbled-up sentences (labelled 1, 2, 3, 4 and 5)...
 *
 *   1. Part of the appeal of forecasting...
 *   2. The tight connection between...
 *
 * Visually it should render as:
 *   - a lead paragraph (the instruction),
 *   - then each numbered fragment on its own line / card,
 *   - then any trailing instruction line.
 */
export interface FormattedQuestion {
  lead: string;
  fragments: { label: string; text: string }[];
  trailer?: string;
}

const FRAG_REGEX = /(?:^|\n)\s*(\d{1,2})[\.\)]\s+/g;

export function formatQuestion(raw: string): FormattedQuestion {
  if (!raw) return { lead: "", fragments: [] };
  const text = raw.replace(/\r\n/g, "\n").trim();

  // Find all numbered fragment starts.
  const matches: { idx: number; label: string }[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(FRAG_REGEX.source, "g");
  while ((m = re.exec(text)) !== null) {
    matches.push({ idx: m.index + (m[0].length - m[0].trimStart().length), label: m[1] });
  }

  // Need at least 2 numbered items to treat as a list.
  if (matches.length < 2) {
    return { lead: text, fragments: [] };
  }

  // Confirm sequential numbering 1,2,3... otherwise treat as plain.
  const labels = matches.map((x) => parseInt(x.label, 10));
  const sequential = labels.every((n, i) => n === i + 1 || n === labels[0] + i);
  if (!sequential) return { lead: text, fragments: [] };

  // First match's start position (in the trimmed string) gives lead end.
  // We need raw match offsets, so re-scan.
  const re2 = /(?:^|\n)\s*(\d{1,2})[\.\)]\s+/g;
  const offsets: { start: number; matchLen: number; label: string }[] = [];
  let mm: RegExpExecArray | null;
  while ((mm = re2.exec(text)) !== null) {
    // Skip the leading newline character if present
    const lead = mm[0];
    const start = mm.index + (lead.startsWith("\n") ? 1 : 0);
    offsets.push({ start, matchLen: lead.replace(/^\n/, "").length, label: mm[1] });
  }

  const lead = text.slice(0, offsets[0].start).trim();
  const fragments: { label: string; text: string }[] = [];
  for (let i = 0; i < offsets.length; i++) {
    const o = offsets[i];
    const contentStart = o.start + o.matchLen;
    const contentEnd = i + 1 < offsets.length ? offsets[i + 1].start : text.length;
    fragments.push({
      label: o.label,
      text: text.slice(contentStart, contentEnd).trim(),
    });
  }

  // If the last fragment contains a trailing instruction line (e.g. "Pick the odd one"),
  // we leave it as part of the fragment for simplicity.
  return { lead, fragments };
}
