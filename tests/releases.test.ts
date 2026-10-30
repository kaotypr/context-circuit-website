import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { releaseRegistry, releasesNewestFirst, tracks } from "../src/lib/releases";

const content = path.join(process.cwd(), "content");

describe("release registry", () => {
  it.each(tracks)("names a current %s release that exists", (track) => {
    const line = releaseRegistry[track];
    expect(line.releases[line.current]).toBeDefined();
    expect(releasesNewestFirst(track)[0].version).toBe(line.current);
  });

  it.each(tracks)("has release notes for every %s release", async (track) => {
    for (const release of releasesNewestFirst(track)) {
      await expect(
        fs.access(path.join(content, "releases", track, `${release.version}.mdx`)),
        `${track} ${release.version}`,
      ).resolves.toBeUndefined();
    }
  });

  it.each(tracks)("lists every %s release in the sidebar, newest first", async (track) => {
    const meta = JSON.parse(await fs.readFile(path.join(content, "releases", track, "meta.json"), "utf8"));
    expect(meta.pages).toEqual(releasesNewestFirst(track).map((release) => release.version));
  });

  it.each(tracks)("lists every %s release in its changelog, newest first", async (track) => {
    const changelog = await fs.readFile(path.join(content, "changelog", `${track}.mdx`), "utf8");
    const linked = [...changelog.matchAll(new RegExp(`\\(/releases/${track}/([^)/]+)\\)`, "g"))].map(
      (match) => match[1],
    );
    expect([...new Set(linked)]).toEqual(releasesNewestFirst(track).map((release) => release.version));
  });
});
