"use client";

import { isValidElement, useState, type ReactNode } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

function promptText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(promptText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return promptText(node.props.children);
  return "";
}

export function PromptBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = promptText(children).trim();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      return;
    }
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <blockquote className="prompt-block">
      <div className="prompt-copy">
        <span>Prompt</span>
        <button
          className="button button-small"
          type="button"
          onClick={() => void copy()}
          aria-label="Copy prompt"
        >
          {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="prompt-text">{children}</div>
      <span className="sr-only" role="status">
        {copied ? "Prompt copied" : ""}
      </span>
    </blockquote>
  );
}
