import { promises as fs } from "node:fs";
import path from "node:path";
import contract from "../styles/kaotypr-contract.json";

const requiredTokens = [
  "--background", "--foreground", "--card", "--card-foreground", "--primary",
  "--primary-foreground", "--secondary", "--secondary-foreground", "--accent",
  "--accent-foreground", "--border", "--border-subtle", "--border-strong",
  "--border-input", "--ring", "--destructive", "--destructive-border",
  "--destructive-foreground", "--info", "--info-border", "--info-foreground",
  "--success", "--success-border", "--success-foreground", "--warning",
  "--warning-border", "--warning-foreground", "--state-hover", "--state-focus",
  "--state-active", "--state-expanded", "--state-selected", "--radius-button",
  "--radius-input", "--radius-chip", "--radius-card", "--radius-popover",
  "--radius-dialog", "--radius-sheet", "--shadow-card", "--shadow-popover",
  "--shadow-overlay", "--shadow-focus", "--shadow-inset", "--ring-width",
  "--density-control-h", "--density-card-padding", "--density-field-gap",
  "--z-index-sticky", "--z-index-overlay", "--z-index-modal", "--duration-normal",
  "--chart-1", "--chart-12", "--switch-track-on", "--slider-range", "--scrollbar-thumb",
  "--skeleton-bg", "--gradient-brand", "--size-avatar-md", "--placeholder-color",
];

export async function validateTheme(root: string): Promise<string[]> {
  const theme = await fs.readFile(path.join(root, "src/styles/theme.css"), "utf8");
  const fonts = await fs.readFile(path.join(root, "src/styles/fonts.css"), "utf8");
  const componentDirectory = path.join(root, "src/components");
  const componentFiles = (await fs.readdir(componentDirectory)).filter((file) => file.endsWith(".tsx"));
  const components = (await Promise.all(componentFiles.map((file) => fs.readFile(path.join(componentDirectory, file), "utf8")))).join("\n");
  const errors = requiredTokens.filter((token) => !theme.includes(`${token}:`)).map((token) => `theme: missing ${token}`);

  const lightBlock = theme.slice(theme.indexOf(":root {"), theme.indexOf("[data-density="));
  const darkBlock = theme.slice(theme.indexOf(".dark {"), theme.indexOf("@media"));
  for (const [mode, block, expected] of [
    ["light", lightBlock, contract.light], ["dark", darkBlock, contract.dark],
  ] as const) {
    const actual = Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(match => [match[1], match[2]]));
    for (const [token, value] of Object.entries(expected)) if (actual[token] !== value) errors.push("theme: " + mode + " canonical value drift for " + token);
  }

  for (const mapping of [
    "--font-sans: var(--font-fredoka)", "--font-heading: var(--font-fredoka)",
    "--font-display: var(--font-schoolbell)", "--font-mono: var(--font-fira-code)",
  ]) if (!theme.includes(mapping)) errors.push(`theme: incorrect font mapping ${mapping}`);

  if (!theme.includes("--ring-width: 3px")) errors.push("theme: focus ring must remain 3px");
  if (!theme.includes(".dark") || !theme.includes("[data-density=\"compact\"]")) errors.push("theme: dark mode and compact density are required");
  if (!fonts.includes("Fredoka") || !fonts.includes("Fira Code") || !fonts.includes("Schoolbell")) errors.push("theme: canonical font faces are required");
  if (/\b(?:bg|text|border)-(?:red|blue|green|gray|slate|zinc|neutral)-\d+\b/.test(components)) errors.push("components: raw Tailwind palette utility found");
  if (/\bz-\[?\d+\]?\b/.test(components)) errors.push("components: numeric z-index utility found");
  if (/\brounded-\[[^\]]+\]/.test(components)) errors.push("components: arbitrary radius utility found");
  if (/\bduration-\d+\b/.test(components)) errors.push("components: hard-coded motion utility found");
  const styles = await fs.readFile(path.join(root, "src/styles/site.css"), "utf8");
  if (/(?:#[0-9a-f]{3,8}\b|(?:oklch|rgba?|hsla?)\()/.test(styles)) errors.push("styles: component color literal found");
  if (/z-index:\s*\d/.test(styles)) errors.push("styles: numeric z-index found");
  if (/border-radius:(?!\s*var\()[^;]+/.test(styles)) errors.push("styles: nonsemantic radius found");
  if (/@media[^{}]*prefers-color-scheme/.test(styles + theme)) errors.push("theme: colors must follow the explicit html class");
  if (theme.lastIndexOf("--background: oklch(1 0 0)") > theme.indexOf(".dark {")) errors.push("theme: light colors override dark");
  for (const token of ["background", "foreground", "card", "card-foreground", "primary", "primary-foreground", "secondary", "secondary-foreground", "border", "ring"]) {
    const dark = theme.slice(theme.indexOf(".dark {"), theme.indexOf("@media"));
    if (!dark.includes("--" + token + ":")) errors.push("theme: missing dark binding " + token);
  }
  return errors;
}
