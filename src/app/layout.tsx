import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import { isProductionDeployment } from "@/lib/analytics";
import { uiTranslations } from "@/lib/translations";
import "./global.css";

export const metadata: Metadata = {
  title: {
    default: "Context Circuit",
    template: "%s · Context Circuit",
  },
  description:
    "Documentation for Context Circuit, the living documentation system for software projects.",
  metadataBase: new URL("https://context-circuit.kaotypr.com"),
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const analytics = isProductionDeployment();
  return (
    <html lang="en" data-density="comfortable" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/fredoka-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {analytics ? (
          <>
            <script defer data-domain="context-circuit.kaotypr.com" src="https://plausible.io/js/script.js" />
            <script dangerouslySetInnerHTML={{ __html: "window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}" }} />
          </>
        ) : null}
      </head>
      <body className="flex min-h-screen flex-col">
        <a className="skip-link" href="#main-content">Skip to content</a>
        <RootProvider
          i18n={{ locale: "en", translations: uiTranslations }}
          search={{
            options: { type: "static", api: "/search-index.json" },
            links: [
              ["Get started", "/docs/get-started"],
              ["Version pinning", "/docs/cli/version-pinning"],
              ["Prompt cookbook", "/docs/prompts"],
            ],
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
