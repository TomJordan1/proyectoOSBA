; Instalador de Kandace (Inno Setup)
; Genera KandaceSetup.exe: instala la app, crea accesos directos (escritorio + menú
; Inicio), desinstalador y, opcionalmente, arranque con Windows. Instalación por usuario
; (sin permisos de administrador).
;
; Requisitos previos (una sola vez):
;   1) Publicar el agente:  (desde desktop-agent)
;        dotnet publish src\Laminar.App\Laminar.App.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o publish
;   2) Instalar Inno Setup:  https://jrsoftware.org/isdl.php
;   3) Abrir este archivo en Inno Setup y pulsar "Compile" (o clic derecho -> Compile).
;      El resultado queda en installer\Output\KandaceSetup.exe

#define AppName "Kandace"
#define AppVersion "1.0.0"
#define AppExe "Kandace.exe"

[Setup]
AppId={{9F3B7C1E-4B2A-4C7D-9E11-A1B2C3D4E5F6}}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Kandace
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=Output
OutputBaseFilename=KandaceSetup
SetupIconFile=..\src\Laminar.App\kandace.ico
UninstallDisplayIcon={app}\{#AppExe}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear un acceso directo en el escritorio"; GroupDescription: "Accesos directos:"
Name: "startupicon"; Description: "Iniciar Kandace automáticamente al encender Windows"; GroupDescription: "Inicio:"; Flags: unchecked

[Files]
; Toma todo lo publicado (el .exe self-contained y cualquier archivo acompañante).
Source: "..\publish\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{group}\Desinstalar {#AppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon
Name: "{userstartup}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: startupicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "Iniciar {#AppName} ahora"; Flags: nowait postinstall skipifsilent
