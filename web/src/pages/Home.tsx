import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import { content, order } from "../lib/content";
import { sectionColour } from "../lib/colour";
import { useLearned } from "../lib/learned";
import { ProgressBar } from "../components/ProgressBar";

const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(() => (reducedMotion() ? to : 0));
  useEffect(() => {
    if (reducedMotion()) {
      setN(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1000, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n}</>;
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window) || reducedMotion()) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (batch) => {
        for (const b of batch) {
          if (b.isIntersecting) {
            b.target.classList.add("in");
            io.unobserve(b.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Marquee({ slugs, reverse }: { slugs: string[]; reverse?: boolean }) {
  const items = slugs.map((s) => content.entries[s]!);
  return (
    <div className={reverse ? "marquee reverse" : "marquee"}>
      <div className="marquee-track">
        {[...items, ...items].map((e, i) => (
          <Link key={i} to={`/entry/${e.slug}`} className="pill" tabIndex={-1}>
            <i style={{ background: sectionColour(e.section) }} />
            {e.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Home() {
  const learned = useLearned();
  const navigate = useNavigate();
  useReveal();

  const total = order.length;
  const done = order.filter((s) => learned.has(s)).length;
  const nextSlug = order.find((s) => !learned.has(s)) ?? order[0]!;
  const started = done > 0;
  const connections = Object.values(content.entries).reduce(
    (n, e) => n + e.links.length,
    0
  );
  const half = Math.ceil(total / 2);

  const surprise = () => {
    const pool = order.filter((s) => !learned.has(s));
    const from = pool.length ? pool : order;
    navigate(`/entry/${from[Math.floor(Math.random() * from.length)]}`);
  };

  return (
    <>
      <div className="hero-wrap">
        <div className="hero-glow" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="container hero-container">
          <section className="hero">
            <p className="eyebrow rise" style={delay(0)}>
              A vocabulary for working with AI coding agents
            </p>
            <h1 className="rise" style={delay(80)}>
              Learn the terms, <span className="grad">in order.</span>
            </h1>
            <p className="lede rise" style={delay(160)}>
              {total} short entries across {content.sections.length} sections.
              Each one defines a term, shows where it goes wrong, and ends with
              an example conversation.
            </p>
            <div className="hero-actions rise" style={delay(240)}>
              <Link className="btn primary" to={`/entry/${nextSlug}`}>
                {done === total
                  ? "Review from the start"
                  : started
                    ? "Continue"
                    : "Start with the first entry"}
                <span aria-hidden> →</span>
              </Link>
              <button className="btn" onClick={surprise}>
                <span aria-hidden>✦</span> Surprise me
              </button>
              <div className="hero-progress">
                <ProgressBar value={done} max={total} />
                <span>
                  {done} of {total} learned
                </span>
              </div>
            </div>
            <dl className="stats rise" style={delay(320)}>
              <div>
                <dt>Entries</dt>
                <dd>
                  <CountUp to={total} />
                </dd>
              </div>
              <div>
                <dt>Sections</dt>
                <dd>
                  <CountUp to={content.sections.length} />
                </dd>
              </div>
              <div>
                <dt>Connections</dt>
                <dd>
                  <CountUp to={connections} />
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <div className="marquee-wrap rise" style={delay(400)} aria-hidden="true">
        <Marquee slugs={order.slice(0, half)} />
        <Marquee slugs={order.slice(half)} reverse />
      </div>

      <div className="container">
        {content.sections.map((section) => {
          const sectionDone = section.slugs.filter((s) =>
            learned.has(s)
          ).length;
          return (
            <section
              className="section reveal"
              key={section.number}
              id={`section-${section.number}`}
            >
              <header className="section-head">
                <span className="section-num">
                  {String(section.number).padStart(2, "0")}
                </span>
                <h2>{section.title}</h2>
                <span className="section-count">
                  {sectionDone}/{section.slugs.length}
                </span>
              </header>
              <ProgressBar value={sectionDone} max={section.slugs.length} />
              <ul className="entry-grid">
                {section.slugs.map((slug, i) => {
                  const e = content.entries[slug]!;
                  return (
                    <li
                      key={slug}
                      className="reveal"
                      style={{ "--i": Math.min(i, 8) } as CSSProperties}
                    >
                      <Link
                        to={`/entry/${slug}`}
                        className={
                          learned.has(slug)
                            ? "entry-card learned"
                            : "entry-card"
                        }
                      >
                        <span className="entry-card-title">
                          {e.title}
                          {learned.has(slug) && (
                            <span className="tick" aria-label="Learned">
                              ✓
                            </span>
                          )}
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
    </>
  );
}
