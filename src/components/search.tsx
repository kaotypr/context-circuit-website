"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon, X } from "lucide-react";
import type { SearchRecord } from "@/lib/content/consumers";
import { rankSearch } from "@/lib/search";
import { resultBucket, trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Search() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("");
  const [track, setTrack] = useState("");
  const [version, setVersion] = useState("");

  async function open() {
    dialog.current?.showModal();
    queueMicrotask(() => input.current?.focus());
    if (records === null) {
      setError(false);
      try {
        const response = await fetch("/search-index.json");
        if (!response.ok) throw new Error("Search unavailable");
        setRecords((await response.json()) as SearchRecord[]);
      } catch {
        setError(true);
      }
    }
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        void open();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  });

  const results = useMemo(
    () =>
      rankSearch(records ?? [], query, {
        section: section || undefined,
        track: track || undefined,
        version: version || undefined,
      }),
    [records, query, section, track, version],
  );
  const sections = [...new Set(records?.map((record) => record.section) ?? [])].sort();
  const versions = [
    ...new Set(
      records
        ?.filter((record) => !track || record.tracks.includes(track))
        .flatMap((record) =>
          (track ? [record.versions[track]] : Object.values(record.versions)).filter(
            (value): value is string => Boolean(value),
          ),
        ) ?? [],
    ),
  ].sort();

  function reportSearch() {
    if (!query.trim()) return;
    trackEvent("docs_search", { section: section || "all", results: resultBucket(results.length) });
  }

  return (
    <>
      <Button
        className="search-trigger"
        type="button"
        variant="muted"
        onClick={() => void open()}
        aria-haspopup="dialog"
      >
        <SearchIcon aria-hidden="true" />
        Search <Kbd aria-hidden="true">⌘K</Kbd>
      </Button>
      <dialog
        className="search-dialog"
        ref={dialog}
        aria-labelledby="search-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            dialog.current?.close();
          }
        }}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        <h2 className="sr-only" id="search-title">
          Search documentation
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            reportSearch();
          }}
        >
          <div className="search-head">
            <Input
              ref={input}
              className="search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search concepts, commands, and files"
              aria-label="Search documentation"
            />
            <Button
              className="icon-button"
              type="button"
              variant="outline"
              size="icon"
              onClick={() => dialog.current?.close()}
              aria-label="Close search"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <div className="search-filters" role="group" aria-label="Search filters">
            <Select
              value={section}
              onValueChange={(nextSection) => setSection(nextSection === "all" ? "" : nextSection)}
            >
              <SelectTrigger aria-label="Filter by section">
                <SelectValue placeholder="All sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {sections.map((value) => (
                  <SelectItem value={value} key={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={track}
              onValueChange={(nextTrack) => {
                setTrack(nextTrack === "all" ? "" : nextTrack);
                setVersion("");
              }}
            >
              <SelectTrigger aria-label="Filter by product track">
                <SelectValue placeholder="All tracks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tracks</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="cli">CLI</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={version}
              onValueChange={(nextVersion) => setVersion(nextVersion === "all" ? "" : nextVersion)}
            >
              <SelectTrigger aria-label="Filter by version">
                <SelectValue placeholder="All versions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All versions</SelectItem>
                {versions.map((value) => (
                  <SelectItem value={value} key={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
        {error ? (
          <p className="search-empty" role="status">
            Search could not load.{" "}
            <Button type="button" variant="outline" onClick={() => void open()}>
              Retry
            </Button>
          </p>
        ) : records === null ? (
          <p className="search-empty" role="status">
            Loading documentation…
          </p>
        ) : !query.trim() ? (
          <p className="search-empty">
            Search a concept, command, or file. Try “worktrees” or “version pinning”.
          </p>
        ) : results.length === 0 ? (
          <p className="search-empty">No matching documentation.</p>
        ) : (
          <ol className="search-results" aria-live="polite">
            {results.slice(0, 20).map((result) => (
              <li className="search-result" key={result.route}>
                <Link
                  href={result.route}
                  onClick={() => {
                    reportSearch();
                    dialog.current?.close();
                  }}
                >
                  <small>
                    {result.section} ·{" "}
                    {result.tracks
                      .map((item) => (item === "cli" ? "CLI" : "Template") + " " + result.versions[item])
                      .join(" · ")}
                  </small>
                  <strong>{result.title}</strong>
                  <p>{result.description}</p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </dialog>
    </>
  );
}
