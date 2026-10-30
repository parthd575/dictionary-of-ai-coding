import { useState } from "react";
import { useNavigate } from "react-router";
import { content, order } from "../lib/content";

const SIZE = 900;
const C = SIZE / 2;
const R = 300;

const hue = (section: number) => 250 + (section - 1) * 48;
const colour = (section: number) => `oklch(0.64 0.15 ${hue(section)})`;

export function MapPage() {
  const navigate = useNavigate();
  const [hover, setHover] = useState<string | null>(null);

  const pos = new Map(
    order.map((slug, i) => {
      const a = (i / order.length) * Math.PI * 2 - Math.PI / 2;
      return [slug, { a, x: C + R * Math.cos(a), y: C + R * Math.sin(a) }] as const;
    }),
  );

  const edges = order.flatMap((from) =>
    content.entries[from]!.links.map((to) => ({ from, to })),
  );
  const connected = (slug: string) =>
    hover === slug ||
    (hover !== null &&
      (content.entries[hover]!.links.includes(slug) || content.entries[slug]!.links.includes(hover)));

  return (
    <div className="container">
      <h1 className="page-title">Map</h1>
      <p className="lede">
        Each dot is an entry, placed in curriculum order. A line means one entry links to the other.
        Hover a dot to see its neighbours; select it to open the entry.
      </p>
      <div className="map-wrap">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="map" role="img" aria-label="Link map of entries">
          {edges.map(({ from, to }) => {
            const a = pos.get(from)!;
            const b = pos.get(to)!;
            const on = hover !== null && (from === hover || to === hover);
            return (
              <path
                key={`${from}>${to}`}
                d={`M${a.x},${a.y} Q${C},${C} ${b.x},${b.y}`}
                className={on ? "edge on" : hover ? "edge dim" : "edge"}
                style={on ? { stroke: colour(content.entries[hover!]!.section) } : undefined}
              />
            );
          })}
          {order.map((slug) => {
            const e = content.entries[slug]!;
            const p = pos.get(slug)!;
            const deg = (p.a * 180) / Math.PI;
            const flip = deg > 90 || deg < -90;
            const lx = C + (R + 14) * Math.cos(p.a);
            const ly = C + (R + 14) * Math.sin(p.a);
            const lit = hover === null || connected(slug);
            return (
              <g
                key={slug}
                className={lit ? "node" : "node dim"}
                onMouseEnter={() => setHover(slug)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(slug)}
                onBlur={() => setHover(null)}
                onClick={() => navigate(`/entry/${slug}`)}
                onKeyDown={(ev) => ev.key === "Enter" && navigate(`/entry/${slug}`)}
                tabIndex={0}
                role="link"
                aria-label={e.title}
              >
                <circle cx={p.x} cy={p.y} r={hover === slug ? 8 : 5.5} fill={colour(e.section)} />
                <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
                <text
                  x={lx}
                  y={ly}
                  transform={`rotate(${flip ? deg + 180 : deg} ${lx} ${ly})`}
                  textAnchor={flip ? "end" : "start"}
                  dominantBaseline="middle"
                  className={hover === slug ? "node-label strong" : "node-label"}
                >
                  {e.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ul className="legend">
        {content.sections.map((s) => (
          <li key={s.number}>
            <i style={{ background: colour(s.number) }} />
            {s.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
