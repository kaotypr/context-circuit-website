import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

// Deliberate maintenance operation; never run by the site or its build.
async function main() {
  const locations = {
    "context-circuit": process.argv[2] ?? "../context-circuit",
    "context-circuit-source": process.argv[3] ?? "../context-circuit-source",
    "context-circuit-website": ".",
  };
  const refs = {
    "context-circuit": ["v2.0.0", "v2.1.0"],
    "context-circuit-source": ["cli-v2.0.0", "cli-v2.1.0"],
    "context-circuit-website": ["HEAD"],
  };
  const inventory: Record<string, { commit: string; paths: string[] }> = {};
  for (const [repository, directory] of Object.entries(locations)) {
    for (const ref of refs[repository as keyof typeof refs]) {
      const git = (...args: string[]) => execFileSync("git", ["-C", path.resolve(directory), ...args], { encoding: "utf8" }).trim();
      const commit = git("rev-parse", ref + "^{commit}");
      const paths = git("ls-tree", "-r", "--name-only", ref).split("\n");
      inventory[repository + "@" + (ref === "HEAD" ? commit : ref)] = { commit, paths };
    }
  }
  await fs.writeFile("src/lib/content/source-inventory.json", JSON.stringify(inventory, null, 2) + "\n");
  console.log("Refreshed verified local Git trees. Run sources:verify before accepting new release evidence.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
