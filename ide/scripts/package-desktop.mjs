import { mkdir, copyFile } from 'node:fs/promises';
import { build, Platform, Arch } from 'electron-builder';
await mkdir('desktop/runtime', { recursive: true });
await copyFile(process.execPath, 'desktop/runtime/node.exe');
const license = await fetch(`https://raw.githubusercontent.com/nodejs/node/v${process.versions.node}/LICENSE`, { signal: AbortSignal.timeout(20000) });
if (!license.ok) throw new Error('Não foi possível obter a licença do Node.');
await (await import('node:fs/promises')).writeFile('desktop/runtime/LICENSE', await license.text());
await build({ targets: Platform.WINDOWS.createTarget(['nsis'], Arch.x64), config: {
  appId: 'com.codemakers.ide', productName: 'Code Makers IDE', asar: false, npmRebuild: false,
  directories: { output: 'release' }, files: ['dist/**/*', 'server/**/*', 'desktop/main.cjs', 'package.json'],
  extraResources: [{ from: 'desktop/runtime', to: 'node' }],
  win: { signAndEditExecutable: false, artifactName: 'Code-Makers-IDE-Setup-${version}.${ext}' },
  nsis: { oneClick: false, differentialPackage: false, allowToChangeInstallationDirectory: true, createDesktopShortcut: true, createStartMenuShortcut: true, deleteAppDataOnUninstall: false },
} });
