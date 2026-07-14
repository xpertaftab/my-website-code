import { useEffect } from "react";

type LegacyRedirectProps = {
  page?: string;
};

export function LegacyRedirect({ page }: LegacyRedirectProps) {
  useEffect(() => {
    const target = page ? `/legacy/index.html#${page}` : "/legacy/index.html";
    window.location.replace(target);
  }, [page]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
      Loading Vextro Lyntra…
    </div>
  );
}