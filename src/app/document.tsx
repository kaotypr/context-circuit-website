import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import Link from "next/link";
import { CodeCopy } from "@/components/code-copy";
import { InstallLink } from "@/components/install-link";
import { TrackedLink } from "@/components/tracked-link";
import { VersionSelector } from "@/components/version-selector";
import { getNavigation, sourceUrl, type ContentDocument } from "@/lib/content";

function titleForSegment(segment: string): string {
  return segment.replace(/^v(?=\d)/, "v").replaceAll("-", " ").replace(/^./, (value) => value.toUpperCase());
}

export async function DocumentPage({ document }: { document: ContentDocument }) {
  const navigation = await getNavigation();
  const { content } = await compileMDX({
    source: document.body,
    components: { InstallLink },
    options: { mdxOptions: { rehypePlugins: [rehypeSlug] } },
  });
  const siblings = navigation.filter((item) => item.navigationRoot === document.routeInfo.navigationRoot);
  const currentIndex = siblings.findIndex((item) => item.route === document.routeInfo.route);
  const previous = currentIndex > 0 ? siblings[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 ? siblings[currentIndex + 1] : undefined;
  const segments = document.routeInfo.route.split("/").filter(Boolean);
  const knownRoutes = new Set(navigation.map((item) => item.route));
  const selector = document.routeInfo.track ? document.frontmatter.versions[document.routeInfo.track] : undefined;

  return (
    <div className="document-frame">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><ol><li><Link href="/">Home</Link></li>{segments.map((segment, index) => { const route = `/${segments.slice(0, index + 1).join("/")}`; const label = index === segments.length - 1 ? document.frontmatter.title : titleForSegment(segment); return <li key={route}>{index < segments.length - 1 && knownRoutes.has(route) ? <Link href={route}>{label}</Link> : label}</li>; })}</ol></nav>
      <article className="prose">
        <div className="labels"><span className="chip">{document.routeInfo.kind === "evergreen" || document.routeInfo.kind === "landing" ? "Evergreen" : document.routeInfo.kind}</span>{document.frontmatter.tracks.map((track) => <span className="chip track" key={track}>{track === "cli" ? "CLI" : "Template"}</span>)}{selector && selector !== "current" ? <VersionSelector value={selector} route={document.routeInfo.route} /> : null}</div>
        <p className="eyebrow">{document.frontmatter.section}</p>
        <h1>{document.frontmatter.title}</h1>
        <p className="summary">{document.frontmatter.description}</p>
        {content}
        <CodeCopy />
      </article>
      <footer className="page-meta">
        {document.frontmatter.sources.map((source) => { const version = document.frontmatter.versions[source.track]; const href = version ? sourceUrl(source.track, version, source.path) : undefined; return href ? <TrackedLink href={href} repository={source.repository} key={`${source.track}:${source.path}`}>View {source.track === "cli" ? "CLI" : "template"} source ({source.ref})</TrackedLink> : null; })}
        <TrackedLink href={`https://github.com/kaotypr/context-circuit-website/edit/main/content/${document.file}`} repository="context-circuit-website">Edit this page</TrackedLink>
      </footer>
      {previous || next ? <nav className="page-nav" aria-label="Previous and next pages">{previous ? <Link href={previous.route}><small>Previous</small>{previous.label}</Link> : <span />}{next ? <Link href={next.route}><small>Next</small>{next.label}</Link> : null}</nav> : null}
    </div>
  );
}
