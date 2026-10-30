import Link from "next/link";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

export default function NotFound() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="not-found prose" id="main-content" tabIndex={-1}>
        <p className="eyebrow">Page not found</p>
        <h1>This page wandered off the circuit.</h1>
        <p>
          The address may have changed, or it names a documentation version that does not exist.
          Search the docs, or start from one of these pages.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/docs">
            Browse documentation
          </Link>
          <Link className="text-link" href="/docs/releases/major-versions">
            See available versions
          </Link>
        </div>
      </div>
    </HomeLayout>
  );
}
