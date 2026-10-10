// Surface: eat — owner: azra. Edit ONLY inside src/pages/eat/. Spec: docs/SOURCE_OF_TRUTH.md ()
import type { PageRoute } from "@/App";

export const route: PageRoute = { path: "/eat", label: "Eat", order: 2, owner: "azra", student: true };

export default function Page() {
  return (
    <section>
      <h1 className="font-display text-3xl font-bold">Eat</h1>
      <p className="mt-2 text-sm opacity-70">§2.3 Eat</p>
    </section>
  );
}
