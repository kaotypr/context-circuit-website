import type { SearchRecord } from "./content/consumers";

export type SearchFilters = {
  section?: string;
  track?: string;
  version?: string;
};

export type SearchResult = SearchRecord & { score: number };

function normalized(value: string): string {
  return value.toLocaleLowerCase().trim();
}

export function rankSearch(
  records: SearchRecord[],
  query: string,
  filters: SearchFilters = {},
): SearchResult[] {
  const needle = normalized(query);
  if (!needle) return [];

  return records
    .filter((record) => !filters.section || record.section === filters.section)
    .filter((record) => !filters.track || record.tracks.includes(filters.track))
    .filter(
      (record) =>
        !filters.version || Object.values(record.versions).includes(filters.version),
    )
    .map((record) => {
      const title = normalized(record.title);
      const headings = record.headings.map(normalized);
      const description = normalized(record.description);
      const body = normalized(record.text);
      let score = 0;
      if (title === needle) score += 1000;
      else if (title.startsWith(needle)) score += 700;
      else if (title.includes(needle)) score += 500;
      if (headings.some((heading) => heading === needle)) score += 900;
      else if (headings.some((heading) => heading.startsWith(needle))) score += 600;
      else if (headings.some((heading) => heading.includes(needle))) score += 400;
      if (description.includes(needle)) score += 200;
      if (body.includes(needle)) score += 100;
      return { ...record, score };
    })
    .filter((record) => record.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}
