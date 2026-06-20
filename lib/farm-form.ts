import { SWISS_CANTONS } from "@/lib/farms";
import type {
  CreateFarmInput,
  FarmFormErrors,
  FarmFormValues,
} from "@/types/farm";

const SWISS_CANTON_CODES = new Set<string>(
  SWISS_CANTONS.map(({ code }) => code),
);

const SWISS_COORDINATE_BOUNDS = {
  latitude: {
    max: 47.9,
    min: 45.8,
  },
  longitude: {
    max: 10.6,
    min: 5.9,
  },
};

export const EMPTY_FARM_FORM_VALUES: FarmFormValues = {
  address: "",
  canton: "",
  categories: [],
  latitude: "",
  longitude: "",
  name: "",
};

// Trim, drop blanks, and de-duplicate a list of selected category keys.
export function normalizeCategories(categories: string[]) {
  return Array.from(
    new Set(categories.map((entry) => entry.trim()).filter(Boolean)),
  );
}

// validateFarmForm returns i18n keys (not text), so the dialog can render them
// in the active locale via `t(...)`.
export function validateFarmForm(values: FarmFormValues): FarmFormErrors {
  const errors: FarmFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "form_err_name";
  }

  if (!values.address.trim()) {
    errors.address = "form_err_address";
  }

  const canton = values.canton.trim().toUpperCase();
  if (!canton) {
    errors.canton = "form_err_canton_required";
  } else if (!SWISS_CANTON_CODES.has(canton)) {
    errors.canton = "form_err_canton_invalid";
  }

  const latitude = Number.parseFloat(values.latitude.trim());
  const longitude = Number.parseFloat(values.longitude.trim());

  if (Number.isNaN(latitude)) {
    errors.latitude = "form_err_lat_invalid";
  } else if (latitude < -90 || latitude > 90) {
    errors.latitude = "form_err_lat_range";
  }

  if (Number.isNaN(longitude)) {
    errors.longitude = "form_err_lng_invalid";
  } else if (longitude < -180 || longitude > 180) {
    errors.longitude = "form_err_lng_range";
  }

  if (
    !errors.latitude &&
    !errors.longitude &&
    (latitude < SWISS_COORDINATE_BOUNDS.latitude.min ||
      latitude > SWISS_COORDINATE_BOUNDS.latitude.max ||
      longitude < SWISS_COORDINATE_BOUNDS.longitude.min ||
      longitude > SWISS_COORDINATE_BOUNDS.longitude.max)
  ) {
    errors.latitude = "form_err_coords_ch";
    errors.longitude = "form_err_coords_ch";
  }

  if (normalizeCategories(values.categories).length === 0) {
    errors.categories = "form_err_categories";
  }

  return errors;
}

export function toCreateFarmInput(values: FarmFormValues): CreateFarmInput {
  const latitude = Number.parseFloat(values.latitude.trim());
  const longitude = Number.parseFloat(values.longitude.trim());

  return {
    address: values.address.trim(),
    canton: values.canton.trim().toUpperCase(),
    categories: normalizeCategories(values.categories),
    coordinates: `${latitude},${longitude}`,
    name: values.name.trim(),
  };
}
