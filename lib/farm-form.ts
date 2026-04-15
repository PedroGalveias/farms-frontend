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
  categories: "",
  latitude: "",
  longitude: "",
  name: "",
};

export function parseCategoriesInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

export function validateFarmForm(values: FarmFormValues): FarmFormErrors {
  const errors: FarmFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Add a farm name.";
  }

  if (!values.address.trim()) {
    errors.address = "Add an address.";
  }

  const canton = values.canton.trim().toUpperCase();
  if (!canton) {
    errors.canton = "Choose a canton.";
  } else if (!SWISS_CANTON_CODES.has(canton)) {
    errors.canton = "Use a valid two-letter Swiss canton code.";
  }

  const latitude = Number.parseFloat(values.latitude.trim());
  const longitude = Number.parseFloat(values.longitude.trim());

  if (Number.isNaN(latitude)) {
    errors.latitude = "Enter a valid latitude.";
  } else if (latitude < -90 || latitude > 90) {
    errors.latitude = "Latitude must be between -90 and 90.";
  }

  if (Number.isNaN(longitude)) {
    errors.longitude = "Enter a valid longitude.";
  } else if (longitude < -180 || longitude > 180) {
    errors.longitude = "Longitude must be between -180 and 180.";
  }

  if (
    !errors.latitude &&
    !errors.longitude &&
    (latitude < SWISS_COORDINATE_BOUNDS.latitude.min ||
      latitude > SWISS_COORDINATE_BOUNDS.latitude.max ||
      longitude < SWISS_COORDINATE_BOUNDS.longitude.min ||
      longitude > SWISS_COORDINATE_BOUNDS.longitude.max)
  ) {
    const message = "Coordinates need to be inside Switzerland.";
    errors.latitude = message;
    errors.longitude = message;
  }

  if (parseCategoriesInput(values.categories).length === 0) {
    errors.categories = "Add at least one category.";
  }

  return errors;
}

export function toCreateFarmInput(values: FarmFormValues): CreateFarmInput {
  const latitude = Number.parseFloat(values.latitude.trim());
  const longitude = Number.parseFloat(values.longitude.trim());

  return {
    address: values.address.trim(),
    canton: values.canton.trim().toUpperCase(),
    categories: parseCategoriesInput(values.categories),
    coordinates: `${latitude},${longitude}`,
    name: values.name.trim(),
  };
}
