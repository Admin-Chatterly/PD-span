/**
 * Escape a user-typed string for use inside a PostgREST `ilike` pattern that is
 * itself embedded in an `or(...)` filter list. Both the LIKE wildcards and the
 * quotes that delimit the value have to be neutralised, or a search for `50%`
 * or `o"neil` changes the shape of the query.
 */
export function likePattern(term: string): string {
  const escaped = term.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/"/g, '\\"')
  return `"%${escaped}%"`
}

/** PostgREST rejects a malformed uuid, so ids from the URL are filtered first. */
export function isUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value)
}

/** Keep only the ids that are safe to interpolate into an `in.(...)` list. */
export function uuidList(ids: (string | null | undefined)[]): string[] {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id) && isUuid(id!))))
}
