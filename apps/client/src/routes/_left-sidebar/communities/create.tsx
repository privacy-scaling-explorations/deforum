import {  CommunityCreatePage } from "@/sections/Communities/CommunityCreatePage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_left-sidebar/communities/create")({
  component: CommunityCreatePage,
});
