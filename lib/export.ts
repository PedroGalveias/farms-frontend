import { getCantonName } from "@/lib/farms";
import type { Farm } from "@/types/farm";

/** Wrap a value in quotes when it contains a comma, quote, or newline (RFC 4180). */
function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const CSV_HEADERS = [
  "Name",
  "Canton",
  "Canton code",
  "Address",
  "Coordinates",
  "Categories",
  "Added",
] as const;

/**
 * Serialize farms to CSV (RFC 4180). Categories are joined with "; " so they
 * stay in a single field. A leading BOM makes Excel read UTF-8 correctly.
 */
export function farmsToCsv(farms: Farm[]): string {
  const rows = farms.map((farm) =>
    [
      farm.name,
      getCantonName(farm.canton),
      farm.canton,
      farm.address,
      farm.coordinates,
      farm.categories.join("; "),
      farm.created_at,
    ]
      .map((field) => escapeCsv(String(field ?? "")))
      .join(","),
  );

  return `﻿${[CSV_HEADERS.join(","), ...rows].join("\r\n")}`;
}
