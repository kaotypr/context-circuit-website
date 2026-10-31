import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  BooksIcon,
  CheckSquareOffsetIcon,
  FolderSimpleIcon,
  GitForkIcon,
  TagIcon,
  TerminalWindowIcon,
} from "@phosphor-icons/react/dist/ssr";
import { CopyCommand } from "@/components/copy-command";
import { InstallLink } from "@/components/install-link";
import { templateInitCommand } from "@/lib/install";
import { releaseRegistry, trackLabels, tracks, type Track } from "@/lib/releases";

/* Home page sections. The words live in content/index.mdx so they stay searchable;
 * these components only lay them out. */

function Actions() {
  return (
    <div className="hero-actions">
      <InstallLink className="button button-primary" href="/docs/get-started/install" destination="template">
        Create a workspace
        <ArrowRightIcon aria-hidden="true" />
      </InstallLink>
      <Link className="button button-outline" href="/docs/understand">
        Understand the circuit
      </Link>
    </div>
  );
}

export function HomeHero({ children }: { children: ReactNode }) {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <p className="home-chips">
        {tracks.map((track) => (
          <Link className="chip" key={track} href={`/releases/${track}/${releaseRegistry[track].current}`}>
            <TagIcon aria-hidden="true" />
            {trackLabels[track]} {releaseRegistry[track].current}
          </Link>
        ))}
      </p>
      <h1 id="home-title">
        Keep project knowledge <span className="display-word">alive</span> across every change.
      </h1>
      <div className="home-summary">{children}</div>
      <CopyCommand command={templateInitCommand()} />
      <p className="command-caption">
        Creates a workspace folder from template {releaseRegistry.template.current}.{" "}
        <Link href="/docs/get-started/install">Read the install guide</Link>
      </p>
      <Actions />
    </section>
  );
}

/** Heading and text on the left, numbered steps on the right. */
export function HomeSplit({ children }: { children: ReactNode }) {
  return <section className="home-section home-split">{children}</section>;
}

/** A centred heading and subtitle above a card grid. */
export function HomeCentered({ children }: { children: ReactNode }) {
  return <section className="home-section home-centered">{children}</section>;
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="home-steps">{children}</ol>;
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="home-step">
      <p className="home-step-title">{title}</p>
      <div className="home-step-body">{children}</div>
    </li>
  );
}

const featureIcons = { knowledge: BooksIcon, records: CheckSquareOffsetIcon, repositories: GitForkIcon } as const;

export function Features({ children }: { children: ReactNode }) {
  return <div className="home-cards home-cards-3">{children}</div>;
}

export function Feature({
  icon,
  title,
  href,
  children,
}: {
  icon: keyof typeof featureIcons;
  title: string;
  href: string;
  children: ReactNode;
}) {
  const Icon = featureIcons[icon];
  return (
    <Link className="home-card" href={href}>
      <span className="icon-chip">
        <Icon aria-hidden="true" />
      </span>
      <span className="home-card-title">{title}</span>
      <span className="home-card-body">{children}</span>
    </Link>
  );
}

const productIcons: Record<Track, typeof FolderSimpleIcon> = { template: FolderSimpleIcon, cli: TerminalWindowIcon };

export function Products({ children }: { children: ReactNode }) {
  return <div className="home-cards home-cards-2">{children}</div>;
}

export function Product({ track, title, children }: { track: Track; title: string; children: ReactNode }) {
  const Icon = productIcons[track];
  const version = releaseRegistry[track].current;
  return (
    <div className="home-card home-product">
      <span className="home-product-head">
        <span className="icon-chip">
          <Icon aria-hidden="true" />
        </span>
        <span className="chip">{trackLabels[track]} {version}</span>
      </span>
      <span className="home-card-title">{title}</span>
      <span className="home-card-body">{children}</span>
      <span className="home-product-links">
        <Link href={`/releases/${track}/${version}`}>Release notes</Link>
        <Link href={`/changelog/${track}`}>Changelog</Link>
      </span>
    </div>
  );
}

export function HomeCallToAction({ children }: { children: ReactNode }) {
  return (
    <section className="home-cta">
      <div className="home-cta-text">{children}</div>
      <Actions />
    </section>
  );
}
