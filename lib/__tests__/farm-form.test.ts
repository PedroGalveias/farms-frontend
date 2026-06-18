import { describe, expect, it } from "vitest";
import {
  EMPTY_FARM_FORM_VALUES,
  normalizeCategories,
  toCreateFarmInput,
  validateFarmForm,
} from "@/lib/farm-form";
import type { FarmFormValues } from "@/types/farm";

function validValues(overrides: Partial<FarmFormValues> = {}): FarmFormValues {
  return {
    name: "Hof Sonnenmatt",
    address: "Dorfstrasse 12, 3011 Bern",
    canton: "BE",
    latitude: "46.948",
    longitude: "7.4474",
    categories: ["Gemüse", "Milchprodukte"],
    ...overrides,
  };
}

describe("normalizeCategories", () => {
  it("trims, drops blanks, and de-duplicates", () => {
    expect(
      normalizeCategories(["Milchprodukte", " Gemüse ", "Milchprodukte", ""]),
    ).toEqual(["Milchprodukte", "Gemüse"]);
  });

  it("preserves keys that contain commas", () => {
    expect(normalizeCategories(["Nüsse, Samen und Öle"])).toEqual([
      "Nüsse, Samen und Öle",
    ]);
  });
});

describe("validateFarmForm", () => {
  it("passes a valid Swiss farm with no errors", () => {
    expect(validateFarmForm(validValues())).toEqual({});
  });

  it("flags every missing required field on an empty form", () => {
    const errors = validateFarmForm(EMPTY_FARM_FORM_VALUES);
    expect(errors.name).toBeDefined();
    expect(errors.address).toBeDefined();
    expect(errors.canton).toBeDefined();
    expect(errors.latitude).toBeDefined();
    expect(errors.longitude).toBeDefined();
    expect(errors.categories).toBeDefined();
  });

  it("rejects an unknown canton code", () => {
    expect(validateFarmForm(validValues({ canton: "XX" })).canton).toMatch(
      /valid two-letter/i,
    );
  });

  it("rejects non-numeric coordinates", () => {
    const errors = validateFarmForm(
      validValues({ latitude: "abc", longitude: "" }),
    );
    expect(errors.latitude).toBeDefined();
    expect(errors.longitude).toBeDefined();
  });

  it("rejects coordinates outside Switzerland", () => {
    const errors = validateFarmForm(
      validValues({ latitude: "10", longitude: "10" }),
    );
    expect(errors.latitude).toMatch(/inside Switzerland/i);
    expect(errors.longitude).toMatch(/inside Switzerland/i);
  });

  it("requires at least one category", () => {
    expect(
      validateFarmForm(validValues({ categories: [] })).categories,
    ).toBeDefined();
  });
});

describe("toCreateFarmInput", () => {
  it("normalizes values into the API payload shape", () => {
    const input = toCreateFarmInput(
      validValues({
        canton: "be",
        name: "  Hof  ",
        categories: ["Milchprodukte", "Milchprodukte"],
      }),
    );
    expect(input).toEqual({
      name: "Hof",
      address: "Dorfstrasse 12, 3011 Bern",
      canton: "BE",
      coordinates: "46.948,7.4474",
      categories: ["Milchprodukte"],
    });
  });
});
