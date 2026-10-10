// Surface: nearby — owner: azra. Edit ONLY inside src/pages/nearby/. Spec: docs/SOURCE_OF_TRUTH.md ()
import type { PageRoute } from "@/App";

export const route: PageRoute = { path: "/nearby", label: "Nearby", order: 4, owner: "azra", student: true };

export default function Page() {
  return (
    <section>
      <h1 className="font-display text-3xl font-bold">Nearby</h1>
      <p className="mt-2 text-sm opacity-70">§2.3 Nearby</p>
    </section>
  );
}
