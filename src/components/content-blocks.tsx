import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Callout } from "fumadocs-ui/components/callout";
import { InstallLink } from "./install-link";
import { BrandMark } from "./brand-mark";

/** Content files keep their component names; Fumadocs supplies the implementation. */
export const CardGrid = Cards;
export const DocCard = Card;
export { Callout };

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
        <InstallLink className="button button-primary" href="/docs/get-started/install" destination="template">
          Create a workspace
        </InstallLink>
        <Link className="text-link" href="/docs/understand">
          Understand the circuit
        </Link>
      </div>
    </section>
  );
}
