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
    <main className="legacy-preview-shell">
      <iframe
        title="Vextro Lyntra full website preview"
        src="/index.html"
        className="legacy-preview-frame"
      />
    </main>
  );
}
