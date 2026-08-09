/**
 * Product lists are sorted here rather than with SQL `ORDER BY name`, because
 * Postgres orders Thai by code point: the leading vowels เ แ โ ใ ไ are stored
 * before the consonant they are pronounced after, so "เกลือ" lands after "ฮ"
 * instead of next to "ก". `Intl.Collator("th")` knows the dictionary order.
 * `numeric` also keeps "น้ำ 2 ลิตร" ahead of "น้ำ 10 ลิตร".
 */
const collator = new Intl.Collator("th-TH", { numeric: true, sensitivity: "variant" });

/** Thai/English dictionary order (ก–ฮ, a–z). Ties break on `id` so paging is stable. */
export function compareByName(a: { name: string; id: number }, b: { name: string; id: number }) {
  return collator.compare(a.name, b.name) || a.id - b.id;
}

/** Reorders rows fetched by `id IN (...)`, which comes back in no useful order. */
export function orderByIds<T extends { id: number }>(rows: T[], ids: number[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)).filter((row): row is T => row !== undefined);
}
