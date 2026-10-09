// Gera o instalador do Windows (CodeSellersIDE-Setup.exe) a partir de qualquer sistema.
// Uso: node scripts/pack-windows.mjs   (antes: npm run build)
import { cp, mkdir, rm, writeFile, copyFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
const root = resolve('.'); const stage = join(root, '.pack');
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const runtimeDeps = Object.fromEntries(['esbuild', 'node-pty', 'parse5', 'jszip', 'ws'].map(name => [name, pkg.dependencies[name]]));
await rm(stage, { recursive: true, force: true }); await mkdir(stage, { recursive: true });
await cp('dist', join(stage, 'dist'), { recursive: true }); await cp('server', join(stage, 'server'), { recursive: true });
await mkdir(join(stage, 'desktop'), { recursive: true }); await copyFile('desktop/main.cjs', join(stage, 'desktop/main.cjs'));
await writeFile(join(stage, 'package.json'), JSON.stringify({ name: 'code-sellers-ide', productName: 'Code Sellers IDE', version: pkg.version, description: 'IDE do Code Sellers para Windows', author: 'Code Sellers', main: 'desktop/main.cjs', type: 'module', dependencies: runtimeDeps, devDependencies: { electron: '33.4.11', 'electron-builder': pkg.devDependencies['electron-builder'] } }, null, 2));
const env = { ...process.env, ELECTRON_SKIP_BINARY_DOWNLOAD: '1' };
execFileSync('npm', ['install', '--ignore-scripts', '--os=win32', '--cpu=x64', '--no-audit', '--no-fund'], { cwd: stage, stdio: 'inherit', env });
// Só o binário do Windows do node-pty (as outras plataformas pesam dezenas de MB à toa).
const prebuilds = join(stage, 'node_modules/node-pty/prebuilds');
for (const name of await (await import('node:fs/promises')).readdir(prebuilds)) if (name !== 'win32-x64') await rm(join(prebuilds, name), { recursive: true, force: true });
for (const name of ['src', 'deps', 'third_party', 'scripts', 'typings']) await rm(join(stage, 'node_modules/node-pty', name), { recursive: true, force: true });
await copyFile(resolve('../desktop/build/icon.ico'), join(stage, 'icon.ico'));
const { build, Platform, Arch } = await import(join(stage, 'node_modules/electron-builder/out/index.js'));
await build({ projectDir: stage, targets: Platform.WINDOWS.createTarget(['nsis'], Arch.x64), publish: 'never', config: {
  appId: 'com.codesellers.ide', publish: { provider: 'generic', url: 'https://codesellers.vercel.app/downloads', channel: 'ide' }, productName: 'Code Sellers IDE', asar: false, npmRebuild: false, compression: 'maximum',
  directories: { output: join(stage, 'release') }, files: ['dist/**/*', 'server/**/*', 'desktop/main.cjs', 'package.json', 'node_modules/**/*', '!node_modules/electron/**', '!node_modules/electron-builder/**', '!**/*.map'],
  electronLanguages: ['pt-BR', 'en-US'],
  win: { signAndEditExecutable: false, icon: join(stage, 'icon.ico'), artifactName: 'CodeSellersIDE-Setup.${ext}' },
  nsis: { oneClick: false, differentialPackage: false, allowToChangeInstallationDirectory: true, createDesktopShortcut: true, createStartMenuShortcut: true, shortcutName: 'Code Sellers IDE', deleteAppDataOnUninstall: false },
} });
console.log('Instalador em', join(stage, 'release'));
