// DO NOT EDIT TO ADD A PAGE. Pages self-register: create src/pages/<name>/index.tsx exporting
// `route` and a default component. Nobody touches this file, so nobody conflicts here.
import type { ComponentType } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";

export interface PageRoute { path: string; label: string; order: number; owner: "azra" | "nitu"; student?: boolean }
type PageModule = { route: PageRoute; default: ComponentType };

const pages = Object.values(import.meta.glob<PageModule>("./pages/*/index.tsx", { eager: true }))
  .sort((a, b) => a.route.order - b.route.order);
const studentTabs = pages.filter((p) => p.route.student);

export default function App() {
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="flex items-center justify-between px-4 py-3 border-b border-mist">
        <span className="font-display font-bold text-lg">ScarletWell <span className="text-line">TWIN</span></span>
        <nav className="hidden md:flex gap-4 text-sm">
          {pages.map((p) => <NavLink key={p.route.path} to={p.route.path} className={({ isActive }) => isActive ? "font-semibold text-line" : ""}>{p.route.label}</NavLink>)}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Routes>
          {pages.map((p) => <Route key={p.route.path} path={p.route.path} element={<p.default />} />)}
          <Route path="*" element={<Navigate to={pages[0]?.route.path ?? "/"} replace />} />
        </Routes>
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 flex justify-around bg-paper border-t border-mist py-2 text-xs">
        {studentTabs.map((p) => <NavLink key={p.route.path} to={p.route.path} className={({ isActive }) => isActive ? "font-semibold text-line" : ""}>{p.route.label}</NavLink>)}
      </nav>
    </div>
  );
}
