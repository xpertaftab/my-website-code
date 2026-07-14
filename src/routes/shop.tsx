import { createFileRoute } from "@tanstack/react-router";
import { LegacyRedirect } from "../components/legacy-redirect";

export const Route = createFileRoute("/shop")({
  component: ShopRoute,
});

function ShopRoute() {
  return <LegacyRedirect page="shop" />;
}