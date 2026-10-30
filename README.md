# Context Circuit website

The documentation website is a statically exported Next.js App Router project
built on [Fumadocs](https://fumadocs.dev). Its content is curated in this
repository under `content/`; builds never inspect the Context Circuit product or
CLI working copies.

## Requirements

- Node.js 24.8.0 (see `.nvmrc`)
- pnpm 11.24.0 (pinned by `packageManager`)

Install dependencies with `pnpm install --frozen-lockfile`. The `postinstall`
step runs `fumadocs-mdx`, which generates the content collections in `.source/`
that typechecking and the build read. No database, CMS, Context Circuit
repository checkout, or runtime server is needed.

## Local commands

- `pnpm dev` starts the local development server.
- `pnpm lint` checks source style and Next.js conventions.
- `pnpm typecheck` runs strict TypeScript checks without emitting files.
- `pnpm theme:check` checks the kaotypr design tokens and the Fumadocs color
  bindings.
- `pnpm test -- --runInBand` runs the release registry, delivery, and theme
  tests. The compatibility flag is accepted and intentionally ignored.
- `pnpm build` validates the theme, compiles every MDX page against its
  frontmatter schema, and produces the static site in `out/`.
- `pnpm static:check` checks the built artifact: every content route, release
  notes, changelogs, redirect targets, headers, the changelog filters, static
  search, and analytics isolation.
- `pnpm browser:check` drives a served build in Chromium (see
  [`docs/deployment.md`](docs/deployment.md)).

## Layout

- `content/` holds the pages and `meta.json` sidebar files; see
  [`content/README.md`](content/README.md).
- `source.config.ts` defines the content collection and page schema.
- `src/lib/source.ts` loads it; `src/lib/releases.ts` is the release registry.
- `src/app/(docs)` renders documentation pages in the Fumadocs docs layout,
  `src/app/(home)` renders the home page, and `src/app/search-index.json`
  exports the static search index.
- `src/app/global.css` binds Fumadocs UI to the kaotypr tokens in
  `src/styles/theme.css`.

Deployment preparation, preview expectations, Cloudflare Pages settings, and
rollback guidance are documented in [`docs/deployment.md`](docs/deployment.md).

Pull requests run the same frozen install, checks, tests, build, and static
artifact check in CI. The resulting `context-circuit-static-preview` artifact is
an isolated review input, not a deployment. Connecting Cloudflare Pages,
publishing a preview or production deployment, changing DNS, and configuring a
custom domain are later, explicitly authorized operations.
