import Link from "next/link";
import { sourceUrl, trackLabels, type Track } from "@/lib/releases";

type Versions = Partial<Record<Track, string>>;
type Source = { track: Track; repository: string; ref: string; path: string };

/** The product releases a page's claims are written against. */
export function PageBaseline({ tracks, versions }: { tracks: Track[]; versions: Versions }) {
  return (
    <p className="version-baseline" aria-label="Release baseline">
      {tracks.map((track) => (
        <Link href={`/releases/${track}/${versions[track]}`} key={track}>
          {trackLabels[track]} {versions[track]}
        </Link>
      ))}
    </p>
  );
}

/** Source evidence for a page, as plain links to the pinned release. */
export function PageSources({ sources }: { sources: Source[] }) {
  // The link opens exactly the repository and tag the source declares.
  const links = sources.map((source) => ({ ...source, href: sourceUrl(source.track, source.ref, source.path) }));
  if (links.length === 0) return null;
  return (
    <aside className="page-sources" aria-labelledby="page-sources-title">
      <p className="eyebrow" id="page-sources-title">
        Sources
      </p>
      <ul>
        {links.map((source) => (
          <li key={source.track + source.path}>
            <a href={source.href}>
              <span>
                {source.repository} · {source.ref}
              </span>
              <code>{source.path}</code>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
