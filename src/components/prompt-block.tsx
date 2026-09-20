"use client";

import { isValidElement, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <blockquote className="prompt-block">
      <div className="prompt-copy">
        <span>Prompt</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copy()}
          aria-label="Copy prompt"
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="prompt-text">{children}</div>
      <span className="sr-only" role="status">
        {copied ? "Prompt copied" : ""}
      </span>
    </blockquote>
  );
}
