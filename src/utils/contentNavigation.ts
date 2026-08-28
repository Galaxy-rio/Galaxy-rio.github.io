interface DatedContentEntry {
  data: {
    date: string;
  };
}

interface MarkdownSectionHeading {
  depth: number;
  slug: string;
  text: string;
}

export function groupContentByYear<T extends DatedContentEntry>(entries: readonly T[]) {
  const years = [...new Set(entries.map((entry) => entry.data.date.slice(0, 4)))]
    .sort((a, b) => b.localeCompare(a));

  return years.map((year) => ({
    year,
    entries: entries.filter((entry) => entry.data.date.startsWith(`${year}-`)),
  }));
}

export function selectSecondLevelHeadings<T extends MarkdownSectionHeading>(
  headings: readonly T[],
): T[] {
  return headings.filter((heading) => heading.depth === 2);
}
