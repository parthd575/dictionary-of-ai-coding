import MiniSearch from "minisearch";
import { content } from "./content";
import type { Entry } from "../types";

export type Answer = {
  entry: Entry;
  details: string[];
  related: Entry[];
};

const STOP = new Set(
  `a an the is are was were be been do does did can could should would will what whats how why when where which who whom
  i me my we you your it its this that these those of in on for to from with about into as at by and or not no vs
  explain tell mean means meaning define definition difference between versus example examples use used using work works
  working please give show`.split(/\s+/),
);

const stem = (t: string) => (t.length > 3 ? t.replace(/(es|s)$/, "") : t);
const tokens = (s: string) =>
  (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => !STOP.has(t)).map(stem);

const index = new MiniSearch<Entry>({
  fields: ["title", "description", "body", "usage"],
  idField: "slug",
  searchOptions: { boost: { title: 5, description: 2 }, prefix: true, fuzzy: 0.2, combineWith: "OR" },
});
index.addAll(Object.values(content.entries));

const byTitleLength = Object.values(content.entries).sort((a, b) => b.title.length - a.title.length);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function titleMatches(question: string): Entry[] {
  return byTitleLength.filter((e) =>
    new RegExp(`(^|[^a-z0-9])${escape(e.title.toLowerCase())}(s|es)?([^a-z0-9]|$)`).test(question.toLowerCase()),
  );
}

const plain = (md: string) =>
  md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "");

function sentencesOf(entry: Entry): string[] {
  return plain(entry.body)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("|"))
    .flatMap((l) => l.split(/(?<=[.!?])\s+(?=[A-Z"“])/))
    .map((s) => s.replace(/^[-•]\s*/, "").trim())
    .filter((s) => s.length > 20);
}

export function ask(question: string): Answer | null {
  const direct = titleMatches(question);
  const titleTokens = new Set(direct.flatMap((e) => tokens(e.title)));
  const rest = tokens(question).filter((t) => !titleTokens.has(t));

  // A question that is only the term(s) is a definition request; otherwise the extra words decide.
  const query = direct.length && rest.length ? rest.join(" ") : question;
  const ranked = index.search(query.trim() || " ").map((r) => content.entries[r.id as string]!);

  const entry = direct.length && !rest.length ? direct[0] : (ranked[0] ?? direct[0]);
  if (!entry) return null;

  const q = new Set(tokens(question));
  for (const t of tokens(entry.title)) q.delete(t);

  const lead = plain(entry.description).slice(0, 40).toLowerCase();
  const sentences = sentencesOf(entry).filter((s) => !s.toLowerCase().startsWith(lead));
  const scored = sentences.map((s, i) => {
    const words = new Set(tokens(s));
    let score = 0;
    q.forEach((t) => words.has(t) && score++);
    return { s, i, score };
  });
  const hits = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.i - b.i).slice(0, 2);
  const picked = (hits.length ? hits : scored.slice(0, 2)).sort((a, b) => a.i - b.i).map((x) => x.s);

  const related = [...direct.slice(1), ...ranked]
    .filter((e, i, all) => e.slug !== entry.slug && all.findIndex((x) => x.slug === e.slug) === i)
    .slice(0, 3);

  return { entry, details: picked, related };
}
