// Surface: counselor — owner: nitu. Edit ONLY inside src/pages/counselor/. Spec: docs/SOURCE_OF_TRUTH.md ()
import type { PageRoute } from "@/App";

export const route: PageRoute = { path: "/counselor", label: "Counselor", order: 6, owner: "nitu", student: false };

export default function Page() {
  return (
    <section>
      <h1 className="font-display text-3xl font-bold">Counselor</h1>
      <p className="mt-2 text-sm opacity-70">§3 / A5</p>
    </section>
  );
}
