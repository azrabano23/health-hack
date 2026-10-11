// Browser notifications for nudges while ScarletWell is open on this phone or laptop. Background push needs the server piece
// (a VAPID key pair and a subscription endpoint on the engine) and SMS needs a provider; both are wired after the event.
export const canNotify = () => typeof window !== "undefined" && "Notification" in window;
export const notifyState = (): "granted" | "denied" | "default" | "unsupported" => (canNotify() ? Notification.permission : "unsupported");
export async function requestNotify(): Promise<boolean> {
  if (!canNotify()) return false;
  try { return (await Notification.requestPermission()) === "granted"; } catch { return false; }
}
export function notify(title: string, body: string) {
  if (!canNotify() || Notification.permission !== "granted") return false;
  try { new Notification(title, { body, icon: "/favicon.svg" }); return true; } catch { return false; }
}
