import Link from "next/link";
import type { ReactNode } from "react";
import { InstallLink } from "./install-link";
import { BrandMark } from "./brand-mark";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="card-grid">{children}</div>;
}

export function DocCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description?: string;
  number?: string;
}) {
  return (
    <Link className="doc-card" href={href}>
      <strong>{title}</strong>
      {description ? <span className="card-description">{description}</span> : null}
    </Link>
  );
}

export function TopicList({ children }: { children: ReactNode }) {
  return <dl className="topic-list">{children}</dl>;
}

export function Topic({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="topic">
      <dt>
        <Link href={href}>{title}</Link>
      </dt>
      {children ? <dd>{children}</dd> : null}
    </div>
  );
}

export function Callout({
  title,
  children,
  variant = "info",
}: {
  title: string;
  children: ReactNode;
  variant?: "info" | "success" | "warning";
}) {
  return (
    <Alert className="callout" variant={variant}>
      <div>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{children}</AlertDescription>
      </div>
    </Alert>
  );
}

export function HomeIntro() {
  return (
    <section className="home-intro" aria-labelledby="home-title">
      <BrandMark className="home-mark" alt="" />
      <p className="eyebrow">Documentation</p>
      <h1 id="home-title">Keep project knowledge alive across every change.</h1>
      <p className="home-summary">
        Context Circuit is a living documentation system for a product or project. It gives coding
        agents accepted context before they change code, coordinates work across repositories, and
        brings durable knowledge back in line when the work is complete.
      </p>
      <div className="hero-actions">
        <Button asChild>
          <InstallLink href="/docs/get-started/install" destination="template">
            Create a workspace
          </InstallLink>
        </Button>
        <Link className="text-link" href="/docs/understand">
          Understand the circuit
        </Link>
      </div>
    </section>
  );
}
