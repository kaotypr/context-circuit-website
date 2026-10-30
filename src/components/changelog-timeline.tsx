"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import type { ChangelogEntry } from "@/lib/changelog";
import { releaseRegistry, trackLabels, tracks, type Track } from "@/lib/releases";

type TrackFilter = Track | "all";

function compareVersions(a: string, b: string) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return pb[i] - pa[i];
  return 0;
}

/** Renders `code` spans in a plain-text summary. */
function Summary({ text }: { text: string }) {
  return (
    <p className="changelog-summary">
      {text.split(/(`[^`]+`)/).map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? <code key={index}>{part.slice(1, -1)}</code> : part,
      )}
    </p>
  );
}

export function ChangelogTimeline({ entries, fixedTrack }: { entries: ChangelogEntry[]; fixedTrack?: Track }) {
  const [track, setTrack] = useState<TrackFilter>(fixedTrack ?? "all");
  const [version, setVersion] = useState("all");

  const versions = useMemo(
    () => [...new Set(entries.filter((e) => track === "all" || e.track === track).map((e) => e.version))].sort(compareVersions),
    [entries, track],
  );

  const groups = useMemo(() => {
    const visible = entries.filter(
      (e) => (track === "all" || e.track === track) && (version === "all" || e.version === version),
    );
    return [...new Set(visible.map((e) => e.version))]
      .sort(compareVersions)
      .map((v) => ({ version: v, entries: tracks.flatMap((t) => visible.filter((e) => e.version === v && e.track === t)) }));
  }, [entries, track, version]);

  return (
    <div className="changelog not-prose">
      <div className="changelog-filters" role="group" aria-label="Filter releases">
        {fixedTrack ? null : (
          <div className="segmented" role="radiogroup" aria-label="Product">
            {(["all", ...tracks] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={track === option}
                className="segmented-option"
                onClick={() => {
                  setTrack(option);
                  setVersion("all");
                }}
              >
                {option === "all" ? "All products" : trackLabels[option]}
              </button>
            ))}
          </div>
        )}
        <label className="changelog-version">
          <span>Version</span>
          <select value={version} onChange={(event) => setVersion(event.target.value)}>
            <option value="all">All versions</option>
            {versions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ol className="changelog-list">
        {groups.map((group) => (
          <li key={group.version} className="changelog-release" id={`v${group.version}`}>
            <div className="changelog-version-label">
              <span className="changelog-version-number">{group.version}</span>
              {tracks.some((t) => releaseRegistry[t].current === group.version) ? (
                <span className="badge">Current</span>
              ) : null}
            </div>
            <div className="changelog-entries">
              {group.entries.map((entry) => (
                <article key={entry.track} className="changelog-entry">
                  <span className="badge">{trackLabels[entry.track]}</span>
                  <h3>{entry.title.charAt(0).toUpperCase() + entry.title.slice(1)}</h3>
                  <Summary text={entry.summary} />
                  <Link href={entry.href} className="changelog-link">
                    Read {trackLabels[entry.track]} {entry.version} notes
                    <ArrowRightIcon aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
