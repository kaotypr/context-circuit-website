import { validateTheme } from "../src/lib/theme";

async function main() {
  const errors = await validateTheme(process.cwd());
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Theme contract is valid.");
  }
}

void main();
