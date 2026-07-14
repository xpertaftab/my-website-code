import { createFileRoute } from "@tanstack/react-router";
import { LegacyRedirect } from "../components/legacy-redirect";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <LegacyRedirect />;
}
