import { expect, test } from 'vitest';
import { parseProposal, applyProposal } from '../src/lib/proposals';
test('AI proposals preserve unrelated files and require valid project paths', () => {
  const proposal = parseProposal('{"summary":"Atualizar", "changes":[{"path":"/App.tsx","content":"novo"}]}');
  expect(applyProposal({ '/App.tsx': 'antigo', '/styles.css': 'body{}' }, proposal)).toEqual({ '/App.tsx': 'novo', '/styles.css': 'body{}' });
  expect(() => parseProposal('{"changes":[{"path":"/../secret","content":"x"}]}')).toThrow();
  expect(() => parseProposal('{"changes":[{"path":"/a.ts","content":false}]}')).toThrow();
});
test('deletion is explicit and an empty project cannot be applied', () => {
  const proposal = parseProposal('{"summary":"Excluir", "changes":[{"path":"/a.ts","content":null}]}');
  expect(() => applyProposal({ '/a.ts': 'code' }, proposal)).toThrow();
  expect(applyProposal({ '/a.ts': 'code', '/b.ts': 'safe' }, proposal)).toEqual({ '/b.ts': 'safe' });
});
