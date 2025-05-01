import { CommunityPage } from "@/sections/Communities/CommunityPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_left-sidebar/communities/$slug")({
  component: CommunityPage,
  validateSearch: (search: Record<string, unknown>) => ({}),
  parseParams: (params) => ({
    slug: decodeURIComponent(params.slug),
  }),
}); 