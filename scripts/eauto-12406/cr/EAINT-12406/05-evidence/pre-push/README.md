# EAINT-12406 - BEFORE halves, 28.10.2026

BEFORE half of the pre-deploy TS, run on Secarang staging /ia/ and CIBO staging /cibo before Dev deploys EAINT-12406
(Azfar 28.10.2026: "for any of ts that you need to run before deployment you may run it now"). One folder per TS, each
with its note (`<TS>_note.md`), screenshots `<TS>_<point>_<what>.png`, one video `video_<TS>.webm`, a run log, and
receipts in `downloadable (before)/`. No result is given here: the TS result comes after the AFTER half.

| TS | Points captured | Blocked |
|---|---|---|
| 12406_CP_TS8 | E1, E3, E4, E5 (+ page texts for E6) | E2: no quotation with the made-up IC |
| 12406_QT_TS3 | E1 (made-up SSM: "unable to retrieve" pop-up) | real-company answer (Q12 / Q40) |
| 12406_RC_TS8 | E1, E2 | - |
| 12406_RG_TS1 | E1, E2 | - |
| 12406_RG_TS2 | E1 | - |
| 12406_RG_TS3 | E1 | - |

12406_RG_TS4 is deprioritised (Azfar, 28.10.2026) and was not run.

Personal data: `*PERSONAL-DATA*` files and the four CIBO videos (RC_TS8, RG_TS1-TS3) show customers' details and are
kept out of git by `.gitignore`. Never put them on a board or Jira as they are.

Scripts: `cr/EAINT-12406/03-spec/before-run/ts-before.mjs <TS>`; AFTER half: `PHASE=after EVID_DIR=<new folder>`.
