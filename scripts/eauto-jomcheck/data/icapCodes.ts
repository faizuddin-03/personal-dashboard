// EAINT-12339 SRD v1.0 §2.2.5 — ClaimsType (ICAP code) → the exact "Type of
// Claim" text eAuto displays. Shared by TS21 (every code mapped exactly) and
// TS18 (a live value must be one of these descriptions, or "-").
export const ICAP_DESCRIPTIONS: [string, string][] = [
  ['1', 'Own Damage (OD)'],
  ['2', 'Own Damage - KFK (OD-KFK)'],
  ['3', 'Own Damage - Theft from Vehicle (OD-TFV)'],
  ['4', 'Own Damage - Theft Recovered (OD-TFR)'],
  ['5', 'Third Party - KFK (TP-KFK)'],
  ['6', 'ODKFK/Third Party - Uninsured Losses (TP-UL)'],
  ['7', 'Third Party - Vehicle Damage (TP-VD)'],
  ['8', 'Third Party Property Damage (TP-PD)'],
  ['9', 'Third Party Bodily Injury (TP-BI)'],
  ['10', 'Third Party - Subrogation (TP-SB)'],
  ['11', 'Windscreen (WS)'],
  ['12', 'Extended Warranty (EXW)'],
  ['13', 'Lost-of-Use (LOU)'],
  ['14', 'Theft of Vehicle (TOV)'],
  ['15', 'Own Damage - Constructive Total Loss (OD-CTL)'],
  ['16', 'Own Damage - Actual Total Loss (OD-ATL)'],
  ['17', 'Own Damage - Contract Repairs (OD-CR)'],
  ['18', 'Own Damage - Marine Transit (OD-MNT)'],
  ['19', 'Own Damage - Garage (OD-GRG)'],
  ['30', 'Unspecified (Possible 3rd Party Claim)'],
  ['31', 'Unspecified (Possible 3rd Party Claim)'],
];

export const ICAP_DESCRIPTION_SET: ReadonlySet<string> = new Set(ICAP_DESCRIPTIONS.map(([, d]) => d));

export const icapDescription = (code: string): string => {
  const hit = ICAP_DESCRIPTIONS.find(([c]) => c === code);
  if (!hit) throw new Error(`No SRD 2.2.5 description for ICAP code ${code}`);
  return hit[1];
};
