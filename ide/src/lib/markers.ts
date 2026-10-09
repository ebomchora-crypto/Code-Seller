import { useEffect, useState } from 'react';
import { monaco } from './monaco';

export type Marker = { path: string; line: number; column: number; message: string; severity: 'error' | 'warning' | 'info'; source?: string };
function severity(value: number): Marker['severity'] { return value >= 8 ? 'error' : value >= 4 ? 'warning' : 'info'; }
function collect(projectId: string): Marker[] {
  const editor = monaco?.editor as { getModelMarkers?: (filter: object) => monaco.editor.IMarker[] } | undefined;
  const prefix = `/projects/${projectId}`;
  return (editor?.getModelMarkers?.({}) || []).filter(item => item.resource.path.startsWith(`${prefix}/`)).map(item => ({
    path: item.resource.path.slice(prefix.length), line: item.startLineNumber, column: item.startColumn, message: item.message, severity: severity(item.severity), source: item.source,
  }));
}
/** Diagnósticos do Monaco para os arquivos do projeto (atualiza quando o Monaco muda os marcadores). */
export function useMarkers(projectId: string) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  useEffect(() => {
    const refresh = () => setMarkers(collect(projectId));
    refresh();
    const editor = monaco?.editor as { onDidChangeMarkers?: (listener: () => void) => { dispose: () => void } } | undefined;
    const listener = editor?.onDidChangeMarkers?.(refresh);
    return () => listener?.dispose();
  }, [projectId]);
  return markers;
}
