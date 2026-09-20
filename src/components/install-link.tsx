"use client";

import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

export function InstallLink({ destination, ...props }: ComponentProps<"a"> & { destination: "template" | "cli" | "documentation" }) {
  return <a {...props} onClick={() => trackEvent("install_cta", { destination })} />;
}
