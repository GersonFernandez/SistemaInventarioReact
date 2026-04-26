param(
    [switch]$SkipInstall,
    [switch]$SkipMigrate
)

$ErrorActionPreference = 'Stop'

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $rootPath 'backend'

if (-not (Test-Path $backendPath)) {
    throw "No se encontro la carpeta backend en: $backendPath"
}

$pythonCandidates = @(
    (Join-Path $backendPath '.venv314\Scripts\python.exe'),
    (Join-Path $backendPath '.venv\Scripts\python.exe')
)

$pythonExe = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $pythonExe) {
    throw 'No se encontro un entorno virtual (.venv314 o .venv) en backend. Crea uno con: py -3.14 -m venv backend\.venv314'
}

Write-Host "Usando Python: $pythonExe" -ForegroundColor Cyan

if (-not $SkipInstall) {
    Write-Host 'Instalando/actualizando dependencias de backend...' -ForegroundColor Yellow
    & $pythonExe -m pip install -r (Join-Path $backendPath 'requirements.txt')
}

if (-not $SkipMigrate) {
    Write-Host 'Aplicando migraciones...' -ForegroundColor Yellow
    & $pythonExe (Join-Path $backendPath 'manage.py') migrate
}

Write-Host 'Iniciando backend en nueva terminal...' -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$backendPath'; & '$pythonExe' manage.py runserver 8000"
)

Write-Host 'Iniciando frontend en nueva terminal...' -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$rootPath'; npm install; npm run dev"
)

Write-Host 'Listo. Abre:' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:5173' -ForegroundColor White
Write-Host 'Backend:  http://127.0.0.1:8000' -ForegroundColor White
Write-Host ''
Write-Host 'Opciones utiles:' -ForegroundColor DarkCyan
Write-Host '  .\run-local.ps1 -SkipInstall -SkipMigrate' -ForegroundColor DarkGray
