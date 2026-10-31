import { createElement } from "react";
import {
  BookOpenIcon,
  ChatsIcon,
  ClockCounterClockwiseIcon,
  CompassIcon,
  FlowArrowIcon,
  FolderSimpleIcon,
  LightbulbIcon,
  RocketLaunchIcon,
  TagIcon,
  TerminalWindowIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";

/** Sidebar icons named in meta.json and frontmatter. Only top-level sections carry one. */
const sidebarIcons = {
  BookOpen: BookOpenIcon,
  Chats: ChatsIcon,
  ClockCounterClockwise: ClockCounterClockwiseIcon,
  Compass: CompassIcon,
  FlowArrow: FlowArrowIcon,
  FolderSimple: FolderSimpleIcon,
  Lightbulb: LightbulbIcon,
  RocketLaunch: RocketLaunchIcon,
  Tag: TagIcon,
  TerminalWindow: TerminalWindowIcon,
  Wrench: WrenchIcon,
} as const;

export function sidebarIcon(name: string | undefined) {
  if (name === undefined) return undefined;
  const Icon = sidebarIcons[name as keyof typeof sidebarIcons];
  // A misspelled name fails the build instead of silently rendering nothing.
  if (!Icon) throw new Error(`Unknown sidebar icon "${name}". Add it to src/lib/icons.tsx.`);
  return createElement(Icon, { "aria-hidden": true });
}
