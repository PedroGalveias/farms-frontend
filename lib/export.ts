import { getCantonName } from "@/lib/farms";
import type { Farm } from "@/types/farm";

/**
 * Neutralise spreadsheet formula injection (CWE-1236). Excel, LibreOffice and
 * Sheets evaluate any cell whose text begins with `=`, `+`, `-`, `@`, tab or
 * CR as a FORMULA — and RFC 4180 quoting does not prevent it, because quotes
 * are stripped before the cell is interpreted. Farm names and addresses are
 * user-submitted, so a farm called `=cmd|' /C calc'!A0` would execute on the
 * machine of anyone who exported their saved farms and opened the file.
 *
 * The standard mitigation is a leading apostrophe, which spreadsheets consume
 * as "treat the rest as literal text" and hide on display. Genuine numbers are
 * left alone so a negative value still imports as a number.
 */
function neutralizeFormula(value: string): string {
  if (!/^[=+\-@\t\r]/.test(value)) {
    return value;
  }
  // "-5" / "-33.9" are numbers, not formulas — keep them numeric.
  if (Number.isFinite(Number(value))) {
    return value;
  }
  return `'${value}`;
}

/** Wrap a value in quotes when it contains a comma, quote, or newline (RFC 4180). */
function escapeCsv(value: string): string {
  const safe = neutralizeFormula(value);
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
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
