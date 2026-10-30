import { chromium, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { promises as fs } from "node:fs";
import path from "node:path";
import { contentRoutes } from "../src/lib/content-routes";

const base = process.env.DOCS_URL ?? "http://localhost:3100";
const output = process.env.DOCS_REPORT_DIR ?? "/tmp/context-circuit-browser";
// Optional: point at an already installed Chromium when Playwright's pinned build is absent.
const executablePath = process.env.CHROMIUM_PATH || undefined;
const representative = ["/", "/docs/get-started/install", "/docs/concepts/plans", "/docs/workflows/execute-plans", "/docs/reference/workspace-schema", "/docs/template/v2/getting-started", "/docs/cli/v2/getting-started", "/changelog/template", "/changelog/cli"];
const failures: string[] = [];
const observations: unknown[] = [];
const incomplete: unknown[] = [];

async function colors(page: Page) {
  return page.evaluate(() => ({
    dark: document.documentElement.classList.contains("dark"),
    background: getComputedStyle(document.body).backgroundColor,
    foreground: getComputedStyle(document.body).color,
    scheme: getComputedStyle(document.documentElement).colorScheme,
    font: getComputedStyle(document.body).fontFamily,
  }));
}
async function audit(page: Page, label: string) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
  if (result.violations.length) failures.push(label + ": axe " + JSON.stringify(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))));
  if (result.incomplete.length) incomplete.push({ label, results: result.incomplete.map(v => ({ id: v.id, description: v.description, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary, html: n.html })) })) });
  observations.push({ label, violations: result.violations.length, incomplete: result.incomplete.length });
}
const themeToggle = (page: Page) => page.getByRole("button", { name: "Switch theme" }).first();

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ executablePath });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
  const page = await context.newPage();
  page.on("pageerror", error => failures.push("Page error: " + error.message));
  page.on("console", message => { if (message.type() === "error") failures.push("Console: " + message.text()); });

  const routes = await contentRoutes(path.join(process.cwd(), "content"));
  const routeSet = new Set(routes);
  const anchors = new Map<string, Set<string>>();
  const links: { from: string; route: string; hash: string }[] = [];
  for (const route of routes) {
    const response = await page.goto(base + route);
    await page.locator("h1").first().waitFor();
    await expect(page.locator("h1")).toHaveCount(1);
    if (response?.status() !== 200) failures.push(route + ": HTTP " + response?.status());
    const facts = await page.evaluate(() => ({
      title: document.querySelector("h1")?.textContent,
      overflow: document.documentElement.scrollWidth > innerWidth,
      overlay: !!document.querySelector("nextjs-error-overlay"),
      ids: [...document.querySelectorAll("[id]")].map(node => node.id),
      links: [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].map(node => ({ href: node.href, label: node.textContent?.trim() })),
    }));
    anchors.set(route, new Set(facts.ids));
    if (facts.overflow || facts.overlay || !facts.title) failures.push(route + ": " + JSON.stringify({ ...facts, ids: undefined, links: undefined }));
    for (const link of facts.links) {
      const url = new URL(link.href);
      if (url.origin === new URL(base).origin) {
        const target = url.pathname.replace(/\/$/, "") || "/";
        if (!routeSet.has(target) && !target.startsWith("/_next") && !/\.(txt|json|xml|ico|png|jpe?g|svg|webp|webmanifest|woff2?|css|js|map)$/i.test(target)) failures.push(route + ": broken internal route " + target);
        links.push({ from: route, route: target, hash: decodeURIComponent(url.hash.slice(1)) });
      } else if (/github.com\/kaotypr\/context-circuit/.test(url.href) && /\/(blob|edit)\/main\//.test(url.href)) failures.push(route + ": unpinned source " + url.href);
    }
    observations.push({ route, status: response?.status(), title: facts.title, overflow: facts.overflow });
  }
  for (const link of links) if (link.hash && !anchors.get(link.route)?.has(link.hash)) failures.push(link.from + ": missing anchor " + link.route + "#" + link.hash);
  console.log("Inspected " + routes.length + " routes and their rendered links.");

  // An explicit theme choice wins over the system preference and survives reload and navigation.
  for (const system of ["light", "dark"] as const) {
    const themed = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: system });
    const p = await themed.newPage();
    await p.goto(base + "/docs");
    const initial = await colors(p);
    expect(initial.dark).toBe(system === "dark");
    expect(initial.scheme).toBe(system);
    await themeToggle(p).click();
    await expect.poll(async () => (await colors(p)).dark).toBe(system === "light");
    const manual = await colors(p);
    expect(manual.background).not.toBe(initial.background);
    await p.reload();
    expect((await colors(p)).background).toBe(manual.background);
    await p.goto(base + "/");
    await p.locator(".hero-actions").getByRole("link", { name: /Create a workspace/ }).click();
    await expect(p).toHaveURL(/get-started\/install/);
    expect((await colors(p)).background).toBe(manual.background);
    observations.push({ system, initial, manual, reloadAndNavigation: "passed" });
    await themed.close();
  }

  // First paint without hydration: the inline theme script must still set the class.
  for (const stored of [null, "light", "dark"]) {
    const boot = await browser.newContext({ colorScheme: "dark" });
    await boot.addInitScript(value => { if (value) localStorage.setItem("theme", value); }, stored);
    await boot.route("**/_next/**/*.js", route => route.abort());
    const p = await boot.newPage();
    await p.goto(base, { waitUntil: "domcontentloaded" });
    expect((await colors(p)).dark).toBe(stored !== "light");
    observations.push({ bootstrapWithoutHydration: stored ?? "system", colors: await colors(p) });
    await boot.close();
  }

  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => localStorage.setItem("theme", value), theme);
    for (const route of representative) {
      await page.goto(base + route);
      await page.evaluate(() => document.fonts.ready);
      await audit(page, theme + " desktop " + route);
      await page.screenshot({ path: path.join(output, theme + "-" + (route.replaceAll("/", "-") || "home") + ".png"), fullPage: true });
    }
  }
  await page.evaluate(() => localStorage.setItem("theme", "light"));

  // Changelog: filters by product and version, and links to exact notes.
  await page.goto(base + "/changelog");
  const filters = page.getByRole("group", { name: "Filter releases" });
  await filters.getByRole("radio", { name: "CLI" }).click();
  await expect(page.locator(".changelog-entry .badge", { hasText: "Template" })).toHaveCount(0);
  await filters.getByLabel("Version").selectOption("2.0.0");
  await expect(page.locator(".changelog-release")).toHaveCount(1);
  await page.getByRole("link", { name: /Read CLI 2\.0\.0 notes/ }).click();
  await expect(page).toHaveURL(/releases\/cli\/2\.0\.0/);

  // Search: titles and body text, with the static index.
  await page.goto(base + "/docs");
  await page.keyboard.press("Control+k");
  const searchInput = page.getByRole("dialog").getByRole("combobox");
  await expect(searchInput).toBeFocused();
  await searchInput.fill("version pinning");
  await expect(page.getByRole("dialog").getByText("Version pinning", { exact: true }).first()).toBeVisible();
  await audit(page, "search open");
  await searchInput.fill("There is no CLI 1.x history");
  await expect(page.getByRole("dialog").getByText("Context Circuit CLI v2").first()).toBeVisible();
  await searchInput.fill("xyzdoesnotexist");
  await expect(page.getByRole("dialog").getByText(/Nothing matches that yet/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.goto(base);
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  expect(await page.locator(".skip-link").evaluate(e => getComputedStyle(e).outlineWidth)).toBe("3px");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: "light" });
  const p = await mobile.newPage();
  for (const route of representative) {
    await p.goto(base + route);
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await audit(p, "mobile " + route);
  }
  await p.goto(base + "/docs");
  await p.getByRole("button", { name: "Open sidebar" }).first().click();
  await p.getByRole("link", { name: "Prompt cookbook", exact: true }).filter({ visible: true }).first().click();
  await expect(p).toHaveURL(/docs\/prompts/);
  await p.screenshot({ path: path.join(output, "mobile.png"), fullPage: true });
  await mobile.close();
  await browser.close();

  await fs.writeFile(path.join(output, "report.json"), JSON.stringify({ base, routeCount: routes.length, observations, failures, incomplete }, null, 2));
  console.log("Browser report: " + path.join(output, "report.json"));
  console.log("Failures: " + failures.length + "; incomplete axe results requiring inspection: " + incomplete.length);
  if (failures.length) throw new Error(failures.join("\n"));
}
main().catch(async error => {
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, "failure.json"), JSON.stringify({ error: String(error), failures, incomplete, observations }, null, 2));
  console.error(error);
  process.exit(1);
});
