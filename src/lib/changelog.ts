import { promises as fs } from "node:fs";
import path from "node:path";
import { tracks, type Track } from "@/lib/releases";

export type ChangelogEntry = {
  track: Track;
  version: string;
  title: string;
  summary: string;
  href: string;
};

const heading = /^## (\d+\.\d+\.\d+) — (.+)$/;

/**
 * Reads the per-track changelog pages, whose `## X.Y.Z — title` sections stay the
 * one place a release summary is written, and returns them as entries.
 */
export async function loadChangelog(): Promise<ChangelogEntry[]> {
  const entries: ChangelogEntry[] = [];
  for (const track of tracks) {
    const file = path.join(process.cwd(), "content", "changelog", `${track}.mdx`);
    const sections = (await fs.readFile(file, "utf8")).split(/^(?=## )/m);
    for (const section of sections) {
      const [first, ...rest] = section.split("\n");
      const match = heading.exec(first.trim());
      if (!match) continue;
      const summary = rest
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("[Read "))
        .join(" ");
      entries.push({
        track,
        version: match[1],
        title: match[2],
        summary,
        href: `/releases/${track}/${match[1]}`,
      });
    }
  }
  return entries;
}
