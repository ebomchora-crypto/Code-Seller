import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createApiServer } from './api.mjs';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const port = Number(process.env.LOCAL_API_PORT || 4317);
const server = createApiServer({
  root: resolve('.code-makers/projects'),
  workspaceRoot: resolve('.code-makers/workspaces'),
  ai: { baseUrl: process.env.AI_BASE_URL, model: process.env.AI_MODEL, key: process.env.AI_API_KEY },
});
server.on('error', error => { console.error(`Não foi possível iniciar a API local: ${error.message}`); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`Code Makers API: http://127.0.0.1:${port}`));
