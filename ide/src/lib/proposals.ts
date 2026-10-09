export interface Proposal { summary: string; changes: { path: string; content: string | null }[] }
export function parseProposal(raw: string): Proposal {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.changes) || !data.changes.length || data.changes.length > 50) throw new Error('A IA não retornou uma proposta de arquivos válida.');
  const paths = new Set<string>();
  for (const change of data.changes) {
    if (!change || typeof change.path !== 'string' || !change.path.startsWith('/') || /[\\\x00-\x1f:]/.test(change.path) || change.path.split('/').slice(1).some((part: string) => !part || part === '.' || part === '..') || paths.has(change.path) || !(change.content === null || typeof change.content === 'string')) throw new Error('A proposta contém arquivos inválidos ou duplicados.');
    paths.add(change.path);
  }
  return { summary: typeof data.summary === 'string' ? data.summary : 'Alterações propostas', changes: data.changes };
}
export function applyProposal(files: Record<string, string>, proposal: Proposal): Record<string, string> {
  const next = { ...files };
  for (const change of proposal.changes) { if (change.content === null) delete next[change.path]; else next[change.path] = change.content; }
  if (!Object.keys(next).length) throw new Error('A proposta excluiria todos os arquivos do projeto.');
  return next;
}
