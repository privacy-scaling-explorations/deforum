import { PostCreate } from "@/sections/Post/PostCreate";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_left-sidebar/post/create")({
  component: PostCreate,
  validateSearch: (search: Record<string, unknown>) => ({
    communitySlug: typeof search.community === 'string' ? search.community : undefined,
  }),
  /*loader: async () =>
    rspc
      .query(["group.list"])
      .then((groups) => groups.map(({ id, name }) => ({ id, name }))),*/
});
