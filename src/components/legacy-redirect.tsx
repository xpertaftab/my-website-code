import { useEffect } from "react";

type LegacyRedirectProps = {
  page?: string;
};

export function LegacyRedirect({ page }: LegacyRedirectProps) {
  const target = page ? `/legacy/index.html#${page}` : "/legacy/index.html";

  // Client-side fallback (also runs if script tag is stripped).
  useEffect(() => {
    window.location.replace(target);
  }, [target]);

  // Inline redirect that fires during HTML parsing — before React hydration —
  // so a hard refresh navigates instantly instead of getting stuck on the
  // "Loading…" screen. Meta refresh is the last-resort fallback if JS is off.
  const inline = `try{window.location.replace(${JSON.stringify(target)});}catch(e){window.location.href=${JSON.stringify(target)};}`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: inline }} />
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        Loading Vextro Lyntra…
      </div>
    </>
  );
}
