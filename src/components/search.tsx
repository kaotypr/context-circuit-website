"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchRecord } from "@/lib/content/consumers";
import { rankSearch } from "@/lib/search";
import { resultBucket, trackEvent } from "@/lib/analytics";

export function Search() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("");
  const [track, setTrack] = useState("");
  const [version, setVersion] = useState("");

  async function open() {
    dialog.current?.showModal();
    queueMicrotask(() => input.current?.focus());
    if (records === null) {
      const response = await fetch("/search-index.json");
      setRecords(response.ok ? ((await response.json()) as SearchRecord[]) : []);
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
    () => rankSearch(records ?? [], query, { section: section || undefined, track: track || undefined, version: version || undefined }),
    [records, query, section, track, version],
  );
  const sections = [...new Set(records?.map((record) => record.section) ?? [])].sort();
  const versions = [...new Set(records?.flatMap((record) => Object.values(record.versions).filter(Boolean)) ?? [])].sort();

  function reportSearch() {
    if (!query.trim()) return;
    trackEvent("docs_search", { section: section || "all", results: resultBucket(results.length) });
  }

  return (
    <>
      <button className="button" type="button" onClick={() => void open()} aria-haspopup="dialog">
        Search <span aria-hidden="true">⌘K</span>
      </button>
      <dialog
        className="search-dialog"
        ref={dialog}
        aria-labelledby="search-title"
        onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}
      >
        <h2 className="sr-only" id="search-title">Search documentation</h2>
        <form onSubmit={(event) => { event.preventDefault(); reportSearch(); }}>
          <div className="search-head">
            <input ref={input} className="search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search concepts, commands, and files" aria-label="Search documentation" />
            <button className="icon-button" type="button" onClick={() => dialog.current?.close()} aria-label="Close search">×</button>
          </div>
          <div className="search-filters" aria-label="Search filters">
            <select value={section} onChange={(event) => setSection(event.target.value)} aria-label="Filter by section"><option value="">All sections</option>{sections.map((value) => <option key={value}>{value}</option>)}</select>
            <select value={track} onChange={(event) => setTrack(event.target.value)} aria-label="Filter by product track"><option value="">All tracks</option><option value="template">Template</option><option value="cli">CLI</option></select>
            <select value={version} onChange={(event) => setVersion(event.target.value)} aria-label="Filter by version"><option value="">All versions</option>{versions.map((value) => <option key={value}>{value}</option>)}</select>
          </div>
        </form>
        {query && results.length === 0 ? <p className="search-empty">No matching documentation.</p> : (
          <ol className="search-results" aria-live="polite">
            {results.slice(0, 20).map((result) => (
              <li className="search-result" key={result.route}>
                <Link href={result.route} onClick={() => { reportSearch(); dialog.current?.close(); }}>
                  <strong>{result.title}</strong><p>{result.description}</p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </dialog>
    </>
  );
}
