import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { remarkMdxMermaid } from "fumadocs-core/mdx-plugins/remark-mdx-mermaid";
import { z } from "zod";
import { isRelease, isReleaseRef, trackRepository, tracks } from "./src/lib/releases";

const sourceSchema = z
  .object({
    track: z.enum(tracks),
    repository: z.string().min(1),
    ref: z.string().min(1),
    path: z.string().min(1),
  })
  .strict();

// Fumadocs' default page schema, extended with the version model. Unknown fields
// are rejected so retired metadata cannot creep back into content files.
const docsPageSchema = pageSchema
  .extend({
    tracks: z.array(z.enum(tracks)).min(1),
    versions: z
      .object({
        template: z.string().min(1).optional(),
        cli: z.string().min(1).optional(),
      })
      .strict(),
    sources: z.array(sourceSchema).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    for (const track of tracks) {
      const selected = value.tracks.includes(track);
      if (selected && !value.versions[track]) {
        context.addIssue({
          code: "custom",
          path: ["versions", track],
          message: `is required because tracks includes ${track}`,
        });
      }
      if (!selected && value.versions[track]) {
        context.addIssue({
          code: "custom",
          path: ["versions", track],
          message: `is not allowed unless tracks includes ${track}`,
        });
      }
      // A baseline links to that release's notes, so it must name a registered release.
      const version = value.versions[track];
      if (version && !isRelease(track, version)) {
        context.addIssue({
          code: "custom",
          path: ["versions", track],
          message: `${version} is not a registered ${track} release in src/lib/releases.ts`,
        });
      }
    }
    // A source links to the repository and tag it declares, so both must be real.
    value.sources?.forEach((source, index) => {
      if (source.repository !== trackRepository(source.track).repository) {
        context.addIssue({
          code: "custom",
          path: ["sources", index, "repository"],
          message: `${source.track} sources come from ${trackRepository(source.track).repository}`,
        });
      }
      if (!isReleaseRef(source.track, source.ref)) {
        context.addIssue({
          code: "custom",
          path: ["sources", index, "ref"],
          message: `${source.ref} is not the tag of a registered ${source.track} release`,
        });
      }
    });
  });

export const docs = defineDocs({
  dir: "content",
  docs: {
    files: ["**/*.mdx"],
    schema: docsPageSchema,
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // Mermaid fences become <Mermaid chart="..." /> before Shiki sees them.
    remarkPlugins: (plugins) => [remarkMdxMermaid, ...plugins],
  },
});
