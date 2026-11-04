/**
 * Smoke test for the MyKad emulator client.
 *
 * Needs no eAuto login and no browser — it only proves the emulator can be
 * driven from code. Run this first when a thumbprint step misbehaves, to tell
 * an emulator problem apart from an eAuto problem.
 *
 * Requires the MyKad Reader Emulator app to be running.
 */

import { test, expect } from "@playwright/test";
import { MyKadClient } from "@fixtures/mykad";

const CHANNEL = "smoke"; // isolated from any real run

test.describe("MyKad emulator", () => {
  test("accepts a card and reports it back", async () => {
    const client = new MyKadClient({ channel: CHANNEL });
    await client.connect();
    try {
      await client.removeCard();
      await client.insertCard({ NRIC: "020406081081", GMPCName: "MUHAMMAD AMIRUL AZFAR" });
      const ack = client.transcript().find((m) => String(m.Message).startsWith("INSERTCARD"));
      expect(ack?.Message).toContain("OK");
    } finally {
      await client.removeCard();
      await client.close();
    }
  });

  test("releases a parked READCARD when a card is inserted", async () => {
    // `page` stands in for the browser: it parks a READCARD with no card present.
    const page = new MyKadClient({ channel: CHANNEL });
    const bot = new MyKadClient({ channel: CHANNEL });
    await page.connect();
    await bot.connect();
    try {
      await bot.removeCard();
      page.clearHistory();

      // Park the read. Deliberately not awaited — this is what blocks in the UI.
      (page as unknown as { send: (c: string) => void })["send"]("READCARD");
      await new Promise((r) => setTimeout(r, 300));
      expect(page.transcript().some((m) => m.DataTitle === "MYKAD_DATA")).toBe(false);

      await bot.setMatchResult("Identical");
      await bot.insertCard({ NRIC: "020406081081", GMPCName: "MUHAMMAD AMIRUL AZFAR" });

      await expect
        .poll(() => page.transcript().find((m) => m.DataTitle === "Matching Result")?.Message, {
          timeout: 5000,
        })
        .toContain('"Result":"Identical"');

      const match = JSON.parse(
        String(page.transcript().find((m) => m.DataTitle === "Matching Result")!.Message),
      );
      expect(match.NRIC).toBe("020406081081");
    } finally {
      await bot.removeCard();
      await page.close();
      await bot.close();
    }
  });

  test("can force a thumbprint mismatch", async () => {
    const page = new MyKadClient({ channel: CHANNEL });
    const bot = new MyKadClient({ channel: CHANNEL });
    await page.connect();
    await bot.connect();
    try {
      await bot.removeCard();
      page.clearHistory();
      (page as unknown as { send: (c: string) => void })["send"]("READCARD");
      await new Promise((r) => setTimeout(r, 300));

      await bot.setMatchResult("Not Identical");
      await bot.insertCard({ NRIC: "020406081081", GMPCName: "MUHAMMAD AMIRUL AZFAR" });

      await expect
        .poll(() => page.transcript().find((m) => m.DataTitle === "Matching Result")?.Message, {
          timeout: 5000,
        })
        .toContain('"Result":"Not Identical"');
    } finally {
      await bot.setMatchResult("Identical"); // leave the emulator in its default state
      await bot.removeCard();
      await page.close();
      await bot.close();
    }
  });
});
