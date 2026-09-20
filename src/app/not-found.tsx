import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="document-frame prose">
      <p className="eyebrow">Page not found</p>
      <h1>This page is not in the docs.</h1>
      <p>
        The address may have changed, or this documentation version may not be available. Search
        the docs or choose a starting point.
      </p>
      <div className="hero-actions">
        <Button asChild>
          <Link href="/docs">Browse documentation</Link>
        </Button>
        <Link href="/docs/releases/major-versions">Available versions →</Link>
      </div>
    </div>
  );
}
