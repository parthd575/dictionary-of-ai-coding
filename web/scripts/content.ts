// Parse dictionary/*.md and internal/Curriculum.md into src/generated/content.json.
// Fails the build on any Entry link that does not resolve to an Entry.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Content, Entry, Section } from "../src/types.ts";

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(WEB, "..");
const DICT_DIR = join(ROOT, "dictionary");
const CURRICULUM = join(ROOT, "internal", "Curriculum.md");
const OUTPUT = join(WEB, "src", "generated", "content.json");

const SECTION_RE = /^## Section (\d+) — (.+)$/;
const LINK_RE = /\]\(\.\/([^)]+?)\.md\)/g;

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

function slugify(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCurriculum(text: string): { number: number; title: string; terms: string[] }[] {
  const sections: { number: number; title: string; terms: string[] }[] = [];
  text.split("\n").forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (line === "") return;
    const heading = line.match(SECTION_RE);
    if (heading) {
      sections.push({ number: Number(heading[1]), title: heading[2]!, terms: [] });
    } else if (line.startsWith("- ")) {
      const current = sections.at(-1);
      if (!current) fail(`Curriculum.md:${idx + 1}: bullet before any section heading`);
      current.terms.push(line.slice(2));
    } else {
      fail(`Curriculum.md:${idx + 1}: unexpected line: ${line}`);
    }
  });
  return sections;
}

function parseEntryFile(term: string, text: string): { description: string; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n+/);
  if (!m) fail(`dictionary/${term}.md: missing frontmatter`);
  const d = m[1]!.match(/^description:\s*(.+)$/m);
  if (!d) fail(`dictionary/${term}.md: missing description`);
  let description = d[1]!.trim();
  if (/^".*"$/.test(description)) description = JSON.parse(description) as string;
  else if (/^'.*'$/.test(description)) description = description.slice(1, -1).replace(/''/g, "'");
  return { description, body: text.slice(m[0].length).trim() };
}

function main(): void {
  const sections = parseCurriculum(readFileSync(CURRICULUM, "utf8"));
  const slugOf = new Map<string, string>();
  const seenSlugs = new Map<string, string>();
  for (const s of sections) {
    for (const term of s.terms) {
      if (slugOf.has(term)) fail(`Curriculum.md: duplicate term "${term}"`);
      const slug = slugify(term);
      const clash = seenSlugs.get(slug);
      if (clash) fail(`Slug clash: "${term}" and "${clash}" both become "${slug}"`);
      seenSlugs.set(slug, term);
      slugOf.set(term, slug);
    }
  }

  const onDisk = readdirSync(DICT_DIR).filter((n) => n.endsWith(".md")).map((n) => n.slice(0, -3));
  const orphans = onDisk.filter((t) => !slugOf.has(t));
  if (orphans.length) fail(`dictionary/ entries not in Curriculum.md: ${orphans.join(", ")}`);

  const entries: Record<string, Entry> = {};
  const outSections: Section[] = [];
  for (const s of sections) {
    outSections.push({ number: s.number, title: s.title, slugs: s.terms.map((t) => slugOf.get(t)!) });
    for (const term of s.terms) {
      const slug = slugOf.get(term)!;
      let raw: string;
      try {
        raw = readFileSync(join(DICT_DIR, `${term}.md`), "utf8");
      } catch {
        fail(`Curriculum.md references "${term}" but dictionary/${term}.md does not exist`);
      }
      const { description, body } = parseEntryFile(term, raw);
      const links = new Set<string>();
      const rewritten = body.replace(LINK_RE, (_, target: string) => {
        const name = decodeURIComponent(target);
        const to = slugOf.get(name);
        if (!to) fail(`dictionary/${term}.md links to "${name}", which is not an Entry`);
        if (to !== slug) links.add(to);
        return `](/entry/${to})`;
      });
      const cut = rewritten.indexOf("_Usage:_");
      entries[slug] = {
        slug,
        title: term,
        description,
        body: (cut === -1 ? rewritten : rewritten.slice(0, cut)).trim(),
        usage: cut === -1 ? "" : rewritten.slice(cut + "_Usage:_".length).trim(),
        section: s.number,
        links: [...links],
      };
    }
  }

  const content: Content = { sections: outSections, entries };
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(content));
  console.log(`content: ${Object.keys(entries).length} entries, ${outSections.length} sections`);
}

main();
