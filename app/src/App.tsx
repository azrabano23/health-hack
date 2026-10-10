// Shell. Pages self-register: create src/pages/<name>/index.tsx exporting `route` and a default component.
import type { ComponentType, ReactNode } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Wordmark } from "@/components/ui";

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
        <header className="sticky top-0 z-20 border-b-[1.5px] border-rule bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 md:px-8">
            <Link to="/" className="py-3.5"><Wordmark /></Link>
            <nav className="hidden items-stretch gap-6 self-stretch text-[15px] md:flex">
              {pages.filter((p) => !p.route.bare).map((p) => (
                <NavLink key={p.route.path} to={p.route.path}
                  className={({ isActive }) => `flex items-center border-b-[3px] pt-[3px] ${isActive ? "border-scarlet font-bold text-ink" : "border-transparent text-soft hover:text-ink"}`}>{p.route.label}</NavLink>))}
            </nav>
          </div>
        </header>)}
      <main className={home ? "" : cur?.student ? "mx-auto max-w-[480px] px-5 pb-8 pt-7" : "mx-auto max-w-6xl p-5 md:p-8"}>
        <Routes>
          {pages.map((p) => <Route key={p.route.path} path={p.route.path} element={<p.default />} />)}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!home && cur?.student && (
        <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t-[1.5px] border-rule bg-white px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 md:hidden">
          {studentTabs.map((p) => (
            <NavLink key={p.route.path} to={p.route.path}
              className={({ isActive }) => `flex min-w-14 flex-col items-center gap-0.5 border-t-[3px] px-2 pt-1.5 text-[12px] ${isActive ? "border-scarlet font-bold text-ink" : "border-transparent text-soft"}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICON[p.route.path]}</svg>
              {p.route.label}
            </NavLink>))}
        </nav>)}
    </div>
  );
}
