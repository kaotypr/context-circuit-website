import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentPage } from "./document";
import { getPublishedDocument } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedDocument("/");
  return document
    ? { title: document.frontmatter.title, description: document.frontmatter.description }
    : {};
}

export default async function HomePage() {
  const document = await getPublishedDocument("/");
  if (!document) notFound();
  return <DocumentPage document={document} />;
}

