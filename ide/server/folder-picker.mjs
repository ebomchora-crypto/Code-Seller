import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fail } from './repository.mjs';
let picking = false;
export async function pickFolder(description = 'Abrir pasta na Code Makers IDE') {
  if (process.platform !== 'win32') throw fail('Informe o caminho completo da pasta neste sistema.', 400);
  if (picking) throw fail('A janela de seleção de pasta já está aberta.', 409);
  picking = true;
  try {
    const script = 'Add-Type -AssemblyName System.Windows.Forms; $picker = New-Object System.Windows.Forms.FolderBrowserDialog; $picker.Description = $env:CM_PICKER_TEXT; $picker.ShowNewFolderButton = $true; if ($picker.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::Write($picker.SelectedPath) }; $picker.Dispose()';
    const result = await promisify(execFile)('powershell.exe', ['-NoProfile', '-STA', '-WindowStyle', 'Hidden', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, timeout: 180000, env: { ...process.env, CM_PICKER_TEXT: description }, maxBuffer: 16384, encoding: 'utf8' });
    return result.stdout.replace(/^\uFEFF/, '').trim();
  } catch { throw fail('Não foi possível usar a janela de pastas. Informe o caminho completo manualmente.', 400); }
  finally { picking = false; }
}
