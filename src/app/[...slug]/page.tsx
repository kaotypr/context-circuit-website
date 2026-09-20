import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentPage } from "../document";
import { getPublishedDocument, getPublishedDocuments } from "@/lib/content";

type RouteProps = { params: Promise<{ slug: string[] }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const documents = await getPublishedDocuments();
  return documents
    .filter((document) => document.routeInfo.route !== "/")
    .map((document) => ({ slug: document.routeInfo.route.slice(1).split("/") }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const document = await getPublishedDocument(`/${slug.join("/")}`);
  return document
    ? {
        title: document.frontmatter.title,
        description: document.frontmatter.description,
        alternates: document.frontmatter.canonical_url
          ? { canonical: document.frontmatter.canonical_url }
          : undefined,
      }
    : {};
}

export default async function ContentPage({ params }: RouteProps) {
  const { slug } = await params;
  const document = await getPublishedDocument(`/${slug.join("/")}`);
  if (!document) notFound();
  return <DocumentPage document={document} />;
}

