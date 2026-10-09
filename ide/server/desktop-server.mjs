import { resolve, join } from 'node:path';
import { createApiServer } from './api.mjs';

const data = process.env.CODE_MAKERS_DATA;
if (!data) throw new Error('CODE_MAKERS_DATA is required');
const server = createApiServer({ root: join(data, 'projects'), workspaceRoot: join(data, 'workspaces'), staticRoot: resolve(import.meta.dirname, '../dist') });
// Stable desktop origin preserves browser preferences between launches.
server.listen(Number(process.env.CODE_MAKERS_PORT ?? 4318), '127.0.0.1', () => process.send?.({ type: 'ready', url: `http://127.0.0.1:${server.address().port}` }));
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await server.shutdownTerminals();
  // HTTP close waits for websocket connections; emit close first to terminate PTYs.
  server.emit('close');
  server.closeAllConnections();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 4000).unref();
}
process.on('message', message => { if (message?.type === 'shutdown') stop(); });
process.on('disconnect', stop);
process.on('SIGTERM', stop);
server.on('error', error => { console.error(error); process.exit(1); });
