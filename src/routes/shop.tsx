import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/shop")({
  beforeLoad: () => {
    throw redirect({ href: "/index.html#shop" });
  },
});
