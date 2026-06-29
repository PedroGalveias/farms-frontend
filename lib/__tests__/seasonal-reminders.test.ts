import { afterEach, describe, expect, it } from "vitest";
import {
  dueReminders,
  readAck,
  readReminders,
  writeAck,
  writeReminders,
} from "@/lib/seasonal-reminders";

afterEach(() => {
  window.localStorage.clear();
});

describe("seasonal reminder storage", () => {
  it("round-trips subscriptions, dropping unknown keys and dupes", () => {
    writeReminders(["strawberries", "strawberries", "not-a-real-key"]);
    expect(readReminders()).toEqual(["strawberries"]);
  });

  it("returns [] for malformed subscription data", () => {
    window.localStorage.setItem("farms.seasonalReminders", "not json");
    expect(readReminders()).toEqual([]);
    window.localStorage.setItem("farms.seasonalReminders", '{"a":1}');
    expect(readReminders()).toEqual([]);
  });

  it("round-trips acknowledgements and ignores non-numeric values", () => {
    writeAck({ strawberries: 2026, cherries: 2025 });
    expect(readAck()).toEqual({ strawberries: 2026, cherries: 2025 });
    window.localStorage.setItem(
      "farms.seasonalReminders.ack",
      '{"a":"x","b":3}',
    );
    expect(readAck()).toEqual({ b: 3 });
  });
});

describe("dueReminders", () => {
  // Strawberries are in season May–July (months 5,6,7).
  const june = new Date(2026, 5, 15); // month index 5 = June
  const december = new Date(2026, 11, 1);

  it("includes a subscribed item that is in season and not acknowledged", () => {
    expect(dueReminders(["strawberries"], june, {})).toEqual(["strawberries"]);
  });

  it("excludes items that are out of season", () => {
    expect(dueReminders(["strawberries"], december, {})).toEqual([]);
  });

  it("excludes items already acknowledged this year, but not a prior year", () => {
    expect(
      dueReminders(["strawberries"], june, { strawberries: 2026 }),
    ).toEqual([]);
    expect(
      dueReminders(["strawberries"], june, { strawberries: 2025 }),
    ).toEqual(["strawberries"]);
  });

  it("ignores unknown keys", () => {
    expect(dueReminders(["nope"], june, {})).toEqual([]);
  });
});
