import raw from "../generated/content.json";
import type { Content, Entry } from "../types";

export const content = raw as Content;

export const order: string[] = content.sections.flatMap((s) => s.slugs);

export const alphabetical: Entry[] = Object.values(content.entries).sort((a, b) =>
  a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
);

export const backlinks: Record<string, string[]> = {};
for (const slug of order) backlinks[slug] = [];
for (const e of Object.values(content.entries)) {
  for (const to of e.links) backlinks[to]!.push(e.slug);
}

export function neighbours(slug: string): { prev?: Entry; next?: Entry } {
  const i = order.indexOf(slug);
  const prev = order[i - 1];
  const next = order[i + 1];
  return {
    prev: prev ? content.entries[prev] : undefined,
    next: next ? content.entries[next] : undefined,
  };
}
