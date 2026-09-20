"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { Expand, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function mermaidColor(value: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return value;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  return `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const reactId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [themeRevision, setThemeRevision] = useState(0);
  const drag = useRef({ active: false, x: 0, y: 0, left: 0, top: 0 });

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeRevision((value) => value + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;

    async function render() {
      try {
        const styles = getComputedStyle(document.documentElement);
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            background: mermaidColor(styles.getPropertyValue("--background").trim()),
            primaryColor: mermaidColor(styles.getPropertyValue("--card").trim()),
            primaryTextColor: mermaidColor(styles.getPropertyValue("--foreground").trim()),
            primaryBorderColor: mermaidColor(styles.getPropertyValue("--border-strong").trim()),
            lineColor: mermaidColor(styles.getPropertyValue("--foreground-subtle").trim()),
            secondaryColor: mermaidColor(styles.getPropertyValue("--secondary").trim()),
            tertiaryColor: mermaidColor(styles.getPropertyValue("--muted").trim()),
            fontFamily: styles.getPropertyValue("--font-sans").trim(),
          },
        });
        const id = `mermaid-${reactId.replaceAll(":", "")}-${themeRevision}`;
        const result = await mermaid.render(id, chart);
        if (active) {
          setSvg(result.svg);
          setError("");
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "The diagram could not be rendered.");
        }
      }
    }

    void render();
    return () => {
      active = false;
    };
  }, [chart, reactId, themeRevision]);

  if (error) {
    return (
      <div className="mermaid-error" role="alert">
        <strong>Diagram unavailable</strong>
        <pre>{chart}</pre>
      </div>
    );
  }

  function openViewer() {
    setZoom(1);
    setOpen(true);
    dialog.current?.showModal();
  }

  function closeViewer() {
    dialog.current?.close();
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    const viewport = event.currentTarget;
    drag.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    };
    viewport.setPointerCapture(event.pointerId);
  }

  function pan(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
    event.currentTarget.scrollTop = drag.current.top - (event.clientY - drag.current.y);
  }

  function stopPan(event: PointerEvent<HTMLDivElement>) {
    drag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <>
      <figure className="mermaid-diagram" aria-label="Diagram">
        <Button
          className="diagram-expand"
          type="button"
          variant="outline"
          size="sm"
          onClick={openViewer}
          aria-label="Open diagram viewer"
        >
          <Expand aria-hidden="true" />
          View larger
        </Button>
        <div className="mermaid-inline" dangerouslySetInnerHTML={{ __html: svg }} />
      </figure>
      <dialog
        className="diagram-dialog"
        ref={dialog}
        aria-label="Diagram viewer"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeViewer();
        }}
      >
        <div className="diagram-dialog-frame">
          <div className="diagram-toolbar">
            <strong>Diagram viewer</strong>
            <div className="diagram-controls">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
                aria-label="Zoom out"
              >
                <Minus aria-hidden="true" />
              </Button>
              <output aria-live="polite">{Math.round(zoom * 100)}%</output>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
                aria-label="Zoom in"
              >
                <Plus aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setZoom(1)}
                aria-label="Reset zoom"
              >
                <RotateCcw aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={closeViewer}
                aria-label="Close diagram viewer"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div
            className="diagram-viewport"
            onPointerDown={startPan}
            onPointerMove={pan}
            onPointerUp={stopPan}
            onPointerCancel={stopPan}
          >
            {open ? (
              <div
                className="diagram-zoom"
                style={{ width: `${zoom * 100}%` }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : null}
          </div>
          <p className="diagram-help">Drag to move around. Use the controls to zoom.</p>
        </div>
      </dialog>
    </>
  );
}
