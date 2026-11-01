import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { pageUrl } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = false;

/** Every content page on the custom domain. No lastModified: content files carry no reliable date. */
export default function sitemap(): MetadataRoute.Sitemap {
  return source
    .getPages()
    .map((page) => ({ url: pageUrl(page.url) }))
    .sort((a, b) => a.url.localeCompare(b.url));
}
