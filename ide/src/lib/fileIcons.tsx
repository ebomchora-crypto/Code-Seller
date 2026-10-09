import { File, FileCode2, FileJson, FileText, FileImage, FileTerminal, Folder, FolderOpen, Settings2, Palette, Globe, Braces, Database, Lock, Package } from 'lucide-react';
import type { ReactElement } from 'react';

type IconSpec = { Icon: typeof File; color: string };
const byExtension: Record<string, IconSpec> = {
  ts: { Icon: FileCode2, color: '#3b9cdb' }, tsx: { Icon: FileCode2, color: '#3b9cdb' },
  js: { Icon: FileCode2, color: '#e5c07b' }, jsx: { Icon: FileCode2, color: '#e5c07b' }, mjs: { Icon: FileCode2, color: '#e5c07b' }, cjs: { Icon: FileCode2, color: '#e5c07b' },
  json: { Icon: FileJson, color: '#cbcb41' }, css: { Icon: Palette, color: '#56a4e6' }, scss: { Icon: Palette, color: '#e06c9f' },
  html: { Icon: Globe, color: '#e8744f' }, md: { Icon: FileText, color: '#7aa6da' }, txt: { Icon: FileText, color: '#9d9d9d' },
  py: { Icon: FileCode2, color: '#5aa2d6' }, go: { Icon: FileCode2, color: '#4ec9d4' }, rs: { Icon: FileCode2, color: '#d0866a' }, java: { Icon: FileCode2, color: '#e07c7c' },
  sh: { Icon: FileTerminal, color: '#89d185' }, ps1: { Icon: FileTerminal, color: '#5aa2d6' }, yml: { Icon: Settings2, color: '#c586c0' }, yaml: { Icon: Settings2, color: '#c586c0' },
  svg: { Icon: FileImage, color: '#e5c07b' }, png: { Icon: FileImage, color: '#a074c4' }, jpg: { Icon: FileImage, color: '#a074c4' }, jpeg: { Icon: FileImage, color: '#a074c4' }, gif: { Icon: FileImage, color: '#a074c4' }, webp: { Icon: FileImage, color: '#a074c4' },
  sql: { Icon: Database, color: '#d19a66' }, xml: { Icon: Braces, color: '#e8744f' }, env: { Icon: Lock, color: '#cbcb41' },
};
const byName: Record<string, IconSpec> = {
  'package.json': { Icon: Package, color: '#89d185' }, 'package-lock.json': { Icon: Lock, color: '#9d9d9d' },
  'tsconfig.json': { Icon: Settings2, color: '#3b9cdb' }, '.gitignore': { Icon: Settings2, color: '#9d9d9d' }, dockerfile: { Icon: Settings2, color: '#56a4e6' },
};
export function iconSpec(name: string): IconSpec {
  const lower = name.toLowerCase();
  return byName[lower] || byExtension[lower.split('.').at(-1) || ''] || { Icon: File, color: '#9d9d9d' };
}
export function FileIcon({ name, size = 16 }: { name: string; size?: number }): ReactElement {
  const { Icon, color } = iconSpec(name);
  return <Icon size={size} color={color} className="shrink-0" strokeWidth={1.6} />;
}
export function FolderIcon({ open, size = 16 }: { open: boolean; size?: number }): ReactElement {
  const Icon = open ? FolderOpen : Folder;
  return <Icon size={size} color="#c09553" className="shrink-0" strokeWidth={1.6} />;
}
