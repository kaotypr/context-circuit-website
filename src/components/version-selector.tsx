"use client";

import { useRouter } from "next/navigation";
import { releaseRegistry } from "@/lib/content/releases";
import type { Track } from "@/lib/content/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function VersionSelector({ track, value }: { track: Track; value: string }) {
  const router = useRouter();
  const name = track === "cli" ? "CLI" : "Template";

  return (
    <label className="release-select">
      <span>{name} release</span>
      <Select
        value={value}
        onValueChange={(nextValue) => router.push("/releases/" + track + "/" + nextValue)}
      >
        <SelectTrigger className="version-select" aria-label={name + " release"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(releaseRegistry[track].releases)
            .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
            .map((release) => (
              <SelectItem value={release.version} key={release.version}>
                {release.version}
                {release.version === releaseRegistry[track].current ? " · current" : ""}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </label>
  );
}

export function ReleasePicker({
  template = "2.1.0",
  cli = "2.1.0",
}: {
  template?: string;
  cli?: string;
}) {
  return (
    <div className="release-picker" role="group" aria-label="Independent product releases">
      <VersionSelector track="template" value={template} />
      <VersionSelector track="cli" value={cli} />
    </div>
  );
}
