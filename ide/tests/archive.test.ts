import { expect, test } from 'vitest';
import JSZip from 'jszip';
import { importZip } from '../src/lib/archive';
test('ZIP import strips one repository folder and omits dependencies and env files', async () => {
  const zip = new JSZip();
  zip.file('my-app/App.tsx', 'export default () => null');
  zip.file('my-app/styles.css', 'body {}');
  zip.file('my-app/node_modules/big.js', 'dependency');
  zip.file('my-app/.env.production', 'PRIVATE=secret');
  const blob = await zip.generateAsync({ type: 'uint8array' });
  const files = await importZip(new File([blob], 'project.zip'));
  expect(files).toEqual({ '/App.tsx': 'export default () => null', '/styles.css': 'body {}' });
});
