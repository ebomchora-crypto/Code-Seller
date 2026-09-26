import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'

function readDocumentTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// O Toaster fica fora do AppLayout (também aparece nas telas de login), então
// acompanha a classe do <html> em vez de depender de uma instância do useTheme.
export function ThemedToaster() {
  const [theme, setTheme] = useState(readDocumentTheme)

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readDocumentTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <Toaster
      position="top-right"
      theme={theme}
      richColors
      closeButton
      toastOptions={{ style: { borderRadius: 16, fontFamily: 'inherit' } }}
    />
  )
}
