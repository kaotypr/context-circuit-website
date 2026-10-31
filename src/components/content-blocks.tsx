import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Callout } from "fumadocs-ui/components/callout";

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
