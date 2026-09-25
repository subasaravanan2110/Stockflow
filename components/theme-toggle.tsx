"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
    localStorage.setItem("stockflow-theme", nextTheme);
  }

  return <button type="button" onClick={toggleTheme} className="theme-toggle grid size-10 place-items-center rounded-xl border bg-white" aria-label="Toggle light or dark mode" title="Toggle light or dark mode"><Sun className="theme-light-icon size-4" /><Moon className="theme-dark-icon size-4" /></button>;
}
