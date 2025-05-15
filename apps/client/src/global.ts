import { Icons } from "./components/Icons";

export type CommunityType = "open" | "gated" | "private";

export const CommunityTypeIconMapping: Record<CommunityType, any> = {
  gated: Icons.GatedCommunity,
  open: Icons.OpenCommunity,
  private: Icons.PrivateCommunity,
};
