import inventory from "./source-inventory.json";

const websiteEntry = Object.entries(inventory).find(([key]) => key.startsWith("context-circuit-website@"));
export const websiteRevision = websiteEntry?.[1].commit;
export function websiteSource(file: string): string | undefined {
  return websiteEntry?.[1].paths.includes("content/" + file)
    ? "https://github.com/kaotypr/context-circuit-website/blob/" + websiteRevision + "/content/" + file
    : undefined;
}
