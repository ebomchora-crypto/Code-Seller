import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface ExportButtonProps {
  onExport: () => void
}

export function ExportButton({ onExport }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  function handleClick() {
    setExporting(true)
    onExport()
    setTimeout(() => setExporting(false), 400)
  }

  return (
    <Button variant="ghost" onClick={handleClick} loading={exporting}>
      Exportar CSV
    </Button>
  )
}
