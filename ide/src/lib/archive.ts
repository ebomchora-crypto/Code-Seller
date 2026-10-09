import JSZip from 'jszip';
export async function exportZip(name: string, files: Record<string, string>) {
  const zip = new JSZip();
  Object.entries(files).forEach(([path, content]) => zip.file(path.slice(1), content));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `${name.replace(/[^\p{L}\p{N}_-]/gu, '_')}.zip`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importZip(file: File): Promise<Record<string, string>> {
  if (file.size > 5 * 1024 * 1024) throw new Error('Importe um ZIP de até 5 MB, sem node_modules.');
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter(entry => !entry.dir && !entry.name.split('/').some(part => ['node_modules', '.git', 'dist'].includes(part) || part === '.env' || part.startsWith('.env.')));
  if (entries.length > 300) throw new Error('Importe no máximo 300 arquivos.');
  const root = entries[0]?.name.split('/')[0];
  const stripRoot = root && entries.every(entry => entry.name.startsWith(`${root}/`)) && entries.some(entry => new RegExp(`/(package\\.json|index\\.html|App\\.[jt]sx)$`).test(entry.name));
  const files: Record<string, string> = {}; let size = 0;
  for (const entry of entries) {
    const uncompressed = (entry as typeof entry & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
    if (uncompressed !== undefined && uncompressed + size > 5 * 1024 * 1024) throw new Error('Conteúdo descompactado excede 5 MB.');
    if (/\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|pdf|zip)$/i.test(entry.name)) continue;
    const original = (entry as typeof entry & { unsafeOriginalName?: string }).unsafeOriginalName || entry.name;
    if (original.includes('\\') || original.split('/').some(part => part === '..' || part === '.')) throw new Error('O ZIP contém caminhos inválidos.');
    const content = await entry.async('string');
    size += new TextEncoder().encode(content).length;
    if (size > 5 * 1024 * 1024) throw new Error('Conteúdo descompactado excede 5 MB.');
    if (content.includes('\0')) throw new Error('Somente arquivos de texto são suportados.');
    files[`/${stripRoot ? entry.name.slice(root.length + 1) : entry.name}`] = content;
  }
  if (!Object.keys(files).length) throw new Error('Nenhum arquivo de texto encontrado.');
  return files;
}
