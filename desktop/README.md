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

## Publicar uma versão nova do app

Mudanças no site (telas, funções) já aparecem no app sozinhas — não precisa
de versão nova. Só precisa quando mudar algo aqui em `desktop/`
(`main.js`, `preload.js`, ícone, instalador).

1. Suba o `"version"` em `desktop/package.json` (ex.: 1.1.0 → 1.2.0).
2. Rode:
   ```
   cd desktop
   npm install
   npm run release
   ```
   Isso gera o build e copia pra `public/downloads/`:
   - `CodeSellers-Setup.exe` — instalador (é o que o site oferece)
   - `CodeSellers-Portable.exe` — versão portátil, sem instalar
   - `latest.yml` — o "aviso de versão nova" que o app lê
3. Faça commit e push na `main`. Quando o site publicar, cada app instalado
   encontra a versão nova (ao abrir e a cada 6h), baixa em segundo plano e
   instala quando a pessoa fechar o app.

A versão portátil não se atualiza sozinha — quem usa ela baixa de novo.

Em Linux, o `electron-builder` precisa do Wine para empacotar para
Windows (`apt-get install wine wine32:i386`, com `dpkg --add-architecture
i386` antes).

Para apontar para outra URL (ex.: testar localmente), rode com
`CODE_SELLERS_URL=http://localhost:5173 npm start`.
