import MiniSearch from "minisearch";
import { content } from "./content";

const index = new MiniSearch({
  fields: ["title", "description", "body", "usage"],
  idField: "slug",
  searchOptions: {
    boost: { title: 4, description: 2 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: "AND",
  },
});
index.addAll(Object.values(content.entries));

export function search(query: string, limit = 8) {
  if (!query.trim()) return [];
  return index
    .search(query)
    .slice(0, limit)
    .map((r) => content.entries[r.id as string]!);
}
