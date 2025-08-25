import { useEffect, useState } from "react";

const STORAGE_KEY = "theme"; // "light" | "dark"

function getPreferredTheme() {
  // 1) stored choice
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  // 2) system preference
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getPreferredTheme);

  // apply to <html data-theme="...">
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // keep in sync if system theme changes (and user hasn’t picked yet)
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setTheme(mql.matches ? "dark" : "light");
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
      className="theme-toggle"
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
    </button>
  );
}
