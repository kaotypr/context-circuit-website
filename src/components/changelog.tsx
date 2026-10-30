import { loadChangelog } from "@/lib/changelog";
import type { Track } from "@/lib/releases";
import { ChangelogTimeline } from "@/components/changelog-timeline";

/** The release timeline, optionally fixed to one product. */
export async function Changelog({ track }: { track?: Track }) {
  const entries = await loadChangelog();
  return <ChangelogTimeline entries={entries} fixedTrack={track} />;
}
