import type { Track } from "./schema";

export type Release = {
  version: string;
  major: number;
  repository: string;
  sourceBaseUrl: string;
  ref: string;
};

export type ReleaseLine = {
  current: string;
  releases: Record<string, Release>;
};

export const releaseRegistry: Record<Track, ReleaseLine> = {
  template: {
    current: "2.1.0",
    releases: {
      "2.0.0": { version: "2.0.0", major: 2, repository: "context-circuit", sourceBaseUrl: "https://github.com/kaotypr/context-circuit", ref: "v2.0.0" },
      "2.1.0": {
        version: "2.1.0",
        major: 2,
        repository: "context-circuit",
        sourceBaseUrl: "https://github.com/kaotypr/context-circuit",
        ref: "v2.1.0",
      },
    },
  },
  cli: {
    current: "2.1.0",
    releases: {
      "2.0.0": { version: "2.0.0", major: 2, repository: "context-circuit-source", sourceBaseUrl: "https://github.com/kaotypr/context-circuit-source", ref: "cli-v2.0.0" },
      "2.1.0": {
        version: "2.1.0",
        major: 2,
        repository: "context-circuit-source",
        sourceBaseUrl: "https://github.com/kaotypr/context-circuit-source",
        ref: "cli-v2.1.0",
      },
    },
  },
};

export function resolveRelease(track: Track, selector: string): Release | undefined {
  const line = releaseRegistry[track];
  return line.releases[selector === "current" ? line.current : selector];
}

export function sourceUrl(track: Track, selector: string, path: string): string | undefined {
  const release = resolveRelease(track, selector);
  if (!release) return undefined;
  return `${release.sourceBaseUrl}/blob/${release.ref}/${path}`;
}
