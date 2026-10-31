"use client";

import { useRef, useState } from "react";
import { CheckIcon, CopyIcon, TerminalIcon } from "@phosphor-icons/react";
import { trackEvent } from "@/lib/analytics";

/** A one-line shell command with a copy button, as on ui.kaotypr.com. */
export function CopyCommand({ command }: { command: string }) {
  const text = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    trackEvent("install_cta", { destination: "template" });
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Without clipboard access, select the command so it can be copied by hand.
      const range = document.createRange();
      if (text.current) range.selectNodeContents(text.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  }

  return (
    <div className="command-box">
      <TerminalIcon className="command-glyph" aria-hidden="true" />
      {/* Focusable so a keyboard can scroll a command wider than the box. */}
      <code ref={text} className="command-text" tabIndex={0}>
        {command}
      </code>
      <button type="button" className="command-copy" onClick={copy} aria-label="Copy command">
        {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
