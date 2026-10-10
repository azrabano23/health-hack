// Shell. Pages self-register: create src/pages/<name>/index.tsx exporting `route` and a default component.
import type { ComponentType, ReactNode } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Logo } from "@/components/ui";

export interface PageRoute { path: string; label: string; order: number; owner: "azra" | "nitu"; student?: boolean; bare?: boolean }
type PageModule = { route: PageRoute; default: ComponentType };

const pages = Object.values(import.meta.glob<PageModule>("./pages/*/index.tsx", { eager: true }))
  .sort((a, b) => a.route.order - b.route.order);
const studentTabs = pages.filter((p) => p.route.student);

const ICON: Record<string, ReactNode> = {
  "/today": <path d="M3 12h4l2-6 4 12 2-6h6" />,
  "/eat": <path d="M7 3v8M11 3v8M9 11v10M17 3c-2 2-2 6 0 8v10" />,
  "/checkin": <path d="M4 12l5 5L20 6" />,
  "/nearby": <path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z" />,
  "/share": <path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5" />,
};

export default function App() {
  const { pathname } = useLocation();
  const cur = pages.find((p) => p.route.path === pathname)?.route;
  const home = cur?.bare;
  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      {!home && (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-canvas/90 px-5 py-3 backdrop-blur">
          <Link to="/" className="flex items-center gap-2"><Logo /><span className="display text-xl">Yugma</span></Link>
          <nav className="hidden gap-1 text-sm font-medium md:flex">
            {pages.filter((p) => !p.route.bare).map((p) => (
              <NavLink key={p.route.path} to={p.route.path}
                className={({ isActive }) => `rounded px-3 py-2 ${isActive ? "bg-acid text-ink" : "text-soft hover:text-ink"}`}>{p.route.label}</NavLink>))}
          </nav>
        </header>)}
      <main className={home ? "" : cur?.student ? "mx-auto max-w-[460px] p-5" : "mx-auto max-w-6xl p-5 md:p-8"}>
        <Routes>
          {pages.map((p) => <Route key={p.route.path} path={p.route.path} element={<p.default />} />)}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!home && cur?.student && (
        <nav className="fixed inset-x-3 bottom-3 z-10 mx-auto flex max-w-[440px] justify-around rounded-md border border-rule bg-surface/95 px-2 py-2 shadow-lg backdrop-blur md:hidden">
          {studentTabs.map((p) => (
            <NavLink key={p.route.path} to={p.route.path}
              className={({ isActive }) => `flex min-w-14 flex-col items-center gap-0.5 rounded px-3 py-1.5 text-[10px] ${isActive ? "bg-acid text-ink" : "text-soft"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICON[p.route.path]}</svg>
              {p.route.label}
            </NavLink>))}
        </nav>)}
    </div>
  );
}
