export function workspaceInfo(files: Record<string, string>) {
  const paths = Object.keys(files); const tools: string[] = [];
  if (files['/package.json']) {
    try { const pkg = JSON.parse(files['/package.json']); const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }; const framework = ['next', 'nuxt', '@angular/core', 'svelte', 'vue', 'vite', 'react', 'express'].find(name => dependencies[name]); tools.push(framework ? `Node.js · ${framework}` : 'Node.js'); } catch { tools.push('Node.js · package.json inválido'); }
  }
  if (paths.some(path => /\.py$|\/pyproject\.toml$|\/requirements.*\.txt$/.test(path))) tools.push('Python');
  if (files['/go.mod'] || paths.some(path => path.endsWith('.go'))) tools.push('Go');
  if (files['/Cargo.toml']) tools.push('Rust · Cargo');
  if (paths.some(path => /\.(csproj|fsproj|sln)$/.test(path))) tools.push('.NET');
  if (files['/pom.xml'] || files['/build.gradle'] || paths.some(path => path.endsWith('.java'))) tools.push('Java');
  if (files['/composer.json']) tools.push('PHP · Composer');
  if (files['/CMakeLists.txt'] || paths.some(path => /\.(c|cpp|h)$/.test(path))) tools.push('C / C++');
  if (files['/Dockerfile'] || files['/compose.yaml'] || files['/docker-compose.yml']) tools.push('Docker');
  return tools.length ? tools.join(' · ') : 'Workspace livre';
}
