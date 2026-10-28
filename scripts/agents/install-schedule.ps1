# Registers the two scheduled study agents in Windows Task Scheduler
# (Faizuddin, 2026-10-27). Runs only while Faizuddin is logged in, Mon-Fri:
#   Jira Scout        every hour,    08:00-18:00 starts
#   SharePoint Scribe every 2 hours, 08:00-18:00 starts
# The runner also refuses to start outside Mon-Fri 08:00-19:00.
# Remove with:  powershell -File scripts\agents\install-schedule.ps1 -Remove
param([switch]$Remove)

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$vbs  = Join-Path $PSScriptRoot "run-hidden.vbs"
$tasks = @(
  @{ Name = "Udin's Board - Jira Scout";        Agent = "jira-study";       Every = 1 },
  @{ Name = "Udin's Board - SharePoint Scribe"; Agent = "sharepoint-study"; Every = 2 }
)

foreach ($t in $tasks) {
  if (Get-ScheduledTask -TaskName $t.Name -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $t.Name -Confirm:$false
  }
  if ($Remove) { Write-Output "Removed: $($t.Name)"; continue }

  $action  = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$vbs`" $($t.Agent)" -WorkingDirectory $root
  # One weekly trigger at 08:00 Mon-Fri, repeating until the last start before 19:00.
  $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At "08:00"
  $rep     = New-ScheduledTaskTrigger -Once -At "08:00" -RepetitionInterval (New-TimeSpan -Hours $t.Every) -RepetitionDuration (New-TimeSpan -Hours 10 -Minutes 30)
  $trigger.Repetition = $rep.Repetition
  $settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
  Register-ScheduledTask -TaskName $t.Name -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
    -Description "Udin's Board study agent ($($t.Agent)). See scripts/agents/run-agent.mjs." | Out-Null
  Write-Output "Registered: $($t.Name) (every $($t.Every) h, Mon-Fri 08:00-18:00 starts)"
}
