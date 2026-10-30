"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CaretDownIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "fumadocs-ui/components/ui/collapsible";
import { releaseRegistry, releasesNewestFirst, trackLabels, type Track } from "@/lib/releases";

/** The release a pathname names for a track, if it is that track's release page. */
function releaseFromPath(track: Track, pathname: string): string | undefined {
  const match = new RegExp(`^/releases/${track}/([^/]+)/?$`).exec(pathname);
  return match && releaseRegistry[track].releases[match[1]] ? match[1] : undefined;
}

export function VersionSelector({ track, value }: { track: Track; value?: string }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const selected = releaseFromPath(track, pathname) ?? value ?? releaseRegistry[track].current;
  const name = trackLabels[track];
  const listId = `release-list-${track}`;

  return (
    <Collapsible className="release-select" open={open} onOpenChange={setOpen} data-track={track}>
      <CollapsibleTrigger className="release-trigger" aria-label={name + " release"} aria-controls={listId}>
        <span className="release-trigger-label">{name}</span>
        <span className="release-trigger-value">{selected}</span>
        <CaretDownIcon aria-hidden="true" className="release-caret" />
      </CollapsibleTrigger>
      <CollapsibleContent forceMount id={listId} className="release-options">
        <ul aria-label={name + " releases"}>
          {releasesNewestFirst(track).map((release) => {
            const active = release.version === selected;
            return (
              <li key={release.version}>
                <Link
                  className="release-option"
                  href={`/releases/${track}/${release.version}`}
                  aria-current={active ? "page" : undefined}
                  data-release={release.version}
                  onClick={() => setOpen(false)}
                >
                  <span>{release.version}</span>
                  {release.version === releaseRegistry[track].current ? (
                    <span className="release-current">current</span>
                  ) : null}
                  {active ? <CheckCircleIcon aria-hidden="true" weight="fill" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ReleasePicker({ template, cli }: { template?: string; cli?: string }) {
  return (
    <div className="release-picker" role="group" aria-label="Independent product releases">
      <VersionSelector track="template" value={template} />
      <VersionSelector track="cli" value={cli} />
    </div>
  );
}
