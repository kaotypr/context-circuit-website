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

