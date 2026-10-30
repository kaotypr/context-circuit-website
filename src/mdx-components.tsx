import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Changelog } from "@/components/changelog";
import { CardGrid, Callout, DocCard, HomeIntro, Topic, TopicList } from "@/components/content-blocks";
import { InstallLink } from "@/components/install-link";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { PromptBlock } from "@/components/prompt-block";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Callout,
    CardGrid,
    Changelog,
    DocCard,
    HomeIntro,
    InstallLink,
    Mermaid: MermaidDiagram,
    PromptBlock,
    Topic,
    TopicList,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
