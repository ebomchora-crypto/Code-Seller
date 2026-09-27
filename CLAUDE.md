# Regras do projeto Code Sellers

## Deploy
- Sempre que mexer em algo, publicar: push na `main` (o Vercel publica o site sozinho). Funções do servidor são publicadas à parte.

## App de Windows (`desktop/`)
- Toda versão nova do app TEM que atualizar também o arquivo dos botões "Baixar app" do site. Nunca publicar só um dos dois.
- Os botões de baixar (landing, menu lateral do painel) apontam para `/downloads/CodeSellers-Setup.exe` e `/downloads/CodeSellers-Portable.exe`, que são os mesmos arquivos que a atualização automática usa (`/downloads/latest.yml`).
- Processo de versão nova: subir `"version"` em `desktop/package.json` → `cd desktop && npm run release` (gera o build e copia instalador, portátil e `latest.yml` para `public/downloads/`) → commit dos três arquivos juntos → push na `main`.
- Antes do push, conferir que o sha512 do `CodeSellers-Setup.exe` bate com o `latest.yml`.
- Mudanças só no site não precisam de versão nova do app: o app carrega o site ao vivo.

## Textos na tela
- Nunca mencionar Supabase, Vercel, Apify ou qualquer provedor/API externo em algo que o usuário veja (telas, changelog, propriedades do .exe).
