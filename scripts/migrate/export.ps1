# Laptop move, step 1 (OLD laptop). Copies the GitHub folder and Claude Code's
# ~/.claude over the network to a shared folder on the NEW laptop
# (Faizuddin, 2026-10-28: moving everything to a new laptop, network copy).
#
#   powershell -ExecutionPolicy Bypass -File scripts\migrate\export.ps1 -Dest \\NEW-LAPTOP\migrate
#
# Safe to run again: robocopy only sends files that changed, so a second run
# after a cut connection picks up where it stopped. Nothing on this laptop is
# changed or deleted. Rebuildable folders (node_modules, .next, test-results,
# playwright-report, .cache) and the Claude login token are left out.
param([Parameter(Mandatory)][string]$Dest)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Dest)) { throw "Cannot reach $Dest. Check the share name and that both laptops are on the same network." }

$gh     = Join-Path $env:USERPROFILE 'Documents\GitHub'
$claude = Join-Path $env:USERPROFILE '.claude'
$logDir = Join-Path $Dest '_logs'
New-Item -ItemType Directory -Force $logDir | Out-Null

# Files that change while the dashboard or Claude is running would copy half-written.
$busy = Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='claude.exe'" | Where-Object { $_.CommandLine -match 'next|claude|pipeline' -and $_.ProcessId -ne $PID }
if ($busy) { Write-Warning "Dashboard / Claude processes still running ($($busy.Count)). Stop the dev server and close other Claude sessions, then run this again for a clean copy." }

$common = @('/E', '/Z', '/MT:16', '/R:2', '/W:5', '/NP', '/NFL', '/NDL', '/XJ')
$skipDirs = @('node_modules', '.next', 'test-results', 'test-results-find', 'playwright-report', '.cache')

function Copy-Tree($from, $to, $name, $xd, $xf) {
  Write-Host "`n=== $name : $from -> $to"
  $rc = @($from, $to) + $common + @('/XD') + $xd + @("/LOG:$logDir\$name.log", '/TEE')
  if ($xf) { $rc += @('/XF') + $xf }
  & robocopy @rc | Select-Object -Last 12
  if ($LASTEXITCODE -ge 8) { Write-Warning "$name : some files failed (robocopy code $LASTEXITCODE). See $logDir\$name.log" }
}

Copy-Tree $gh (Join-Path $Dest 'GitHub') 'github' $skipDirs $null
Copy-Tree $claude (Join-Path $Dest 'dot-claude') 'claude' `
  @('cache', 'daemon', 'session-env', 'shell-snapshots', 'ide', 'paste-cache', 'pdftmp', 'chrome') `
  @('.credentials.json', 'daemon.lock', 'daemon.status.json', '*.lock')

# Count check: what was meant to go vs what arrived.
function Count($p, $xd) {
  $rx = '\\(' + (($xd | ForEach-Object { [regex]::Escape($_) }) -join '|') + ')\\'
  (Get-ChildItem -LiteralPath $p -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch $rx }).Count
}
$src = Count $gh $skipDirs
$dst = Count (Join-Path $Dest 'GitHub') $skipDirs
"GitHub files: here $src, copied $dst" | Tee-Object (Join-Path $logDir 'count.txt')
if ($dst -lt $src) { Write-Warning 'Fewer files arrived than expected. Run the script again; it only sends what is missing.' }
else { Write-Host "`nDone. Next: on the NEW laptop run scripts\migrate\import.ps1 (see scripts\migrate\README.md)." }
