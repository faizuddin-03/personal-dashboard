# Laptop move through the internet (Faizuddin, 2026-10-28: chose OneDrive over the
# network copy). Packs the GitHub folder and ~/.claude into two .zip files in
# OneDrive, plus import.ps1 and a how-to, so the new laptop only needs OneDrive
# and one command.
#
#   powershell -ExecutionPolicy Bypass -File scripts\migrate\export-onedrive.ps1
#
# One big file uploads far faster than ~25,000 small ones, and keeps OneDrive away
# from the .git folders. Rebuildable folders and the Claude login token are left
# out. Nothing on this laptop is changed. Delete the OneDrive folder after the
# move: it holds prod logins (deployment checklist xlsx) and run data.

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'zip-lib.ps1')
$od = $env:OneDriveCommercial
if (-not $od) { throw 'Company OneDrive not found. Sign in to OneDrive (MODE FAIR) first.' }
$out = Join-Path $od ('Laptop-move-' + (Get-Date -Format 'yyyy-MM-dd'))
New-Item -ItemType Directory -Force $out | Out-Null

$skipDirs = @('node_modules', '.next', 'test-results', 'test-results-find', 'playwright-report', '.cache')
$claudeSkip = @('cache', 'daemon', 'session-env', 'shell-snapshots', 'ide', 'paste-cache', 'pdftmp', 'chrome')

$report = foreach ($job in @(
    @{ Label = 'GitHub'; Parent = (Join-Path $env:USERPROFILE 'Documents'); Folder = 'GitHub'; Zip = 'github.zip'; Dirs = $skipDirs; Files = @() },
    @{ Label = 'Claude'; Parent = $env:USERPROFILE; Folder = '.claude'; Zip = 'claude.zip'; Dirs = $claudeSkip; Files = @('.credentials.json', '*.lock', 'daemon.status.json') })) {
  $zipPath = Join-Path $out $job.Zip
  Write-Host "`n=== Packing $($job.Label) -> $zipPath"
  $t0 = Get-Date
  $r = Write-FolderZip -Parent $job.Parent -Folder $job.Folder -ZipPath $zipPath -SkipDirs $job.Dirs -SkipFiles $job.Files -SkipLog (Join-Path $out "$($job.Zip).skipped.txt")
  '{0}: {1:N0} files, {2:N1} GB, {3} skipped, {4:N0} min' -f $job.Label, $r.Files, ((Get-Item $zipPath).Length / 1GB), $r.Skipped, ((Get-Date) - $t0).TotalMinutes
}

Copy-Item (Join-Path $PSScriptRoot 'import.ps1'), (Join-Path $PSScriptRoot 'zip-lib.ps1'), (Join-Path $PSScriptRoot 'README.md') $out -Force
$report | Tee-Object -FilePath (Join-Path $out 'contents.txt')
Write-Host "`nDone. OneDrive is now uploading $out. Wait for the green tick on the folder before using the new laptop."
