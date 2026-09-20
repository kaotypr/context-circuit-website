import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Context Circuit",
    template: "%s · Context Circuit",
  },
  description: "Documentation for Context Circuit workspaces and the Context Circuit CLI.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="shell">
            <Link className="brand" href="/">
              Context Circuit
            </Link>
            <nav aria-label="Primary navigation">
              <Link href="/docs/getting-started">Docs</Link>
              <Link href="/docs/template/v2/getting-started">Template v2</Link>
              <Link href="/docs/cli/v2/getting-started">CLI v2</Link>
              <Link href="/changelog/template">Changelog</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

