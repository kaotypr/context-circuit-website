export const analyticsEvents = ["install_cta"] as const;
export type AnalyticsEvent = (typeof analyticsEvents)[number];

const allowedValues = {
  install_cta: { destination: ["template", "cli", "documentation"] },
} as const;

export type AnalyticsPayload = Record<string, string>;

export function isProductionDeployment(environment = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV): boolean {
  return environment === "production";
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
