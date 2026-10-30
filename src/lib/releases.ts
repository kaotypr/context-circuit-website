export const tracks = ["template", "cli"] as const;
export type Track = (typeof tracks)[number];

export const trackLabels: Record<Track, string> = { template: "Template", cli: "CLI" };

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
    current: "2.5.0",
    releases: {
      "2.0.0": { version: "2.0.0", major: 2, repository: "context-circuit", sourceBaseUrl: "https://github.com/kaotypr/context-circuit", ref: "v2.0.0" },
      "2.1.0": {
        version: "2.1.0",
        major: 2,
        repository: "context-circuit",
        sourceBaseUrl: "https://github.com/kaotypr/context-circuit",
        ref: "v2.1.0",
      },
      "2.2.0": { version: "2.2.0", major: 2, repository: "context-circuit", sourceBaseUrl: "https://github.com/kaotypr/context-circuit", ref: "v2.2.0" },
      "2.3.0": { version: "2.3.0", major: 2, repository: "context-circuit", sourceBaseUrl: "https://github.com/kaotypr/context-circuit", ref: "v2.3.0" },
      "2.4.0": { version: "2.4.0", major: 2, repository: "context-circuit", sourceBaseUrl: "https://github.com/kaotypr/context-circuit", ref: "v2.4.0" },
      "2.4.1": { version: "2.4.1", major: 2, repository: "context-circuit", sourceBaseUrl: "https://github.com/kaotypr/context-circuit", ref: "v2.4.1" },
      "2.5.0": { version: "2.5.0", major: 2, repository: "context-circuit", sourceBaseUrl: "https://github.com/kaotypr/context-circuit", ref: "v2.5.0" },
    },
  },
  cli: {
    current: "2.5.0",
    releases: {
      "2.0.0": { version: "2.0.0", major: 2, repository: "context-circuit-source", sourceBaseUrl: "https://github.com/kaotypr/context-circuit-source", ref: "cli-v2.0.0" },
      "2.1.0": {
        version: "2.1.0",
        major: 2,
        repository: "context-circuit-source",
        sourceBaseUrl: "https://github.com/kaotypr/context-circuit-source",
        ref: "cli-v2.1.0",
      },
      "2.2.0": { version: "2.2.0", major: 2, repository: "context-circuit-source", sourceBaseUrl: "https://github.com/kaotypr/context-circuit-source", ref: "cli-v2.2.0" },
      "2.3.0": { version: "2.3.0", major: 2, repository: "context-circuit-source", sourceBaseUrl: "https://github.com/kaotypr/context-circuit-source", ref: "cli-v2.3.0" },
      "2.4.0": { version: "2.4.0", major: 2, repository: "context-circuit-source", sourceBaseUrl: "https://github.com/kaotypr/context-circuit-source", ref: "cli-v2.4.0" },
      "2.4.1": { version: "2.4.1", major: 2, repository: "context-circuit-source", sourceBaseUrl: "https://github.com/kaotypr/context-circuit-source", ref: "cli-v2.4.1" },
      "2.5.0": { version: "2.5.0", major: 2, repository: "context-circuit-source", sourceBaseUrl: "https://github.com/kaotypr/context-circuit-source", ref: "cli-v2.5.0" },
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

/** Every release of a track, newest first. */
export function releasesNewestFirst(track: Track): Release[] {
  return Object.values(releaseRegistry[track].releases).sort((left, right) =>
    right.version.localeCompare(left.version, undefined, { numeric: true }),
  );
}
