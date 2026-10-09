// Comando para executar o arquivo atual no terminal, conforme a extensão.
const quote = (path: string) => `"${path.replace(/"/g, '""')}"`;
export function commandForFile(path: string): string | null {
  const file = path.replace(/^\//, ''); const q = quote(file);
  const ext = (file.split('.').at(-1) || '').toLowerCase();
  const table: Record<string, string> = {
    js: `node ${q}`, mjs: `node ${q}`, cjs: `node ${q}`, ts: `npx --yes tsx ${q}`, tsx: `npx --yes tsx ${q}`,
    py: `python ${q}`, java: `java ${q}`, go: `go run ${q}`, rb: `ruby ${q}`, php: `php ${q}`, lua: `lua ${q}`, pl: `perl ${q}`, r: `Rscript ${q}`, dart: `dart run ${q}`,
    sh: `bash ${q}`, ps1: `powershell -File ${q}`, bat: `${q}`, cmd: `${q}`, kts: `kotlin ${q}`, swift: `swift ${q}`, rs: `rustc ${q} -o out && ./out`, c: `gcc ${q} -o out && ./out`, cpp: `g++ ${q} -o out && ./out`, cs: `dotnet run`,
  };
  return table[ext] || null;
}
