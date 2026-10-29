' Starts a study agent with no console window (used by Windows Task Scheduler).
' Usage: wscript.exe run-hidden.vbs <agent-id>
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
root = fso.GetParentFolderName(fso.GetParentFolderName(scriptDir))
logDir = root & "\data\agents\logs"
If Not fso.FolderExists(root & "\data\agents") Then fso.CreateFolder(root & "\data\agents")
If Not fso.FolderExists(logDir) Then fso.CreateFolder(logDir)
agent = WScript.Arguments(0)
sh.CurrentDirectory = root
cmd = "cmd /c node """ & scriptDir & "\run-agent.mjs"" " & agent & " >> """ & logDir & "\" & agent & ".log"" 2>&1"
sh.Run cmd, 0, True
