import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vextro Lyntra — Digital Services & Marketplace" },
      {
        name: "description",
        content:
          "Vextro Lyntra offers web development, SaaS, AI automation, SEO, ads, design services, and premium digital products.",
      },
      { property: "og:title", content: "Vextro Lyntra — Digital Services & Marketplace" },
      {
        property: "og:description",
        content:
          "Explore premium web, software, AI, SEO, advertising, design, shop, tools, and marketplace services from Vextro Lyntra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePreview,
});

function HomePreview() {
  return (
    <main
      className="legacy-preview-shell"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <iframe
        title="Vextro Lyntra full website preview"
        src="/index.html"
        className="legacy-preview-frame"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          border: "0",
        }}
      />
    </main>
  );
}

