export function searchFiles(files: Record<string, string>, query: string, caseSensitive = false) {
  if (!query) return [];
  const needle = caseSensitive ? query : query.toLowerCase();
  return Object.entries(files).flatMap(([path, content]) => content.split('\n').flatMap((line, index) => (caseSensitive ? line : line.toLowerCase()).includes(needle) ? [{ path, line: index + 1, text: line }] : [])).slice(0, 1000);
}
export function replaceFiles(files: Record<string, string>, query: string, replacement: string, caseSensitive = false) {
  if (!query) return { ...files };
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
  return Object.fromEntries(Object.entries(files).map(([path, content]) => [path, content.replace(pattern, () => replacement)]));
}
