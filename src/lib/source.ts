import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";

export const source = loader({
  baseUrl: "/",
  source: docs.toFumadocsSource(),
});

export type ContentPage = NonNullable<ReturnType<typeof source.getPage>>;
