// Copia o build do app pra pasta de downloads do site. Publicar o site
// (push na main) publica também a atualização: o app instalado lê o
// latest.yml de /downloads e se atualiza sozinho.
import { copyFileSync } from 'node:fs'
import { join } from 'node:path'

const release = new URL('../release/', import.meta.url).pathname
const downloads = new URL('../../public/downloads/', import.meta.url).pathname

for (const file of ['CodeSellers-Setup.exe', 'CodeSellers-Portable.exe', 'latest.yml']) {
  copyFileSync(join(release, file), join(downloads, file))
  console.log(`copiado: public/downloads/${file}`)
}
