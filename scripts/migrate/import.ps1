# Laptop move, step 2 (NEW laptop). Puts the copied folders in place and
# reinstalls what export.ps1 left out.
#
#   powershell -ExecutionPolicy Bypass -File C:\migrate\GitHub\personal-dashboard\scripts\migrate\import.ps1 -Source C:\migrate
#
# Never overwrites a newer file already on this laptop, and never touches
# ~/.claude/.credentials.json (log in to Claude Code yourself).
# From OneDrive: no -Source needed when this file sits next to github.tar.
param([string]$Source = $PSScriptRoot, [switch]$SkipInstall)

$ErrorActionPreference = 'Stop'
# Claude's memory folder is named after the repo path; a different user folder means memory will not load.
if ($env:USERNAME -ne 'Faizuddin') { Write-Warning "Windows user is '$env:USERNAME', not 'Faizuddin'. Claude memory and session history will not match this path." }

$gh     = Join-Path $env:USERPROFILE 'Documents\GitHub'
$claude = Join-Path $env:USERPROFILE '.claude'
if (Test-Path (Join-Path $Source 'github.zip')) {
  # OneDrive route (export-onedrive.ps1). Files already on this laptop are kept.
  . (Join-Path $Source 'zip-lib.ps1')
  New-Item -ItemType Directory -Force (Split-Path $gh) | Out-Null
  foreach ($pair in @(@('github.zip', (Split-Path $gh)), @('claude.zip', $env:USERPROFILE))) {
    Write-Host "`n=== Unpacking $($pair[0]) -> $($pair[1])  (OneDrive downloads it first if needed)"
    $n = Expand-ZipKeepExisting -ZipPath (Join-Path $Source $pair[0]) -Dest $pair[1]
    Write-Host "  $n files unpacked"
  }
} else {
  # Network route (export.ps1).
  foreach ($p in 'GitHub', 'dot-claude') { if (-not (Test-Path (Join-Path $Source $p))) { throw "$Source\$p not found. Run export.ps1 or export-onedrive.ps1 on the old laptop first." } }
  $common = @('/E', '/Z', '/MT:16', '/R:2', '/W:5', '/NP', '/NFL', '/NDL', '/XO')
  & robocopy (Join-Path $Source 'GitHub') $gh @common | Select-Object -Last 12
  & robocopy (Join-Path $Source 'dot-claude') $claude @common /XF .credentials.json | Select-Object -Last 12
}

git config --global core.longpaths true

if ($SkipInstall) { return }
# Rebuild node_modules from each lock file, then the Playwright browser.
$projects = @(Get-ChildItem $gh -Directory) + @(Get-ChildItem (Join-Path $gh 'personal-dashboard\scripts') -Directory) |
  Where-Object { Test-Path (Join-Path $_.FullName 'package.json') } |
  Where-Object { $_.Name -notmatch 'WhatsApp|whatsapp|WA-Blaster' }
foreach ($p in $projects) {
  Write-Host "`n=== npm install: $($p.FullName)"
  Push-Location $p.FullName
  try { if (Test-Path package-lock.json) { npm ci --no-audit --no-fund } else { npm install --no-audit --no-fund } }
  catch { Write-Warning "$($p.Name): npm failed - $_" }
  finally { Pop-Location }
}
Push-Location (Join-Path $gh 'personal-dashboard\scripts\eauto-12257'); npx playwright install chromium; Pop-Location

Write-Host "`nDone. Start the dashboard: cd $gh\personal-dashboard; npm run dev. Then work through the manual list in scripts\migrate\README.md."
