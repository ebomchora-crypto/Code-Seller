# Code Sellers — app de Windows

Não é um app separado: é uma janela nativa (Electron) que abre
`https://codesellers.vercel.app` de verdade. Sem SQLite local — login,
sessão e todos os dados continuam vindo do Supabase, exatamente como na
web. A sessão fica salva na pasta do usuário (como um navegador), então
quem já entrou uma vez continua conectado ao abrir o app de novo.

## Rodar em desenvolvimento

```
cd desktop
npm install
npm start
```

## Gerar o instalador (.exe)

```
cd desktop
npm install
npm run dist:win
```

Gera em `desktop/release/`:
- `Code Sellers Setup <versão>.exe` — instalador (NSIS)
- `CodeSellers-portable.exe` — versão portátil, sem instalar

Em Linux, o `electron-builder` precisa do Wine para empacotar para
Windows (`apt-get install wine wine32:i386`, com `dpkg --add-architecture
i386` antes).

Para apontar para outra URL (ex.: testar localmente), rode com
`CODE_SELLERS_URL=http://localhost:5173 npm start`.
