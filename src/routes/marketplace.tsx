import { createFileRoute } from "@tanstack/react-router";
import { LegacyRedirect } from "../components/legacy-redirect";

export const Route = createFileRoute("/marketplace")({
  component: MarketplaceRoute,
});

function MarketplaceRoute() {
  return <LegacyRedirect page="marketplace" />;
}