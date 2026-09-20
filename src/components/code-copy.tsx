"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

function category(element: HTMLElement): string {
  const className = element.querySelector("code")?.className ?? "";
  if (/language-(?:sh|shell|bash|zsh)/.test(className)) return "shell";
  if (className.includes("language-yaml")) return "yaml";
  if (className.includes("language-json")) return "json";
  if (/language-(?:text|txt)/.test(className)) return "text";
  return "other";
}

export function CodeCopy() {
  useEffect(() => {
    const buttons = [...document.querySelectorAll<HTMLElement>(".prose pre")].map((block) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-button";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code block");
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(block.querySelector("code")?.textContent ?? "");
          button.textContent = "Copied";
          trackEvent("code_copy", { category: category(block) });
          window.setTimeout(() => { button.textContent = "Copy"; }, 1500);
        } catch { button.textContent = "Unable to copy"; }
      });
      block.append(button);
      return button;
    });
    return () => buttons.forEach((button) => button.remove());
  }, []);
  return null;
}
