import { chromium, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { promises as fs } from "node:fs";
import path from "node:path";

const base = process.env.DOCS_URL ?? "http://localhost:3100";
const output = process.env.DOCS_REPORT_DIR ?? "/tmp/context-circuit-browser";
const representative = ["/", "/docs/get-started/install", "/docs/concepts/plans", "/docs/workflows/execute-plans", "/docs/reference/workspace-schema", "/docs/template/v2/getting-started", "/docs/cli/v2/getting-started", "/changelog/template", "/changelog/cli"];
const failures: string[] = [];
const observations: unknown[] = [];
const incomplete: unknown[] = [];

async function colors(page: Page) {
  return page.evaluate(() => ({
    dark: document.documentElement.classList.contains("dark"),
    background: getComputedStyle(document.body).backgroundColor,
    foreground: getComputedStyle(document.body).color,
    card: getComputedStyle(document.documentElement).getPropertyValue("--card").trim(),
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
async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
  const page = await context.newPage();
  page.on("pageerror", error => failures.push("Page error: " + error.message));
  page.on("console", message => { if (message.type() === "error") failures.push("Console: " + message.text()); });
  const records = await (await page.request.get(base + "/search-index.json")).json() as { route: string }[];
  const routeSet = new Set(records.map(record => record.route));
  const anchors = new Map<string, Set<string>>();
  const links: { from: string; route: string; hash: string }[] = [];
  for (const { route } of records) {
    const response = await page.goto(base + route);
    await page.locator("h1").waitFor();
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
    if (facts.overflow || facts.overlay || !facts.title) failures.push(route + ": " + JSON.stringify(facts));
    for (const link of facts.links) {
      const url = new URL(link.href);
      if (url.origin === new URL(base).origin) {
        const target = url.pathname.replace(/\/$/, "") || "/";
        if (!routeSet.has(target)) failures.push(route + ": broken internal route " + target);
        links.push({ from: route, route: target, hash: decodeURIComponent(url.hash.slice(1)) });
      } else if (/github.com\/kaotypr\/context-circuit/.test(url.href) && /\/(blob|edit)\/main\//.test(url.href)) failures.push(route + ": unpinned source " + url.href);
    }
    observations.push({ route, status: response?.status(), title: facts.title, overflow: facts.overflow });
  }
  for (const link of links) if (link.hash && !anchors.get(link.route)?.has(link.hash)) failures.push(link.from + ": missing anchor " + link.route + "#" + link.hash);
  console.log("Inspected " + records.length + " routes and their rendered links.");

  // Explicit preference wins over either system preference, survives reload and client navigation.
  for (const system of ["light", "dark"] as const) {
    const themed = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: system });
    const p = await themed.newPage();
    await p.goto(base);
    await expect(p.getByRole("button", { name: new RegExp(system + " theme", "i") })).toBeVisible();
    const initial = await colors(p);
    expect(initial.dark).toBe(system === "dark");
    expect(initial.scheme).toBe(system);
    const chosen = system === "light" ? "dark" : "light";
    await p.getByRole("button", { name: /switch to .* theme/i }).click();
    await expect(p.getByRole("button", { name: new RegExp(chosen + " theme", "i") })).toBeVisible();
    const manual = await colors(p);
    expect(manual.background).not.toBe(initial.background);
    expect(manual.foreground).not.toBe(initial.foreground);
    expect(manual.dark).toBe(chosen === "dark");
    await p.reload();
    await expect(p.getByRole("button", { name: new RegExp(chosen + " theme", "i") })).toBeVisible();
    expect((await colors(p)).background).toBe(manual.background);
    await p.locator(".hero-actions").getByRole("link", { name: /Create a workspace/ }).click();
    await expect(p).toHaveURL(/get-started\/install/);
    expect((await colors(p)).background).toBe(manual.background);
    await p.emulateMedia({ colorScheme: system });
    expect((await colors(p)).dark).toBe(chosen === "dark");
    observations.push({ system, initial, manual, reloadAndNavigation: "passed" });
    await themed.close();
  }

  // First paint without hydration: block external scripts; the inline bootstrap must still set colors.
  for (const stored of [null, "light", "dark", "invalid"]) {
    const boot = await browser.newContext({ colorScheme: "dark" });
    await boot.addInitScript(value => { if (value) localStorage.setItem("theme", value); }, stored);
    await boot.route("**/*.js*", route => route.abort());
    const p = await boot.newPage();
    await p.goto(base, { waitUntil: "domcontentloaded" });
    expect((await colors(p)).dark).toBe(stored !== "light");
    observations.push({ bootstrapWithoutHydration: stored ?? "system", colors: await colors(p) });
    await boot.close();
  }
  const denied = await browser.newContext({ colorScheme: "dark" });
  await denied.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Denied", "SecurityError"); } }));
  const deniedPage = await denied.newPage();
  await deniedPage.goto(base);
  await expect(deniedPage.getByRole("button", { name: /Dark theme/ })).toBeVisible();
  await deniedPage.getByRole("button", { name: /Dark theme/ }).click();
  await expect(deniedPage.getByRole("button", { name: /Light theme/ })).toBeVisible();
  await denied.close();

  const auto = await browser.newContext({ colorScheme: "light" });
  const autoPage = await auto.newPage();
  await autoPage.goto(base);
  await expect(autoPage.getByRole("button", { name: /Light theme/ })).toBeVisible();
  await autoPage.emulateMedia({ colorScheme: "dark" });
  await expect(autoPage.getByRole("button", { name: /Dark theme/ })).toBeVisible();
  await auto.close();

  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => localStorage.setItem("theme", value), theme);
    for (const route of representative) {
      await page.goto(base + route);
      await page.evaluate(() => document.fonts.ready);
      await audit(page, theme + " desktop " + route);
      await page.screenshot({ path: path.join(output, theme + "-" + (route.replaceAll("/", "-") || "home") + ".png"), fullPage: true });
    }
  }

  await page.goto(base + "/docs/releases");
  await page.getByLabel("Independent product releases").first().getByLabel("Template release", { exact: true }).click();
  await page.getByRole("option", { name: "2.0.0" }).click();
  await expect(page).toHaveURL(/releases\/template\/2.0.0/);
  await expect(page.getByLabel("Template release", { exact: true })).toContainText("2.0.0");
  await expect(page.getByLabel("CLI release", { exact: true })).toContainText("2.1.0");
  await page.getByLabel("CLI release", { exact: true }).click();
  await page.getByRole("option", { name: "2.0.0" }).click();
  await expect(page).toHaveURL(/releases\/cli\/2.0.0/);

  await page.getByRole("button", { name: /^Search/ }).click();
  await page.getByRole("searchbox").fill("version pinning");
  await expect(page.locator(".search-result strong").first()).toHaveText("Version pinning");
  await page.getByLabel("Filter by product track").click();
  await page.getByRole("option", { name: "CLI", exact: true }).click();
  await page.getByLabel("Filter by version").click();
  await page.getByRole("option", { name: "2.1.0" }).click();
  await page.getByLabel("Filter by section").click();
  await page.getByRole("option", { name: "CLI", exact: true }).click();
  await expect(page.locator(".search-result strong").first()).toHaveText("Version pinning");
  await audit(page, "search open");
  await page.getByRole("searchbox").fill("xyzdoesnotexist");
  await expect(page.getByText("No matching documentation.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".search-dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: /^Search/ })).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("searchbox")).toBeFocused();
  await page.keyboard.press("Escape");
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
  await p.goto(base);
  await p.getByRole("button", { name: /Light theme/ }).click();
  await expect(p.getByRole("button", { name: /Dark theme/ })).toBeVisible();
  const mobileDark = await colors(p);
  await p.reload();
  await expect(p.getByRole("button", { name: /Dark theme/ })).toBeVisible();
  expect((await colors(p)).background).toBe(mobileDark.background);
  await p.locator(".mobile-nav > summary").click();
  await p.getByRole("navigation", { name: "Mobile documentation navigation" }).getByRole("link", { name: "Install the CLI", exact: true }).click();
  await expect(p).toHaveURL(/get-started\/install-cli/);
  await expect(p.locator(".mobile-nav")).not.toHaveAttribute("open");
  expect((await colors(p)).background).toBe(mobileDark.background);
  await audit(p, "mobile dark after navigation");
  await p.screenshot({ path: path.join(output, "mobile-dark.png"), fullPage: true });
  await p.getByRole("button", { name: /Dark theme/ }).click();
  await expect(p.getByRole("button", { name: /Light theme/ })).toBeVisible();
  await mobile.close();
  await browser.close();

  await fs.writeFile(path.join(output, "report.json"), JSON.stringify({ base, routeCount: records.length, observations, failures, incomplete }, null, 2));
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
