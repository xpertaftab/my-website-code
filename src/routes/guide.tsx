import { createFileRoute } from "@tanstack/react-router";
import { LegacyRedirect } from "../components/legacy-redirect";

export const Route = createFileRoute("/guide")({
  component: GuideRoute,
});

function GuideRoute() {
  return <LegacyRedirect page="guide" />;
}