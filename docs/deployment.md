# Deployment preparation

The website is a static Next.js export. A fresh checkout needs only Node.js and
pnpm; it does not read a database, CMS, runtime API, or another Context Circuit
repository. `pnpm build` writes the complete deployable artifact to `out/`.

## Local review

Use the versions pinned by `.nvmrc` and `packageManager`, then run the commands
below. The install's `postinstall` step generates the `.source/` content
collections that typechecking and the build read.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm theme:check
pnpm test -- --runInBand
NEXT_PUBLIC_DEPLOYMENT_ENV=preview pnpm build
pnpm static:check
```

Serve `out/` with any static file server when browser review is needed. Review
home, the documentation landing, a guided page, a reference page, both v2
guides, release notes, changelogs, the changelog filters, search, keyboard focus
and shortcuts, and reduced motion. Redirect and header behavior must also be checked on the eventual host;
they are represented in `public/_redirects` and `public/_headers` and copied into
the export.

CI repeats the frozen install and every check above. For pull requests it stores
`out/` as the short-lived `context-circuit-static-preview` workflow artifact.
That artifact is suitable for inspection or for a separately authorized preview
publisher. The workflow itself has read-only repository permissions and does not
connect to a hosting project or write to production.

## Cloudflare Pages settings

When publication is authorized, create or connect a Cloudflare Pages project
with these reviewable settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (Static HTML Export) |
| Production branch | `main` |
| Build command | `pnpm build` |
| Build output directory | `out` |
| Root directory | repository root |
| Node.js version | `24.8.0` |
| pnpm version | `11.24.0` |
| Preview environment | `NEXT_PUBLIC_DEPLOYMENT_ENV=preview` |
| Production environment | `NEXT_PUBLIC_DEPLOYMENT_ENV=production` |

Keep credentials, Cloudflare account and project IDs, DNS records, and custom
domain operations in the hosting provider, not in this repository. Preview
deployments must use a provider preview hostname and must never write to
`context-circuit.kaotypr.com`.

Analytics scripts and events are included only when
`NEXT_PUBLIC_DEPLOYMENT_ENV=production` is present at build time. Preview and
local builds must leave it unset or set it to `preview`; the static smoke test
fails if a preview artifact contains the production analytics script.

## Search engines

`https://context-circuit.kaotypr.com` is the only host meant for search
results. Every page names its URL there as canonical, `public/_headers` sends
`X-Robots-Tag: noindex` from the `context-circuit.pages.dev` production alias,
and Cloudflare adds `noindex` to per-deployment preview hostnames itself.

The site ships its own `robots.txt`: search engines and AI assistants may read
the docs, and the `Content-Signal` line forbids training on them. It points at
`sitemap.xml`, which the build generates from the content source, so a new page
is listed without editing a second list. Two settings live in the dashboards,
not in this repository:

1. Cloudflare's managed `robots.txt` (AI Crawl Control, "Bot Preference Sync")
   for the `kaotypr.com` zone may stay on. It prepends a block that allows
   search, forbids training, and disallows training crawlers, which agrees with
   the site's own rules; the site's rules and `Sitemap:` line follow it.
   Cloudflare's AI crawler blocking, not `robots.txt`, is what answers training
   crawlers such as GPTBot and ClaudeBot with 403, while assistants fetching a
   page for a user, such as ChatGPT-User, and search crawlers get the page.
   The setting is zone-wide, so changing it affects every `kaotypr.com` host.
2. The sitemap is submitted in Google Search Console under the `kaotypr.com`
   domain property. A new page needs no resubmission: Google rereads it.

## Publication and rollback

Publication is a later authorized action. Before publishing, require a green CI
run and review the exact `out/` artifact and Cloudflare configuration. Connect
the custom domain and DNS only as part of that separately approved operation.

Cloudflare Pages retains deployment history. If a production deployment fails
acceptance, roll back by promoting the last known-good successful production
deployment in Cloudflare, leaving its artifact available until the replacement
has passed review. A failed build or deployment must not replace that known-good
deployment. Record the failed deployment, rollback target, and follow-up issue
outside this repository according to the project's operational process.


## Browser acceptance

Serve `out/` on port 3100 (or run `pnpm dev --port 3100`) and run
`pnpm browser:check` for route, link, theme, changelog filters, search, mobile,
focus, and axe checks. Install Chromium with `pnpm exec playwright install
chromium`, or set `CHROMIUM_PATH` to an installed Chromium or headless shell. Set
`DOCS_URL` to test another served artifact and `DOCS_REPORT_DIR` to choose its
evidence directory. Every incomplete accessibility result needs investigation;
the script reports these separately from violations.
