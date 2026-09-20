import { execFileSync } from "node:child_process";
import inventory from "../src/lib/content/source-inventory.json";

// Read-only maintainer check using GitHub CLI authentication; no website runtime API.
for (const [key, snapshot] of Object.entries(inventory)) {
  const [repository, ref] = key.split("@");
  const response = JSON.parse(execFileSync("gh", ["api", "repos/kaotypr/" + repository + "/git/trees/" + ref + "?recursive=1"], { encoding: "utf8" })) as { sha: string; truncated?: boolean; tree: { path: string; type: string }[] };
  if (response.truncated || response.sha !== snapshot.commit) throw new Error(key + ": remote revision mismatch or incomplete tree");
  const remote = response.tree.filter(entry => entry.type === "blob").map(entry => entry.path).sort();
  if (JSON.stringify(remote) !== JSON.stringify([...snapshot.paths].sort())) throw new Error(key + ": remote path inventory mismatch");
  console.log(key + ": verified " + remote.length + " remote paths at " + response.sha);
}
