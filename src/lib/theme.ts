import { promises as fs } from "node:fs";
import path from "node:path";

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
  return errors;
}
