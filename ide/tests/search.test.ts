import { describe, it, expect } from 'vitest';
import { searchFiles, replaceFiles } from '../src/lib/search';
describe('project text search', () => {
  it('finds literal text and records path and line', () => { expect(searchFiles({ '/a.ts': 'first\nhello WORLD\nlast' }, 'world')).toEqual([{ path: '/a.ts', line: 2, text: 'hello WORLD' }]); expect(searchFiles({ '/a': 'Hello' }, 'hello', true)).toEqual([]); });
  it('preserves unmatched files and treats regex and replacement tokens literally', () => { expect(replaceFiles({ '/a': 'A.b a.B', '/b': 'unchanged' }, 'a.b', '$&')).toEqual({ '/a': '$& $&', '/b': 'unchanged' }); expect(replaceFiles({ '/a': 'A a' }, 'A', 'x', true)).toEqual({ '/a': 'x a' }); expect(replaceFiles({ '/a': 'x' }, '', 'y')).toEqual({ '/a': 'x' }); });
});
