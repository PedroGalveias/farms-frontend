// Fuzzy matching + ranking for the ⌘K command palette. Pure and framework-free
// so it can be unit-tested in isolation; the palette component supplies the
// candidate items (farms, products, pages, actions) and resolves a selection.

export type CommandKind = "page" | "action" | "farm" | "product";

export interface CommandItem {
  /** Stable id, unique within a render (e.g. `farm:<uuid>`). */
  id: string;
  kind: CommandKind;
  label: string;
  /** Secondary, dimmer text (canton, product group, …). Also searched. */
  hint?: string;
  /** Extra searchable text that isn't shown (synonyms, address). */
  keywords?: string;
}

/**
 * Score how well `query` matches `text`. Higher is better; `null` means no
 * match. A contiguous substring beats a scattered subsequence, and a match at
 * the start or on a word boundary beats one mid-word. An empty query matches
 * everything with a neutral score.
 */
export function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (q === "") return 0;

  const index = t.indexOf(q);
  if (index !== -1) {
    const onBoundary = index === 0 || /\s/.test(t[index - 1]);
    // Substrings dominate; earlier and boundary-aligned hits rank higher.
    return 1000 + (onBoundary ? 100 : 40) - index;
  }

  // Fall back to an in-order subsequence, rewarding consecutive runs.
  let cursor = 0;
  let score = 0;
  let streak = 0;
  for (const char of q) {
    let found = -1;
    for (let k = cursor; k < t.length; k++) {
      if (t[k] === char) {
        found = k;
        break;
      }
    }
    if (found === -1) return null;
    streak = found === cursor ? streak + 1 : 0;
    score += 1 + streak;
    cursor = found + 1;
  }
  return score;
}

/**
 * Filter + sort items by relevance to `query`. Label matches are weighted above
 * hint/keyword matches so e.g. a farm named "Berghof" outranks one merely in
 * canton Bern. With an empty query the original order is preserved (the caller
 * decides what defaults to show). Ties keep input order (stable sort).
 */
export function rankCommands<T extends CommandItem>(
  query: string,
  items: T[],
  limit = 24,
): T[] {
  const q = query.trim();
  if (q === "") return items.slice(0, limit);

  const scored: { item: T; score: number; order: number }[] = [];
  items.forEach((item, order) => {
    const labelScore = fuzzyScore(q, item.label);
    const metaScore = fuzzyScore(
      q,
      `${item.hint ?? ""} ${item.keywords ?? ""}`,
    );
    let score: number | null = null;
    if (labelScore !== null && metaScore !== null) {
      score = labelScore * 2 + metaScore;
    } else if (labelScore !== null) {
      score = labelScore * 2;
    } else if (metaScore !== null) {
      score = metaScore;
    }
    if (score !== null) scored.push({ item, score, order });
  });

  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  return scored.slice(0, limit).map((entry) => entry.item);
}
