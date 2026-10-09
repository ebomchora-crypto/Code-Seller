import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { DialogHost } from "./components/DialogHost";
import { NewProjectDialog } from "./components/NewProjectDialog";
import { SettingsDialog } from "./components/SettingsDialog";
import { useUi } from "./lib/ui";
import { cloud } from "./lib/mode";
import { supabase } from "./lib/cloud/client";
const EditorPage = lazy(() => import('./pages/EditorPage'));
const StandalonePreview = lazy(() => import('./pages/StandalonePreview'));

function CloudGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { void supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); else location.href = `/login?next=${encodeURIComponent(location.pathname)}`; }); }, []);
  return ready ? <>{children}</> : <div className="p-12 text-vs-dim">Entrando…</div>;
}

const App = () => {
  useEffect(() => {
    const keys = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key === ',') { event.preventDefault(); useUi.getState().set({ settings: true }); } };
    window.addEventListener('keydown', keys); return () => window.removeEventListener('keydown', keys);
  }, []);
  return (
    <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <div className="min-h-screen bg-vs-editor text-vs-fg">
        {cloud ? <CloudGate><Routes>
          <Route path="/" element={<Suspense fallback={null}><EditorPage /></Suspense>} />
          <Route path="/project/:id" element={<Suspense fallback={null}><EditorPage /></Suspense>} />
          <Route path="/preview/:id" element={<Suspense fallback={null}><StandalonePreview /></Suspense>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes></CloudGate> : <Suspense fallback={<div className="p-12 text-vs-dim">Carregando editor…</div>}><Routes>
          <Route path="/" element={<EditorPage />} />
          <Route path="/projects" element={<Dashboard />} />
          <Route path="/project/:id" element={<EditorPage />} />
          <Route path="/preview/:id" element={<StandalonePreview />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes></Suspense>}
        <DialogHost /><NewProjectDialog /><SettingsDialog />
      </div>
    </Router>
  );
};

export default App;
