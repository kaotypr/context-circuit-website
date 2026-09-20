export const analyticsEvents = ["docs_search", "install_cta", "code_copy", "source_link"] as const;
export type AnalyticsEvent = (typeof analyticsEvents)[number];

const allowedValues = {
  docs_search: {
    section: ["all", "Documentation", "Get started", "Concepts", "Workflows", "Reference", "Maintainers"],
    results: ["0", "1-5", "6-20", "20+"],
  },
  install_cta: { destination: ["template", "cli", "documentation"] },
  code_copy: { category: ["shell", "yaml", "json", "text", "other"] },
  source_link: { repository: ["context-circuit", "context-circuit-source", "context-circuit-website"] },
} as const;

export type AnalyticsPayload = Record<string, string>;

export function isProductionDeployment(environment = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV): boolean {
  return environment === "production";
}

export function resultBucket(count: number): string {
  if (count === 0) return "0";
  if (count <= 5) return "1-5";
  if (count <= 20) return "6-20";
  return "20+";
}

export function sanitizeEvent(event: AnalyticsEvent, payload: AnalyticsPayload): AnalyticsPayload {
  const contract = allowedValues[event] as Record<string, readonly string[]>;
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => contract[key]?.includes(value)),
  );
}

export function trackEvent(event: AnalyticsEvent, payload: AnalyticsPayload): void {
  if (!isProductionDeployment() || typeof window === "undefined") return;
  try {
    window.plausible?.(event, { props: sanitizeEvent(event, payload) });
  } catch {
    // Analytics is deliberately isolated from reader interactions.
  }
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: AnalyticsPayload }) => void;
  }
}
