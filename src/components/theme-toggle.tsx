"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export const themeScript =
  '(()=>{let stored;try{stored=localStorage.getItem("theme")}catch{}const dark=stored==="dark"||(stored!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark)})()';

function subscribe(notify: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  function sync() {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("theme");
    } catch {}
    document.documentElement.classList.toggle(
      "dark",
      stored === "dark" || (stored !== "light" && media.matches),
    );
    notify();
  }
  media.addEventListener("change", sync);
  window.addEventListener("storage", sync);
  sync();
  return () => {
    observer.disconnect();
    media.removeEventListener("change", sync);
    window.removeEventListener("storage", sync);
  };
}

const snapshot = () => document.documentElement.classList.contains("dark");
const serverSnapshot = () => false;

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  function toggle() {
    const next = !snapshot();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <Button
      className="theme-toggle"
      type="button"
      variant="outline"
      onClick={toggle}
      aria-label={
        dark
          ? "Dark theme. Switch to light theme"
          : "Light theme. Switch to dark theme"
      }
    >
      <Sun className="theme-sun" aria-hidden="true" />
      <Moon className="theme-moon" aria-hidden="true" />
      <span className="theme-sun">Light</span>
      <span className="theme-moon">Dark</span>
    </Button>
  );
}
