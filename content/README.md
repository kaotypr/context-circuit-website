# Content

Every page is an MDX file under this directory, compiled by `fumadocs-mdx`.
Routes come from the file tree:

| Content path | Route |
| --- | --- |
| `index.mdx` | `/` |
| `docs/<path>.mdx` | `/docs/<path>` |
| `docs/<track>/v<major>/<path>.mdx` | `/docs/<track>/v<major>/<path>` |
| `releases/<track>/<version>.mdx` | `/releases/<track>/<version>` |
| `changelog/<track>.mdx` | `/changelog/<track>` |

An `index.mdx` stands for its folder. `track` is `template` or `cli`.

## Frontmatter

The schema in `source.config.ts` is the Fumadocs page schema extended with the
version model. Unknown fields fail the build.

| Field | Required | Meaning |
| --- | --- | --- |
| `title` | yes | Page title and `h1` |
| `description` | no | Summary under the title and in search |
| `tracks` | yes | `template`, `cli`, or both |
| `versions` | yes | The release each selected track is written against |
| `sources` | no | Pinned source evidence, rendered in the page footer |

Each selected track needs its own entry in `versions`, and no other entry is
allowed. A page covering both products selects both independently. The header
links each selected version to its release notes.

A `sources` entry has `track`, `repository`, an immutable `ref`, and a
repository-relative `path`. Check product claims against that tag when you write
them; the build does not verify the links.

## Sidebar

Each folder's `meta.json` names its section (`title`) and orders its pages
(`pages`, by file or folder name). `docs`, `releases`, and `changelog` are root
folders (`"root": true`) and appear as sidebar tabs. A page left out of `pages`
is left out of the sidebar.

## Components

MDX can use `DocCard` and `CardGrid` (Fumadocs cards), `Callout`, `Topic` and
`TopicList`, `ReleasePicker`, `InstallLink`, and `HomeIntro`. Tables use GFM.
A `mermaid` code fence renders as a diagram. Blockquotes on the prompt cookbook
render as copyable prompts.

## Releases

`src/lib/releases.ts` lists every release of each track and its `current`
release. Add a release by adding it there, writing
`releases/<track>/<version>.mdx`, and adding it to the top of
`changelog/<track>.mdx`. `pnpm test` checks that all three agree.

Redirects for retired URLs live in `public/_redirects`; each target must be a
content page.
