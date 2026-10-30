import { Link } from "react-router";
import { content, order } from "../lib/content";
import { useLearned } from "../lib/learned";
import { ProgressBar } from "../components/ProgressBar";

export function Home() {
  const learned = useLearned();
  const total = order.length;
  const done = order.filter((s) => learned.has(s)).length;
  const nextSlug = order.find((s) => !learned.has(s)) ?? order[0]!;
  const started = done > 0;

  return (
    <div className="container">
      <section className="hero">
        <p className="eyebrow">A vocabulary for working with AI coding agents</p>
        <h1>Learn the terms, in order.</h1>
        <p className="lede">
          {total} short entries across {content.sections.length} sections. Each one defines a term,
          shows where it goes wrong, and ends with an example conversation.
        </p>
        <div className="hero-actions">
          <Link className="btn primary" to={`/entry/${nextSlug}`}>
            {done === total ? "Review from the start" : started ? "Continue" : "Start with the first entry"}
            <span aria-hidden> →</span>
          </Link>
          <div className="hero-progress">
            <ProgressBar value={done} max={total} />
            <span>{done} of {total} learned</span>
          </div>
        </div>
      </section>

      {content.sections.map((section) => {
        const sectionDone = section.slugs.filter((s) => learned.has(s)).length;
        return (
          <section className="section" key={section.number} id={`section-${section.number}`}>
            <header className="section-head">
              <span className="section-num">{String(section.number).padStart(2, "0")}</span>
              <h2>{section.title}</h2>
              <span className="section-count">{sectionDone}/{section.slugs.length}</span>
            </header>
            <ProgressBar value={sectionDone} max={section.slugs.length} />
            <ul className="entry-grid">
              {section.slugs.map((slug) => {
                const e = content.entries[slug]!;
                return (
                  <li key={slug}>
                    <Link to={`/entry/${slug}`} className={learned.has(slug) ? "entry-card learned" : "entry-card"}>
                      <span className="entry-card-title">
                        {e.title}
                        {learned.has(slug) && <span className="tick" aria-label="Learned">✓</span>}
                      </span>
                      <span className="entry-card-desc">{e.description}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
