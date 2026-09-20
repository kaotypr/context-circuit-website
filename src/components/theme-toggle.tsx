"use client";

export const themeScript = `(()=>{try{const stored=localStorage.getItem("theme");const dark=stored?stored==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",dark)}catch{}})()`;

export function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button className="icon-button" type="button" onClick={toggle} aria-label="Toggle color theme">
      <span aria-hidden="true">◐</span>
    </button>
  );
}
