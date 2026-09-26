import { useState } from 'react'
import { Download } from 'lucide-react'
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
    <Button variant="ghost" className="h-11 rounded-full px-4" onClick={handleClick} loading={exporting}>
      {!exporting && <Download className="size-4" />}
      Exportar CSV
    </Button>
  )
}
