import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "@/components/search";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle, themeScript } from "@/components/theme-toggle";
import { getNavigation } from "@/lib/content";
import { isProductionDeployment } from "@/lib/analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Context Circuit",
    template: "%s · Context Circuit",
  },
  description: "Documentation for Context Circuit workspaces and the Context Circuit CLI.",
  metadataBase: new URL("https://context-circuit.kaotypr.com"),
  icons: { icon: "/icon.svg" },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const navigation = await getNavigation();
  const analytics = isProductionDeployment();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
              <span className="brand-mark" aria-hidden="true">C</span>
              <span className="brand-text">Context Circuit</span>
            </Link>
            <div className="header-actions"><Link className="button header-docs" href="/docs">Docs</Link><Search /><ThemeToggle /></div>
          </div>
        </header>
        <details className="mobile-nav"><summary>Documentation menu</summary><Sidebar items={navigation} /></details>
        <div className="layout"><Sidebar items={navigation} /><main className="content-main" id="main-content">{children}</main></div>
      </body>
    </html>
  );
}
