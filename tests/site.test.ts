import { describe, expect, it } from "vitest";
import { pageUrl, siteUrl } from "../src/lib/site";

describe("page URLs", () => {
  it("puts every page on the custom domain with the export's trailing slash", () => {
    expect(siteUrl).toBe("https://context-circuit.kaotypr.com");
    expect(pageUrl("/")).toBe("https://context-circuit.kaotypr.com/");
    expect(pageUrl("/docs/get-started")).toBe("https://context-circuit.kaotypr.com/docs/get-started/");
    expect(pageUrl("/changelog/")).toBe("https://context-circuit.kaotypr.com/changelog/");
  });
});
