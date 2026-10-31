type Node = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: Node[] };

/**
 * Lets inline code wrap only at spaces and after a slash. Each segment between
 * those points is kept whole, so `.context-circuit/CLI_VERSION` breaks between
 * path segments and `--bin-dir` never splits at a hyphen. Code blocks inside
 * <pre> are left alone.
 */
export function rehypePathBreaks() {
  return (tree: Node) => visit(tree, false);
}

function visit(node: Node, inPre: boolean): void {
  if (!node.children) return;
  const pre = inPre || node.tagName === "pre";
  if (!pre && node.tagName === "code") {
    node.children = node.children.flatMap((child) => (child.type === "text" && child.value ? segments(child.value) : [child]));
    return;
  }
  for (const child of node.children) visit(child, pre);
}

function segments(value: string): Node[] {
  return value.split(/(\s+)/).flatMap((run): Node[] =>
    !run || /^\s+$/.test(run)
      ? [{ type: "text", value: run }]
      : run.split(/(?<=\/)/).map((part) => ({
          type: "element",
          tagName: "span",
          properties: { className: ["code-segment"] },
          children: [{ type: "text", value: part }],
        })),
  );
}
