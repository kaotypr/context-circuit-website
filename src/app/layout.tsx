import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "@/components/search";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { ThemeToggle, themeScript } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";
import { getNavigation } from "@/lib/content";
import { isProductionDeployment } from "@/lib/analytics";
import "./globals.css";

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

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const navigation = await getNavigation();
  const analytics = isProductionDeployment();
  return (
    <html lang="en" data-density="comfortable" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/fredoka-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {analytics ? (
          <>
            <script defer data-domain="context-circuit.kaotypr.com" src="https://plausible.io/js/script.js" />
            <script dangerouslySetInnerHTML={{ __html: "window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}" }} />
          </>
        ) : null}
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="shell header-inner">
            <Link className="brand" href="/" aria-label="Context Circuit home">
              <BrandMark />
              <span className="brand-text">Context Circuit</span>
              <span className="brand-label">Docs</span>
            </Link>
            <div className="header-actions">
              <Link className="header-docs" href="/docs/releases">Releases</Link>
              <Search />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <MobileNav items={navigation} />
        <div className="layout">
          <Sidebar items={navigation} />
          <main className="content-main" id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
