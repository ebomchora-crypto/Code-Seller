import { FileQuestion, FileWarning } from 'lucide-react';
import type { FileNode } from '../store/editorStore';
import { formatSize, rawUrl } from '../lib/lazyFs';

// Arquivos que não são texto editável: imagem (mostra), binário e arquivo grande demais (explica).
export function FilePreview({ file, projectId }: { file: FileNode; projectId: string }) {
  if (file.kind === 'image') return <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-6" style={{ background: 'repeating-conic-gradient(#80808022 0% 25%, transparent 0% 50%) 50% / 20px 20px' }}>
    <img alt={file.name} src={rawUrl(projectId, file.id)} className="max-w-full max-h-full object-contain" style={{ imageRendering: 'auto' }} /></div>;
  const Icon = file.kind === 'large' ? FileWarning : FileQuestion;
  return <div className="flex-1 flex items-center justify-center text-center p-8"><div className="max-w-sm"><Icon size={44} className="mx-auto mb-4 text-vs-dim" strokeWidth={1.3} />
    <p className="text-vs-strong text-[15px] mb-1">{file.kind === 'large' ? 'Arquivo grande demais para editar' : 'Arquivo binário'}</p>
    <p className="text-vs-muted text-sm">{file.name}{typeof file.size === 'number' ? ` · ${formatSize(file.size)}` : ''}</p>
    <p className="text-vs-dim text-xs mt-3">{file.kind === 'large' ? 'A IDE edita arquivos de texto de até 24 MB. Abra este arquivo em outro programa.' : 'Esse tipo de arquivo não pode ser editado como texto.'}</p></div></div>;
}
