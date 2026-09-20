import { spawnSync } from "node:child_process";

const argumentsWithoutCompatibilityFlags = process.argv
  .slice(2)
  .filter((argument) => argument !== "--runInBand");

const result = spawnSync("vitest", ["run", ...argumentsWithoutCompatibilityFlags], {
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

