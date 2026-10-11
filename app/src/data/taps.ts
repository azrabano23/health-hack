// Taps: the places a student said they went to (or opened directions for) after a suggestion, and the ones they passed on.
// Stays in localStorage. Sent to the engine only as {kind, followed} pairs so the ranker can learn which kinds of place
// work for this student; never a place name, never to the aggregate. See docs/SOURCE_OF_TRUTH.md 2.6.
import type { Tap } from "@/api/types";

const KEY = "taps";

export function loadTaps(): Tap[] {
  try { return (JSON.parse(localStorage.getItem(KEY) ?? "[]") as Tap[]).filter((t) => t && t.kind); } catch { return []; }
}

export function recordTap(kind: string | undefined, followed: boolean, dimension?: string) {
  if (!kind) return;
  const next = [...loadTaps(), { kind, followed, dimension, ts: new Date().toISOString() }].slice(-200);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
  window.dispatchEvent(new Event("taps"));
}

export function clearTaps() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } window.dispatchEvent(new Event("taps")); }

/** Only {kind, followed} leave the phone. */
export const forEngine = (taps: Tap[]) => taps.map(({ kind, followed }) => ({ kind, followed }));
