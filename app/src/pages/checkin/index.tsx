// Surface: checkin — owner: azra. Edit ONLY inside src/pages/checkin/. Spec: docs/SOURCE_OF_TRUTH.md ()
import type { PageRoute } from "@/App";

export const route: PageRoute = { path: "/checkin", label: "Check-in", order: 3, owner: "azra", student: true };

export default function Page() {
  return (
    <section>
      <h1 className="font-display text-3xl font-bold">Check-in</h1>
      <p className="mt-2 text-sm opacity-70">§2.3 Check-in</p>
    </section>
  );
}
