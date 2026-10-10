// Surface: share — owner: nitu. Edit ONLY inside src/pages/share/. Spec: docs/SOURCE_OF_TRUTH.md ()
import type { PageRoute } from "@/App";

export const route: PageRoute = { path: "/share", label: "Share", order: 5, owner: "nitu", student: true };

export default function Page() {
  return (
    <section>
      <h1 className="font-display text-3xl font-bold">Share</h1>
      <p className="mt-2 text-sm opacity-70">§2.3 Share / A6</p>
    </section>
  );
}
