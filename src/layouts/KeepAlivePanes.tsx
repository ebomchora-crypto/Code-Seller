import { Suspense, useRef, useState, useEffect } from 'react'
import { Route, Routes, useLocation, type Location } from 'react-router-dom'
import { lazyPage } from '@/utils/lazyPage'
import { Spinner } from '@/components/ui/Spinner'
import { isCodeMakerPath, isCopilotPath } from '@/layouts/appSurface'

const CopilotPage = lazyPage(() => import('@/pages/autopilot'))
const CodeMakerPage = lazyPage(() => import('@/pages/code-maker'))
const CodeMakerEditorPage = lazyPage(() => import('@/pages/code-maker/[id]'))
const CodeMakerShell = lazyPage(() => import('@/pages/code-maker/layout'))

function PaneFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="lg" className="text-purple-600" />
    </div>
  )
}

// Uma ferramenta que, depois de aberta uma vez, continua montada por baixo
// quando você vai para outra tela: voltar para ela é instantâneo e a conversa
// (ou o site em andamento) continua do mesmo ponto. `location` congela a rota
// da ferramenta enquanto você está em outra tela.
function usePane(match: (pathname: string) => boolean) {
  const location = useLocation()
  const active = match(location.pathname)
  const last = useRef<Location>(location)
  const [opened, setOpened] = useState(active)
  if (active) last.current = location
  useEffect(() => {
    if (active) setOpened(true)
  }, [active])
  return { active, opened: opened || active, location: last.current }
}

export function KeepAlivePanes() {
  const copilot = usePane(isCopilotPath)
  const codeMaker = usePane(isCodeMakerPath)

  return (
    <>
      {copilot.opened && (
        <div className={copilot.active ? 'absolute inset-0 z-10' : 'hidden'}>
          <Suspense fallback={<PaneFallback />}>
            <Routes location={copilot.location}>
              <Route path="/copilot" element={<CopilotPage />} />
            </Routes>
          </Suspense>
        </div>
      )}
      {codeMaker.opened && (
        <div className={codeMaker.active ? 'absolute inset-0 z-10' : 'hidden'}>
          <Suspense fallback={<PaneFallback />}>
            <Routes location={codeMaker.location}>
              <Route path="/code-maker" element={<CodeMakerShell />}>
                <Route index element={<CodeMakerPage />} />
                <Route path=":id" element={<CodeMakerEditorPage />} />
              </Route>
            </Routes>
          </Suspense>
        </div>
      )}
    </>
  )
}
