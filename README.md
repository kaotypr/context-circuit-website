# Context Circuit website

The documentation website is a statically exported Next.js App Router project.
Its content is curated in this repository under `content/`; builds never inspect
the Context Circuit product or CLI working copies.

## Requirements

- Node.js 24.8.0 (see `.nvmrc`)
- pnpm 11.24.0 (pinned by `packageManager`)

Install dependencies with `pnpm install --frozen-lockfile` after the lockfile
has been generated once with the pinned pnpm version. No database, CMS,
Context Circuit repository checkout, or runtime server is needed.

## Local commands

- `pnpm dev` starts the local development server.
- `pnpm lint` checks source style and Next.js conventions.
- `pnpm typecheck` runs strict TypeScript checks without emitting files.
- `pnpm test -- --runInBand` runs deterministic content fixture tests. The
  compatibility flag is accepted and intentionally ignored by the test setup.
- `pnpm content:check` validates every curated document and release reference.
- `pnpm build` validates content and produces the static site in `out/`.
- `pnpm static:check` checks the built artifact, redirects, headers, search data,
  representative reader journeys, source links, and analytics isolation.

Content metadata and routes are documented in [`content/README.md`](content/README.md).
Deployment preparation, preview expectations, Cloudflare Pages settings, and
rollback guidance are documented in [`docs/deployment.md`](docs/deployment.md).

Pull requests run the same frozen install, validation, tests, build, and static
artifact check in CI. The resulting `context-circuit-static-preview` artifact is
an isolated review input, not a deployment. Connecting Cloudflare Pages,
publishing a preview or production deployment, changing DNS, and configuring a
custom domain are later, explicitly authorized operations.
