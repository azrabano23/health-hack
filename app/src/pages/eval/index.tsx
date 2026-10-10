// Surface: eval — owner: nitu. Edit ONLY inside src/pages/eval/. Spec: docs/SOURCE_OF_TRUTH.md ()
import type { PageRoute } from "@/App";

export const route: PageRoute = { path: "/eval", label: "Eval", order: 7, owner: "nitu", student: false };

export default function Page() {
  return (
    <section>
      <h1 className="font-display text-3xl font-bold">Predicted vs observed</h1>
      <p className="mt-2 text-sm opacity-70">§4 / A7</p>
    </section>
  );
}
