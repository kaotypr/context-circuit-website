/** The one indexed host. Previews and the pages.dev alias point their canonical links here. */
export const siteUrl = "https://context-circuit.kaotypr.com";

/** The absolute URL of a page route, with the trailing slash the static export uses. */
export function pageUrl(route: string): string {
  return `${siteUrl}${route === "/" ? "/" : `${route.replace(/\/$/, "")}/`}`;
}
