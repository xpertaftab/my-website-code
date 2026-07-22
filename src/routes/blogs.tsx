import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/blogs")({
  beforeLoad: () => {
    throw redirect({ href: "/index.html#blogs" });
  },
});
