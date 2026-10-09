import { spawn } from 'node:child_process';
import electron from 'electron';
const child = spawn(electron, ['desktop/main.cjs'], { stdio: 'inherit', env: { ...process.env, CODE_MAKERS_NODE: process.execPath } });
child.on('exit', code => process.exit(code ?? 1));
