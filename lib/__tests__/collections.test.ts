import { afterEach, describe, expect, it } from "vitest";
import {
  COLLECTIONS_STORAGE_KEY,
  createCollection,
  deleteCollection,
  readCollections,
  removeFarmFromCollections,
  renameCollection,
  toggleFarmInCollection,
  writeCollections,
  type Collection,
} from "@/lib/collections";

afterEach(() => window.localStorage.clear());

const base: Collection[] = [
  { id: "a", name: "Weekend trips", farmIds: ["f1"] },
  { id: "b", name: "Eggs run", farmIds: [] },
];

describe("createCollection", () => {
  it("appends a trimmed, named collection with a fresh id", () => {
    const out = createCollection([], "  Berries  ");
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("Berries");
    expect(out[0].farmIds).toEqual([]);
    expect(out[0].id).toBeTruthy();
  });

  it("ignores blank names", () => {
    expect(createCollection(base, "   ")).toBe(base);
  });
});

describe("renameCollection / deleteCollection", () => {
  it("renames by id (blank ignored)", () => {
    expect(
      renameCollection(base, "a", "Trips").find((c) => c.id === "a")?.name,
    ).toBe("Trips");
    expect(renameCollection(base, "a", " ")).toBe(base);
  });

  it("deletes by id", () => {
    expect(deleteCollection(base, "a").map((c) => c.id)).toEqual(["b"]);
  });
});

describe("toggleFarmInCollection", () => {
  it("adds then removes a farm in the target collection only", () => {
    const added = toggleFarmInCollection(base, "b", "f9");
    expect(added.find((c) => c.id === "b")?.farmIds).toEqual(["f9"]);
    expect(added.find((c) => c.id === "a")?.farmIds).toEqual(["f1"]);
    const removed = toggleFarmInCollection(added, "b", "f9");
    expect(removed.find((c) => c.id === "b")?.farmIds).toEqual([]);
  });
});

describe("removeFarmFromCollections", () => {
  it("strips a farm from every collection", () => {
    const out = removeFarmFromCollections(
      [
        { id: "a", name: "A", farmIds: ["f1", "f2"] },
        { id: "b", name: "B", farmIds: ["f1"] },
      ],
      "f1",
    );
    expect(out.map((c) => c.farmIds)).toEqual([["f2"], []]);
  });
});

describe("persistence", () => {
  it("round-trips and drops malformed entries", () => {
    writeCollections(base);
    expect(readCollections()).toEqual(base);

    window.localStorage.setItem(
      COLLECTIONS_STORAGE_KEY,
      JSON.stringify([{ id: "x", name: "X", farmIds: ["ok", 2] }, { nope: 1 }]),
    );
    expect(readCollections()).toEqual([
      { id: "x", name: "X", farmIds: ["ok"] },
    ]);
  });

  it("returns [] for missing or corrupt storage", () => {
    expect(readCollections()).toEqual([]);
    window.localStorage.setItem(COLLECTIONS_STORAGE_KEY, "{bad");
    expect(readCollections()).toEqual([]);
  });
});
