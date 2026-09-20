"use client";

import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

export function TrackedLink({ repository, ...props }: ComponentProps<"a"> & { repository: string }) {
  return <a {...props} onClick={() => trackEvent("source_link", { repository })} />;
}
