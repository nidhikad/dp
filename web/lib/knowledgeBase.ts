/**
 * Backend and agents default to this KB when none is configured.
 * Frontend must send a non-empty kb_name so Python's dict.get("kb_name", default)
 * does not receive "" and skip the default.
 */
export const DEFAULT_KB_NAME = "ai_textbook";

export function normalizeKbName(kb: string | undefined | null): string {
  const t = (kb ?? "").trim();
  return t.length > 0 ? t : DEFAULT_KB_NAME;
}

export type KnowledgeListItem = { name: string; is_default?: boolean };

export function parseKnowledgeListResponse(raw: unknown): KnowledgeListItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
    .map((x) => ({
      name: String((x as { name?: unknown }).name ?? ""),
      is_default: Boolean((x as { is_default?: unknown }).is_default),
    }))
    .filter((x) => x.name.length > 0);
}

/** Names for dropdowns; falls back so solver / generator always have a target KB. */
export function knowledgeNamesOrFallback(items: KnowledgeListItem[]): string[] {
  const names = items.map((k) => k.name);
  return names.length > 0 ? names : [DEFAULT_KB_NAME];
}
