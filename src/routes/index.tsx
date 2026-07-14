import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <iframe
      title="Vextro Lyntra"
      src="/legacy/index.html"
      style={{
        width: "100%",
        height: "100vh",
        border: 0,
        display: "block",
      }}
    />
  );
}
