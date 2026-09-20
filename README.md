# Context Circuit website

The documentation website is a statically exported Next.js App Router project.
Its content is curated in this repository under `content/`; builds never inspect
the Context Circuit product or CLI working copies.

## Requirements

- Node.js 24.8.0 (see `.nvmrc`)
- pnpm 11.24.0 (pinned by `packageManager`)

Install dependencies with `pnpm install --frozen-lockfile` after the lockfile
has been generated once with the pinned pnpm version.

## Local commands

- `pnpm dev` starts the local development server.
- `pnpm lint` checks source style and Next.js conventions.
- `pnpm typecheck` runs strict TypeScript checks without emitting files.
- `pnpm test -- --runInBand` runs deterministic content fixture tests. The
  compatibility flag is accepted and intentionally ignored by the test setup.
- `pnpm content:check` validates every curated document and release reference.
- `pnpm build` validates content and produces the static site in `out/`.

Content metadata and routes are documented in [`content/README.md`](content/README.md).

