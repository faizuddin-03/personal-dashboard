# Zip helpers for the laptop move (export-onedrive.ps1 / import.ps1).
# Windows tar.exe crashed (0xC0000005) part-way through personal-dashboard and
# WhatsApp-Blaster-Test-Automation on 2026-10-28, so this uses .NET's zip instead.
# Locked or unreadable files are skipped and listed, never fatal.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

function Write-FolderZip {
  param([string]$Parent, [string]$Folder, [string]$ZipPath, [string[]]$SkipDirs, [string[]]$SkipFiles, [string]$SkipLog)
  $root = Join-Path $Parent $Folder
  $stream = [IO.File]::Open($ZipPath, 'Create')
  $zip = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
  $count = 0; $skipped = New-Object System.Collections.Generic.List[string]
  $stack = New-Object System.Collections.Generic.Stack[string]; $stack.Push($root)
  try {
    while ($stack.Count) {
      $dir = $stack.Pop()
      foreach ($sub in [IO.Directory]::EnumerateDirectories($dir)) {
        $name = [IO.Path]::GetFileName($sub)
        if ($SkipDirs -contains $name) { continue }
        if (([IO.File]::GetAttributes($sub) -band [IO.FileAttributes]::ReparsePoint)) { continue }
        $stack.Push($sub)
      }
      foreach ($file in [IO.Directory]::EnumerateFiles($dir)) {
        $name = [IO.Path]::GetFileName($file)
        if ($SkipFiles | Where-Object { $name -like $_ }) { continue }
        $entryName = $Folder + '/' + $file.Substring($root.Length + 1).Replace('\', '/')
        try {
          $src = [IO.File]::Open($file, 'Open', 'Read', 'ReadWrite')
          try {
            $entry = $zip.CreateEntry($entryName, [IO.Compression.CompressionLevel]::Fastest)
            $entry.LastWriteTime = [IO.File]::GetLastWriteTime($file)
            $dst = $entry.Open(); try { $src.CopyTo($dst) } finally { $dst.Dispose() }
            $count++
          } finally { $src.Dispose() }
        } catch { $skipped.Add("$file : $($_.Exception.Message)") }
        if ($count % 2000 -eq 0 -and $count) { Write-Host "  $count files..." }
      }
    }
  } finally { $zip.Dispose(); $stream.Dispose() }
  if ($skipped.Count) { $skipped | Set-Content -Encoding utf8 $SkipLog }
  [pscustomobject]@{ Files = $count; Skipped = $skipped.Count }
}

function Expand-ZipKeepExisting {
  param([string]$ZipPath, [string]$Dest)
  $zip = [IO.Compression.ZipFile]::OpenRead($ZipPath)
  $n = 0
  try {
    foreach ($e in $zip.Entries) {
      $target = Join-Path $Dest ($e.FullName.Replace('/', '\'))
      if ($e.FullName.EndsWith('/') -or [IO.File]::Exists($target)) { continue }
      [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target))
      [IO.Compression.ZipFileExtensions]::ExtractToFile($e, $target)
      [IO.File]::SetLastWriteTime($target, $e.LastWriteTime.DateTime)
      $n++
      if ($n % 2000 -eq 0) { Write-Host "  $n files..." }
    }
  } finally { $zip.Dispose() }
  $n
}
