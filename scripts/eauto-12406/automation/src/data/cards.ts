/**
 * Named MyKad profiles.
 *
 * A scenario refers to a person by name, not by a wall of card fields, so a new
 * ticket can say `seller: CARDS.malaysianIndividual` and move on.
 *
 * Only fields a test actually cares about are listed — the emulator fills the
 * rest from its own defaults.
 *
 * These are SIMULATOR identities. They are not real people and the NRICs are
 * staging test data.
 */

import type { CardLike } from "@pages/wizard.page";
import { ownLane, partnerLane, subLane } from "../../config/lane-roster";

export const CARDS = {
  /** The identity used to map the flow on 2026-09-15. Matches staging test data. */
  malaysianIndividual: {
    NRIC: "020406081081",
    GMPCName: "MUHAMMAD AMIRUL AZFAR BIN KAMARULAZAM", // full name as printed on the IC: the real-AI IC check compares it (07.10.2026)
    OriginalName: "MUHAMMAD AMIRUL AZFAR BIN KAMARULAZAM",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },

  /**
   * faizuddin2's user (persona `ucdE2E2`), as BackOffice lists it (View UCD User
   * Accounts, 2026-09-25). The UCD to UCD Interstate BUYER reads the logged-in
   * user's own MyKad, so this is the card for that side.
   */
  ucdE2E2Rep: {
    NRIC: "030217141005",
    GMPCName: "MUHAMMAD FAIZUDDIN BIN BIDI",
    OriginalName: "MUHAMMAD FAIZUDDIN BIN BIDI",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },

  /**
   * Lane 3 / lane 4 users (AzfarL3 / AzfarL4, Sub UCD of AZFARAZO), registered on
   * staging 21.10.2026 with these simulator cards. Steps that read the LOGIN
   * user's own MyKad on those lanes need this card, not malaysianIndividual.
   */
  ucdE2E3Rep: {
    NRIC: "900101145553",
    GMPCName: "QA AUTOMATION LANE TIGA",
    OriginalName: "QA AUTOMATION LANE TIGA",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },
  ucdE2E4Rep: {
    NRIC: "900101145554",
    GMPCName: "QA AUTOMATION LANE EMPAT",
    OriginalName: "QA AUTOMATION LANE EMPAT",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },

  /** Main users of the QA companies made in BO 21.10.2026 (AzfarCo1-5, lanes 5-9), simulator identities. */
  ucdCo1Rep: {
    NRIC: "900101145561",
    GMPCName: "QA AUTOMATION SYARIKAT SATU",
    OriginalName: "QA AUTOMATION SYARIKAT SATU",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },
  ucdCo2Rep: {
    NRIC: "900101145562",
    GMPCName: "QA AUTOMATION SYARIKAT DUA",
    OriginalName: "QA AUTOMATION SYARIKAT DUA",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },
  ucdCo3Rep: {
    NRIC: "900101145563",
    GMPCName: "QA AUTOMATION SYARIKAT TIGA",
    OriginalName: "QA AUTOMATION SYARIKAT TIGA",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },
  ucdCo4Rep: {
    NRIC: "900101145564",
    GMPCName: "QA AUTOMATION SYARIKAT EMPAT",
    OriginalName: "QA AUTOMATION SYARIKAT EMPAT",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },
  ucdCo5Rep: {
    NRIC: "900101145565",
    GMPCName: "QA AUTOMATION SYARIKAT LIMA",
    OriginalName: "QA AUTOMATION SYARIKAT LIMA",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },

  /** Sub users of Co1 / Co2 (AzfarCo1S / AzfarCo2S, lanes 10 / 11), simulator identities, 21.10.2026. */
  ucdCo1SubRep: {
    NRIC: "900101145570",
    GMPCName: "QA AUTOMATION LANE SUB SATU",
    OriginalName: "QA AUTOMATION LANE SUB SATU",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },
  ucdCo2SubRep: {
    NRIC: "900101145571",
    GMPCName: "QA AUTOMATION LANE SUB DUA",
    OriginalName: "QA AUTOMATION LANE SUB DUA",
    Address1: "NO 1 JALAN TEST",
    Address2: "TAMAN SIMULATOR",
    Postcode: "81100",
    City: "JOHOR BAHRU",
    State: "JOHOR",
  },

  /** The emulator's own built-in default identity. */
  emulatorDefault: {
    NRIC: "880101-01-1234",
    GMPCName: "MUHAMMAD ALI BIN ABDULLAH",
  },
} satisfies Record<string, CardLike>;

export type CardName = keyof typeof CARDS;

/**
 * The card of the run's lane user (`LANE`, roster env/lanes.json), for steps that read the LOGIN user's own
 * MyKad (STMS Step 3 buyer, BMK, ...). Lane 1 / unset = Azfar1.
 */
export function laneCard(): CardLike {
  return cardOf(ownLane().card);
}

/** The card of UCD B in a UCD to UCD run (`partnerLane`). */
export function partnerCard(): CardLike {
  return cardOf(partnerLane().card);
}

/** The card of the sub user in a main + sub run (`subLane`). */
export function subCard(): CardLike {
  return cardOf(subLane().card);
}

function cardOf(name: string): CardLike {
  const c = (CARDS as Record<string, CardLike>)[name];
  if (!c) throw new Error(`env/lanes.json names card "${name}", which src/data/cards.ts does not have`);
  return c;
}
