"use client";

import { Children, isValidElement, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { MermaidDiagram } from "@/components/mermaid-diagram";

function codeText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(codeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return codeText(node.props.children);
  return "";
}

export function CodeBlock({ children }: { children?: ReactNode }) {
  const [status, setStatus] = useState("Copy");
  const child = Children.toArray(children)[0];
  const language = isValidElement<{ className?: string }>(child)
    ? child.props.className?.replace("language-", "") ?? "text"
    : "text";
  const source = codeText(children).trim();

  if (language === "mermaid") {
    return <MermaidDiagram chart={source} />;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setStatus("Copied");
      trackEvent("code_copy", {
        category: ["sh", "bash", "shell"].includes(language) ? "shell" : language,
      });
    } catch {
      setStatus("Copy unavailable");
    }
  }

  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span className="code-language">{language}</span>
        <Button
          className="copy-button"
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copy()}
          aria-label={"Copy " + language + " code"}
        >
          {status === "Copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {status}
        </Button>
        <span className="sr-only" role="status">
          {status === "Copy" ? "" : status}
        </span>
      </div>
      <pre tabIndex={0}>
        {children}
      </pre>
    </div>
  );
}
