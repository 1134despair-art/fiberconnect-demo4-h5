param(
  [int]$Port = 8081
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$listeners = @(
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
)

if ($listeners.Count -eq 0) {
  Write-Host "Port $Port is available."
  exit 0
}

foreach ($ownerProcessId in $listeners) {
  $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $ownerProcessId" -ErrorAction SilentlyContinue
  $processName = if ($owner) { $owner.Name } else { 'unknown' }
  $commandLine = if ($owner -and $owner.CommandLine) { $owner.CommandLine } else { '' }
  $isCurrentProjectVite =
    $commandLine.IndexOf($projectRoot, [System.StringComparison]::OrdinalIgnoreCase) -ge 0 -and
    $commandLine.IndexOf('vite', [System.StringComparison]::OrdinalIgnoreCase) -ge 0

  Write-Host "Port $Port is used by PID $ownerProcessId ($processName)."
  if ($commandLine) {
    Write-Host "Command: $commandLine"
  }

  if (-not $isCurrentProjectVite) {
    Write-Error "Port $Port belongs to another process. Stop it explicitly or choose another port."
  }

  Write-Host 'Stopping the previous Vite process for this project...'
  Stop-Process -Id $ownerProcessId -Force
}

for ($attempt = 0; $attempt -lt 20; $attempt++) {
  $remaining = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $remaining) {
    Write-Host "Port $Port has been released."
    exit 0
  }

  Start-Sleep -Milliseconds 100
}

Write-Error "Port $Port was not released in time."
