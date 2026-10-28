# Moving to a new laptop (network copy)

Written 2026-10-28. Old laptop: MTOG-IT-LT-0023. Dry run: GitHub 21,792 files / 9.6 GB,
`.claude` 3,909 files / 1.0 GB, 0 failures.

## 1. New laptop: prepare

1. Sign in to Windows as **Faizuddin**. Claude's memory is stored under a folder named after
   `C:\Users\Faizuddin\Documents\GitHub\personal-dashboard`, so the repo must sit at that same path.
2. Install Node 24 and Git, plus Claude Code if you use it.
3. Create the folder `C:\migrate`. Right-click it → Properties → Sharing → Advanced Sharing →
   Share this folder → Permissions → Add → type `Everyone` → Check Names → **Full Control**.
   The share name is `migrate`. Your own account does not appear in Check Names on a company (Azure AD)
   laptop; `Everyone` still asks for the Windows login. Alternative, admin terminal:
   `New-Item -ItemType Directory C:\migrate -Force; New-SmbShare -Name migrate -Path C:\migrate -FullAccess $env:USERNAME`
   Set the network profile to **Private**.
4. Get the computer name from Settings → System → About, for example `NEW-LAPTOP`.

## 2. Old laptop: copy

1. Stop the dashboard dev server and close the other Claude sessions.
2. Run:
   `powershell -ExecutionPolicy Bypass -File scripts\migrate\export.ps1 -Dest \\NEW-LAPTOP\migrate`
3. Over a cable this takes about 5 to 10 minutes. Over Wi-Fi it can take 30 to 60 minutes.
   If the copy breaks, run the same command again; it only sends what is missing.
4. Logs are in `\\NEW-LAPTOP\migrate\_logs`. Check that `count.txt` shows matching numbers.

## 3. New laptop: put in place

1. Run:
   `powershell -ExecutionPolicy Bypass -File C:\migrate\GitHub\personal-dashboard\scripts\migrate\import.ps1 -Source C:\migrate`
2. This puts the files in `Documents\GitHub` and `.claude`, runs `npm ci` in every project,
   and installs the Playwright Chromium browser.
3. WhatsApp repos are copied but not installed.
4. Start the dashboard: `cd Documents\GitHub\personal-dashboard` then `npm run dev`.

## 4. By hand (scripts cannot do these)

1. Log in to Claude Code with `claude`, then `/login`. The login token is not copied on purpose.
2. Chrome:
   a. Sign in so bookmarks and passwords sync.
   b. Install the Claude in Chrome extension.
   c. Sign in to Mailtrap.
3. Sign in again to Jira, Teams, Miro, BO and SharePoint.
4. Sign in to OneDrive (MODE FAIR). It syncs `eAuto Documents` by itself.
5. Run `git config --global user.name faizuddin-03` and `git config --global user.email faizuddin@modefair.com`.
   The first `git push` asks for a GitHub login.
6. Scheduled task `ClaudeEODHandoff` was disabled on the old laptop. Recreate it only if you still want it.
7. Turn on long paths, because some test-evidence names are too long. As admin, run:
   `reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1 /f`
8. Keep the old laptop until the dashboard, one automation run and Claude memory are checked on the new one.
   After that, remove the `migrate` share.

## Internet route instead (OneDrive) — chosen 2026-10-28

1. Old laptop: `powershell -ExecutionPolicy Bypass -File scripts\migrate\export-onedrive.ps1`
   packs `github.zip` + `claude.zip` (plus import.ps1, zip-lib.ps1, this README, contents.txt; tar.exe crashed, so .NET zip) into
   `OneDrive - MODE FAIR SDN BHD\Laptop-move-<date>`. Wait for OneDrive's green tick on that folder.
2. New laptop: sign in to OneDrive, then in PowerShell:
   `powershell -ExecutionPolicy Bypass -File "$env:OneDriveCommercial\Laptop-move-2026-10-28\import.ps1"`
   It unpacks into Documents\GitHub and .claude (keeps any file already there) and installs everything.
3. Do section 4 above, then **delete the Laptop-move folder from OneDrive**: it holds prod logins.
