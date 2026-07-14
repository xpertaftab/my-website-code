import { createFileRoute } from "@tanstack/react-router";
import { LegacyRedirect } from "../components/legacy-redirect";

export const Route = createFileRoute("/blogs")({
  component: BlogsRoute,
});

function BlogsRoute() {
  return <LegacyRedirect page="blogs" />;
}