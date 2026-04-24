/**
 * Extract the canonical TITA (Type-In-The-Answer) answer string from a
 * solution body. CAT solutions written by our pipeline always begin with
 * "Answer: XXXX" — we read the first such occurrence.
 *
 * Returns the raw answer string (may be a number, sequence like "1423", or
 * short text). Returns null if not parseable.
 */
export function extractTitaAnswer(solution: string): string | null {
  if (!solution) return null;
  // Match "Answer: 1423" or "Answer - 42" or "Ans: 7"
  const m = solution.match(/(?:^|\n)\s*(?:Answer|Ans)\s*[:\-–—]\s*([^\n<]+)/i);
  if (!m) return null;
  return m[1].trim().replace(/[.*]+$/g, "").trim();
}

/**
 * Compare a user-typed TITA answer with the canonical answer.
 * - Numeric answers are compared by value (so "42.0" === "42").
 * - String answers are compared case-insensitively, ignoring whitespace.
 * - Sequence answers ("1423" vs "1-4-2-3") are normalized by stripping non-digits.
 */
export function checkTitaAnswer(userInput: string, canonical: string): boolean {
  if (!userInput || !canonical) return false;
  const u = userInput.trim();
  const c = canonical.trim();

  // Pure numeric (allowing decimal/negative)
  const numU = Number(u.replace(/,/g, ""));
  const numC = Number(c.replace(/,/g, ""));
  if (!Number.isNaN(numU) && !Number.isNaN(numC)) {
    return Math.abs(numU - numC) < 1e-6;
  }

  // Digit-sequence comparison (e.g., "1-4-2-3" vs "1423")
  const digitsU = u.replace(/\D+/g, "");
  const digitsC = c.replace(/\D+/g, "");
  if (digitsU && digitsC && digitsU === digitsC) return true;

  // Loose text compare
  return u.toLowerCase().replace(/\s+/g, " ") === c.toLowerCase().replace(/\s+/g, " ");
}
