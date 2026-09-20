# Content contract

Every website document is an MDX file with strict YAML frontmatter. Unknown
fields are rejected. Routes are stable and derived from the file tree:

| Content path | Route |
| --- | --- |
| `index.mdx` | `/` |
| `docs/<path>.mdx` | `/docs/<path>` |
| `versions/<track>/<major>/<path>.mdx` | `/docs/<track>/v<major>/<path>` |
| `releases/<track>/<version>.mdx` | `/releases/<track>/<version>` |
| `changelogs/<track>.mdx` | `/changelog/<track>` |

`track` is `template` or `cli`. Each selected track requires its own entry in
`versions`; use `current` only when the page should intentionally move with the
registry. A page covering both products must select both independently.

Required frontmatter fields are `title`, `description`, `section`, `order`,
`audience`, `tracks`, and `versions`. Optional fields are `draft`,
`sidebar_label`, `canonical_url`, `redirects`, `sources`, and `unlisted`.
Version-pinned sources contain `track`, `repository`, immutable `ref`, and
repository-relative `path`. They must match the selected release in
`src/lib/content/releases.ts`.

Nested pages require an index page at their navigation parent. Orders must be
unique among siblings in a section. Internal Markdown links and heading
fragments are checked. Draft and unlisted documents are validated but omitted
from the static production output.



## Source evidence and scope

Set optional `scope: source` or `scope: website` for source and website pages. Otherwise selected tracks identify the template, CLI, or both. Pages select exact versions independently. Source paths are checked against `src/lib/content/source-inventory.json`, a snapshot of verified tagged Git trees.

Use shared `DocCard`, `CardGrid`, `Callout`, and `Circuit` components in MDX. Literal component links are validated like Markdown links. Tables use GFM; code blocks receive a toolbar. Release selectors navigate to exact notes; the v2 guide states its 2.1.0 evidence baseline instead of pretending to be an archived 2.0.0 manual.

After authorized delivery, run `pnpm sources:refresh` with local template/source checkouts and `pnpm sources:verify` to refresh the website snapshot and verify remote paths. New local pages omit an unavailable remote link until that refresh.
