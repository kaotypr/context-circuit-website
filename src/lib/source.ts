import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";
import { sidebarIcon } from "@/lib/icons";

export const source = loader({
  baseUrl: "/",
  source: docs.toFumadocsSource(),
  icon: sidebarIcon,
});

export type ContentPage = NonNullable<ReturnType<typeof source.getPage>>;
