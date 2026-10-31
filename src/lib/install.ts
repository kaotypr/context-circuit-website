import { releaseRegistry } from "./releases";

/** The workspace creation command from /docs/get-started/install, on one line, for the current template. */
export function templateInitCommand(): string {
  return [
    "npx tembiter init",
    "--template https://github.com/kaotypr/context-circuit.git",
    `--tag v${releaseRegistry.template.current}`,
    "--target acme-workspace",
  ].join(" ");
}
