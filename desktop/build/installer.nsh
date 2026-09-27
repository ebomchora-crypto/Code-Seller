; Registra o protocolo codesellers:// no Windows (por usuário, sem precisar
; de admin — combina com perMachine: false). É por aqui que o navegador
; devolve a sessão pro app depois do login (ver desktop/main.js e
; src/router/RootRoute.tsx no site).

!macro customInstall
  WriteRegStr HKCU "Software\Classes\codesellers" "" "URL:Code Sellers"
  WriteRegStr HKCU "Software\Classes\codesellers" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\codesellers\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr HKCU "Software\Classes\codesellers\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\codesellers"
!macroend
