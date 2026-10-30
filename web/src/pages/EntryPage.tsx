import { Link, useParams } from "react-router";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { backlinks, content, neighbours } from "../lib/content";
import { toggleLearned, useLearned } from "../lib/learned";

const components: Components = {
  a({ href, children }) {
    if (href?.startsWith("/entry/")) return <Link to={href}>{children}</Link>;
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  },
};

function Prose({ children }: { children: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </Markdown>
  );
}

function RailList({ title, slugs }: { title: string; slugs: string[] }) {
  if (slugs.length === 0) return null;
  return (
    <div className="rail-block">
      <h3>{title}</h3>
      <ul>
        {slugs.map((s) => (
          <li key={s}>
            <Link to={`/entry/${s}`}>{content.entries[s]!.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EntryPage() {
  const { slug = "" } = useParams();
  const learned = useLearned();
  const entry = content.entries[slug];

  if (!entry) {
    return (
      <div className="container narrow">
        <h1 className="page-title">Entry not found</h1>
        <p className="lede">
          <Link to="/">Back to the curriculum</Link>
        </p>
      </div>
    );
  }

  const section = content.sections.find((s) => s.number === entry.section)!;
  const position = section.slugs.indexOf(slug) + 1;
  const { prev, next } = neighbours(slug);
  const isLearned = learned.has(slug);

  return (
    <div className="container entry-layout">
      <article className="entry">
        <p className="eyebrow">
          <Link to={`/#section-${section.number}`}>
            Section {section.number} · {section.title}
          </Link>
        </p>
        <h1>{entry.title}</h1>
        <p className="entry-desc">{entry.description}</p>
        <div className="prose">
          <Prose>{entry.body}</Prose>
        </div>
        {entry.usage && (
          <aside className="usage">
            <h2>Usage</h2>
            <Prose>{entry.usage}</Prose>
          </aside>
        )}
        <div className="entry-footer">
          <button className={isLearned ? "btn learned" : "btn"} onClick={() => toggleLearned(slug)} aria-pressed={isLearned}>
            {isLearned ? "✓ Learned" : "Mark as learned"}
          </button>
        </div>
        <nav className="pager" aria-label="Previous and next entry">
          {prev ? (
            <Link to={`/entry/${prev.slug}`} className="pager-link">
              <small>← Previous</small>
              <span>{prev.title}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/entry/${next.slug}`} className="pager-link next">
              <small>Next →</small>
              <span>{next.title}</span>
            </Link>
          ) : <span />}
        </nav>
      </article>

      <aside className="rail">
        <div className="rail-block">
          <h3>In the curriculum</h3>
          <p className="rail-text">
            Entry {position} of {section.slugs.length} in section {section.number}.
          </p>
        </div>
        <RailList title="Related" slugs={entry.links} />
        <RailList title="Referenced by" slugs={backlinks[slug] ?? []} />
      </aside>
    </div>
  );
}
