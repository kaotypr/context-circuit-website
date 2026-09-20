import { z } from "zod";

export const tracks = ["template", "cli"] as const;
export type Track = (typeof tracks)[number];

const routePath = z
  .string()
  .regex(/^\/(?:[^?#\s]+)?$/, "must be an absolute site path without a query or fragment");

const sourceSchema = z
  .object({
    track: z.enum(tracks),
    repository: z.string().min(1),
    ref: z.string().min(1),
    path: z.string().regex(/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$)).+$/, "must be a repository-relative path"),
  })
  .strict();

export const frontmatterSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    section: z.string().min(1),
    scope: z.enum(["source", "website"]).optional(),
    order: z.number().int().nonnegative(),
    audience: z.array(z.enum(["adopter", "contributor", "maintainer"])).min(1),
    tracks: z.array(z.enum(tracks)).min(1),
    versions: z
      .object({
        template: z.string().min(1).optional(),
        cli: z.string().min(1).optional(),
      })
      .strict(),
    draft: z.boolean().default(false),
    sidebar_label: z.string().min(1).optional(),
    canonical_url: routePath.optional(),
    redirects: z.array(routePath).default([]),
    sources: z.array(sourceSchema).default([]),
    unlisted: z.boolean().default(false),
  })
  .strict()
  .superRefine((value, context) => {
    const uniqueTracks = new Set(value.tracks);
    if (uniqueTracks.size !== value.tracks.length) {
      context.addIssue({ code: "custom", path: ["tracks"], message: "must not contain duplicates" });
    }

    for (const track of tracks) {
      const selected = value.versions[track];
      if (uniqueTracks.has(track) && !selected) {
        context.addIssue({
          code: "custom",
          path: ["versions", track],
          message: `is required because tracks includes ${track}`,
        });
      }
      if (!uniqueTracks.has(track) && selected) {
        context.addIssue({
          code: "custom",
          path: ["versions", track],
          message: `is not allowed unless tracks includes ${track}`,
        });
      }
    }

    const sourceTracks = new Set(value.sources.map((source) => source.track));
    for (const sourceTrack of sourceTracks) {
      if (!uniqueTracks.has(sourceTrack)) {
        context.addIssue({
          code: "custom",
          path: ["sources"],
          message: `contains a ${sourceTrack} source but that track is not selected`,
        });
      }
    }
  });

export type Frontmatter = z.infer<typeof frontmatterSchema>;

