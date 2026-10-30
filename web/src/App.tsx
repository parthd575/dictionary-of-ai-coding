import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router";
import { Home } from "./pages/Home";
import { EntryPage } from "./pages/EntryPage";
import { IndexPage } from "./pages/IndexPage";
import { MapPage } from "./pages/MapPage";
import { SearchPalette } from "./components/SearchPalette";
import { useTheme } from "./lib/theme";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea/i.test((e.target as HTMLElement).tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <ScrollToTop />
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden>A</span>
            <span className="brand-name">Dictionary of AI Coding</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            <NavLink to="/" end>Curriculum</NavLink>
            <NavLink to="/a-z">A–Z</NavLink>
            <NavLink to="/map">Map</NavLink>
          </nav>
          <div className="topbar-actions">
            <button className="search-btn" onClick={() => setSearchOpen(true)}>
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title="Toggle theme"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/entry/:slug" element={<EntryPage />} />
          <Route path="/a-z" element={<IndexPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
