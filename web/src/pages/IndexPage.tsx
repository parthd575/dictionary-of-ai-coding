import { Link } from "react-router";
import { alphabetical } from "../lib/content";
import { useLearned } from "../lib/learned";

export function IndexPage() {
  const learned = useLearned();
  const groups = new Map<string, typeof alphabetical>();
  for (const e of alphabetical) {
    const letter = e.title[0]!.toUpperCase();
    groups.set(letter, [...(groups.get(letter) ?? []), e]);
  }

  return (
    <div className="container narrow">
      <h1 className="page-title">A–Z</h1>
      <p className="lede">Every entry, alphabetically.</p>
      {[...groups].map(([letter, entries]) => (
        <section key={letter} className="az-group">
          <h2 className="az-letter">{letter}</h2>
          <ul>
            {entries.map((e) => (
              <li key={e.slug}>
                <Link to={`/entry/${e.slug}`}>
                  <strong>{e.title}</strong>
                  {learned.has(e.slug) && <span className="tick" aria-label="Learned">✓</span>}
                  <span>{e.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
