<#
Keeps the eAuto FortiClient VPN up, so eSim (JPJ / RHB / LKM) stays reachable during test runs.

FortiClient VPN 7.2 has no command-line connect, and the eAuto-VPN profile has "Always Up" /
"Auto Connect" switched off by the firewall (registry show_alwaysup=0, show_autoconnect=0).
So this does what a person would do: right-click the FortiClient tray icon and click
Connect "eAuto-VPN". The password is saved in FortiClient, so no typing is needed.

  vpn-watchdog.ps1            keep watching, check every 30 s, reconnect when the tunnel drops
  vpn-watchdog.ps1 -Once      reconnect if down, wait until eSim answers, exit 0 (up) or 1 (still down)
  vpn-watchdog.ps1 -DryRun    open the tray menu, print what it would click, close it again

Needs an unlocked screen: it opens the tray menu and clicks, so the mouse moves for ~2 s.
Log: %LOCALAPPDATA%\vpn-watchdog.log
#>
param(
  [switch]$Once,
  [switch]$DryRun,
  [string]$VpnName = "eAuto-VPN",
  [int]$Interval = 30,
  [string]$EsimHost = "172.30.202.114",
  [int]$EsimPort = 9089
)

$ErrorActionPreference = "Stop"
$LogFile = Join-Path $env:LOCALAPPDATA "vpn-watchdog.log"

Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms, System.Drawing
if (-not ("VpnWd.Native" -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
namespace VpnWd {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  public static class Native {
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint x, uint y, uint d, UIntPtr e);
    [DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, UIntPtr e);
    [DllImport("user32.dll")] public static extern IntPtr FindWindow(string c, string n);
    [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
    [DllImport("user32.dll")] public static extern int GetMenuItemCount(IntPtr m);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetMenuString(IntPtr m, uint id, StringBuilder s, int n, uint f);
    [DllImport("user32.dll")] public static extern bool GetMenuItemRect(IntPtr w, IntPtr m, uint i, out RECT r);
  }
}
'@
}
[void][VpnWd.Native]::SetProcessDPIAware()

function Log($msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Write-Host $line
  try { Add-Content -Path $LogFile -Value $line -Encoding utf8 } catch {}
}

function Notify($msg) {
  try {
    $n = New-Object System.Windows.Forms.NotifyIcon
    $n.Icon = [System.Drawing.SystemIcons]::Warning
    $n.Visible = $true
    $n.ShowBalloonTip(10000, "VPN watchdog", $msg, "Warning")
    Start-Sleep -Seconds 6
    $n.Dispose()
  } catch {}
}

function Test-Tunnel {
  $a = Get-NetAdapter -InterfaceDescription "Fortinet SSL VPN*" -ErrorAction SilentlyContinue | Select-Object -First 1
  return ($a -and $a.Status -eq "Up")
}

function Test-Esim([int]$TimeoutMs = 5000) {
  $c = New-Object System.Net.Sockets.TcpClient
  try {
    $ar = $c.BeginConnect($EsimHost, $EsimPort, $null, $null)
    if (-not $ar.AsyncWaitHandle.WaitOne($TimeoutMs)) { return $false }
    $c.EndConnect($ar); return $true
  } catch { return $false } finally { $c.Close() }
}

function Test-ScreenLocked { return [bool](Get-Process -Name LogonUI -ErrorAction SilentlyContinue) }

function Press-Escape {
  [VpnWd.Native]::keybd_event(0x1B, 0, 0, [UIntPtr]::Zero); [VpnWd.Native]::keybd_event(0x1B, 0, 2, [UIntPtr]::Zero)
  Start-Sleep -Milliseconds 250
}

function Click-At([int]$x, [int]$y, [switch]$Right) {
  [void][VpnWd.Native]::SetCursorPos($x, $y); Start-Sleep -Milliseconds 300
  if ($Right) { $down = 0x0008; $up = 0x0010 } else { $down = 0x0002; $up = 0x0004 }
  [VpnWd.Native]::mouse_event($down, 0, 0, 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 80
  [VpnWd.Native]::mouse_event($up, 0, 0, 0, [UIntPtr]::Zero)
}

# Right-clicks the FortiClient tray icon (taskbar first, then the "Show Hidden Icons" flyout)
# and returns the open menu as @{ Hmenu; Items }, or $null.
function Open-TrayMenu {
  $A = [System.Windows.Automation.AutomationElement]; $TS = [System.Windows.Automation.TreeScope]
  $T = [System.Windows.Automation.Condition]::TrueCondition; $root = $A::RootElement
  $byClass = { param($c) New-Object System.Windows.Automation.PropertyCondition($A::ClassNameProperty, $c) }
  $tray = $root.FindFirst($TS::Children, (& $byClass "Shell_TrayWnd"))
  $icon = $null
  foreach ($e in $tray.FindAll($TS::Descendants, $T)) { if ($e.Current.Name -match "^FortiClient") { $icon = $e } }
  if (-not $icon) {
    $flyout = $root.FindFirst($TS::Children, (& $byClass "TopLevelWindowForOverflowXamlIsland"))
    if (-not $flyout) {
      # "Show Hidden Icons" / "Hide Hidden Icons" depending on whether the flyout is open
      $more = $null
      foreach ($e in $tray.FindAll($TS::Descendants, $T)) { if ($e.Current.Name -match "hidden icons") { $more = $e } }
      if (-not $more) { Log "tray: no 'Show Hidden Icons' button"; return $null }
      $more.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke(); Start-Sleep -Milliseconds 1200
      $flyout = $root.FindFirst($TS::Children, (& $byClass "TopLevelWindowForOverflowXamlIsland"))
    }
    if ($flyout) { foreach ($e in $flyout.FindAll($TS::Descendants, $T)) { if ($e.Current.Name -match "^FortiClient") { $icon = $e } } }
  }
  if (-not $icon) { Log "tray: FortiClient icon not found (is FortiClient running?)"; Press-Escape; return $null }

  # The button's own rectangle is unreliable in the flyout; its image child is exact.
  $img = $icon.FindFirst($TS::Children, (New-Object System.Windows.Automation.PropertyCondition($A::ControlTypeProperty, [System.Windows.Automation.ControlType]::Image)))
  $r = if ($img) { $img.Current.BoundingRectangle } else { $icon.Current.BoundingRectangle }
  Click-At ([int]($r.X + $r.Width / 2)) ([int]($r.Y + $r.Height / 2)) -Right

  for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Milliseconds 300
    $mw = [VpnWd.Native]::FindWindow("#32768", $null)
    if ($mw -ne [IntPtr]::Zero) { break }
  }
  if ($mw -eq [IntPtr]::Zero) { Log "tray: menu did not open"; Press-Escape; return $null }
  $hm = [VpnWd.Native]::SendMessage($mw, 0x01E1, [IntPtr]::Zero, [IntPtr]::Zero)   # MN_GETHMENU
  $items = @()
  for ($i = 0; $i -lt [VpnWd.Native]::GetMenuItemCount($hm); $i++) {
    $sb = New-Object System.Text.StringBuilder 256
    [void][VpnWd.Native]::GetMenuString($hm, [uint32]$i, $sb, 256, 0x400)          # MF_BYPOSITION
    $items += $sb.ToString()
  }
  return @{ Hmenu = $hm; Items = $items }
}

# Returns $true when it clicked Connect "<VpnName>".
function Invoke-TrayConnect {
  if (Test-ScreenLocked) { Log "screen is locked: cannot click the tray menu"; return $false }
  $m = Open-TrayMenu
  if (-not $m) { return $false }
  $want = -1
  for ($i = 0; $i -lt $m.Items.Count; $i++) {
    if ($m.Items[$i] -match "^Connect" -and $m.Items[$i] -like "*$VpnName*") { $want = $i }
  }
  $shown = ($m.Items | Where-Object { $_ }) -join " | "
  if ($want -lt 0) { Log "tray menu has no Connect `"$VpnName`" item: $shown"; Press-Escape; Press-Escape; return $false }
  if ($DryRun) { Log "dry run: would click '$($m.Items[$want])' (menu: $shown)"; Press-Escape; Press-Escape; return $false }
  $rc = New-Object VpnWd.RECT
  if (-not [VpnWd.Native]::GetMenuItemRect([IntPtr]::Zero, $m.Hmenu, [uint32]$want, [ref]$rc)) {
    Log "tray: could not locate '$($m.Items[$want])'"; Press-Escape; Press-Escape; return $false
  }
  Click-At ([int](($rc.Left + $rc.Right) / 2)) ([int](($rc.Top + $rc.Bottom) / 2))
  Log "clicked '$($m.Items[$want])'"
  return $true
}

# One reconnect attempt: click, then wait for the tunnel and eSim. Returns $true when eSim answers.
function Connect-Vpn {
  $mutex = New-Object System.Threading.Mutex($false, "Local\eauto-vpn-watchdog-click")
  if (-not $mutex.WaitOne(0)) { Log "another watchdog is clicking; waiting for it"; [void]$mutex.WaitOne(120000) ; $mutex.ReleaseMutex(); return (Test-Esim) }
  try {
    if (Test-Tunnel) { return (Test-Esim) }
    if (-not (Invoke-TrayConnect)) { return $false }
    for ($i = 0; $i -lt 30; $i++) { Start-Sleep -Seconds 2; if (Test-Tunnel) { break } }
    if (-not (Test-Tunnel)) { Log "tunnel still down 60 s after Connect (password prompt or OTP on screen?)"; return $false }
    for ($i = 0; $i -lt 10; $i++) { if (Test-Esim) { return $true }; Start-Sleep -Seconds 3 }
    Log "tunnel is up but eSim ($EsimHost`:$EsimPort) does not answer"
    return $false
  } finally { $mutex.ReleaseMutex() }
}

if ($DryRun) { [void](Invoke-TrayConnect); exit 0 }

if ($Once) {
  if ((Test-Tunnel) -and (Test-Esim)) { exit 0 }
  for ($try = 1; $try -le 3; $try++) {
    Log "VPN down (attempt $try/3): reconnecting $VpnName"
    if (Connect-Vpn) { Log "VPN back up, eSim answers"; exit 0 }
    Start-Sleep -Seconds 10
  }
  Notify "Could not reconnect $VpnName. Please connect FortiClient by hand."
  exit 1
}

Log "watching $VpnName every $Interval s (stop: close this window or kill the process)"
$fails = 0
while ($true) {
  if (-not (Test-Tunnel)) {
    Log "VPN down: reconnecting $VpnName"
    if (Connect-Vpn) { Log "VPN back up, eSim answers"; $fails = 0 }
    else {
      $fails++
      if ($fails -eq 3) { Notify "Could not reconnect $VpnName after 3 tries. Please connect FortiClient by hand." }
      if ($fails -ge 3) { Start-Sleep -Seconds 300; continue }
    }
  }
  Start-Sleep -Seconds $Interval
}
