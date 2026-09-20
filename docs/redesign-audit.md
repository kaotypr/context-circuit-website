# Documentation redesign audit

The redesign covers the website checkout only. Product claims were read against template `v2.0.0` and `v2.1.0`, and source `cli-v2.0.0` and `cli-v2.1.0`. No product repository was changed.

## Starting implementation

All 20 published routes were loaded in Chromium before UI changes. Each returned 200 and had no page-level horizontal overflow at the audit viewport. The route, heading, selector, and source-link inventory is in `audit-before.json`.

| Surface | Finding and disposition |
| --- | --- |
| Home and 19 content routes | Sparse overview content did not explain setup, product ownership, the full workflow, or maintainer procedures. Replaced with 69 curated pages and a product-specific home. |
| Layout, document renderer, MDX entry points | Home used the generic article layout. No reading contents rail or table plugin. Added home blocks, section navigation, GFM tables, metadata, and contents links. |
| Sidebar and active links | Flat groups mixed website internals with reader topics; current-page styling was absent. Sections now expand around the current page, with mobile close and Escape behavior. |
| Theme script and toggle | Manual colors changed initially, but label/icon were fixed; system changes and unavailable storage were not handled. Explicit html class remains the sole color mechanism, initialized before hydration. |
| Version selector | Selected value was a version while option value was a route. Replaced with two product-specific controls and actual 2.0.0/2.1.0 targets. |
| Search | Static index and weighted ranking retained. Track-specific version filtering corrected; loading, failure, empty states, metadata, and Escape behavior added. |
| Copy control | Imperative DOM injection replaced by a React code block with a separate toolbar and scrollable code area. |
| Install/tracked links and analytics | Aggregate allowlisted events retained; hosted Plausible remains production-only. |
| Route, load, schema, validation, release, consumer modules | Added source/website scope, GFM, MDX href checks, and source path validation against verified Git trees. |
| Theme, font, global and site CSS | Live canonical revision matched the recorded hash. Corrected foreground hierarchy, sidebar width, chart source values, and font fallback metrics. Components use the inherited Tailwind scale and semantic sizing. |
| Source metadata | Previously accepted declared refs without checking file existence and linked editing to main. Pinned trees/paths now match remote evidence; website links use a verified commit snapshot. |
| Configuration and scripts | Static export, lockfile, read-only CI, redirects, and Cloudflare instructions retained. Added browser and source-evidence checks. |

Every original MDX document was included in the route/content audit. Original components, library modules, scripts, and configuration were inspected. The existing `next-env.d.ts` edit is preserved.

## Canonical visual evidence

Read the live design system's LLM reference, color, font, theming, foundations, layout, sizing, density, radius, shadow, and focus references.

- Theme: Kaotypr Design System v0.1.
- Upstream CSS SHA-256: `ec08cfe106793c189ea5523947b4c863523967873885af3cb44a4df3a882c752`.
- Fonts: Fredoka for sans/headings, Schoolbell for display, Fira Code for code. Local files use canonical metric-adjusted fallback faces.
- `src/styles/kaotypr-contract.json` freezes audited declarations. `theme:check` rejects token drift, missing dark bindings, and component literals.
- Spacing and type sizes use the inherited Tailwind v4 scale. Comfortable density remains the default; 44px mobile controls are enforced.

Computed styles were compared against the live reference across the token inventory. Source OKLCH chart definitions are retained exactly; compiled CSS can serialize or gamut-map out-of-sRGB chart values differently.

## Source-link evidence

Remote GitHub trees confirmed every recorded path:

| Repository/ref | Commit | Files |
| --- | --- | --- |
| Template v2.0.0 | `d7096837a984884f7590a92e04bd9b8a0c749744` | 73 |
| Template v2.1.0 | `94d355ab5d44ccade9ae5a6c1bfdf11ee8d11606` | 73 |
| Source cli-v2.0.0 | `3abfa12e16c720823945baac5efb74d502a27f1d` | 191 |
| Source cli-v2.1.0 | `6c0e801e964c271f40a2f1c5f6dcc35a5d565e4c` | 195 |
| Website snapshot | `60af975461ed8a4ed326f19f9e02bce6d0339374` | 80 |

New MDX files cannot link to a published website revision before they are committed. Their contribution panels name the exact local path. Existing files link to the verified prior website snapshot, clearly labeled. After delivery, refresh the inventory to include the new revision. No versioned page links to main.

## Accessibility investigation

Chromium audits covered both themes on home, onboarding, concept, workflow, reference, both v2 guides, and both changelogs; plus search, mobile representatives, and mobile dark navigation.

There were no axe violations. Investigation covered all 204 nodes across 29 incomplete results:

- 181 nodes were decorative, aria-hidden disclosure chevrons or cycle arrows. They carry no information alone and supply no accessible name.
- 21 text nodes used canonical state colors serialized as OKLCH with an achromatic `none` hue, which axe could not parse.
- Two search metadata nodes were reported as overlapping. The rendered dialog was inspected: both lines were readable, unclipped, and separate from their titles. Their background was the popover surface.

Every affected selector was located in its theme and viewport. Browser canvas compositing measured actual sRGB foreground/background contrast. All 23 text nodes exceeded 4.5:1; minimum 5.54:1. Unsupported ARIA labels on generic containers and pre elements were fixed with group/region roles before the final audit. No incomplete result was silently treated as a pass.

## Reproduce

Run the checks in `deployment.md`. Start `pnpm dev --port 3100`, then run `pnpm browser:check`. Set `DOCS_URL` for a served static export. Reports and screenshots default to `/tmp/context-circuit-browser`; set `DOCS_REPORT_DIR` to preserve a separate run.

`pnpm sources:verify` uses authenticated GitHub CLI access only as a read-only maintainer check. Neither the website nor its build contacts repository APIs. `pnpm sources:refresh [template-checkout] [source-checkout]` deliberately refreshes local Git evidence; it is not a build step.

No hosting project, deployment, or DNS change was made. Native assistive technology and physical iOS/Android devices were not exercised; mobile checks use Chromium touch/viewport emulation.
