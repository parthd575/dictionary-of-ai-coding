import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { search } from "../lib/search";
import { content } from "../lib/content";

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => search(query), [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const go = (slug: string) => {
    onClose();
    navigate(`/entry/${slug}`);
  };

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-label="Search entries"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={input}
          value={query}
          placeholder={`Search ${Object.keys(content.entries).length} entries…`}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) go(results[active].slug);
          }}
        />
        {query.trim() && (
          <ul className="palette-results">
            {results.length === 0 && <li className="palette-empty">No entries match “{query}”.</li>}
            {results.map((r, i) => (
              <li key={r.slug}>
                <button
                  className={i === active ? "active" : ""}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.slug)}
                >
                  <strong>{r.title}</strong>
                  <span>{r.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
