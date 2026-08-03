/**
 * "lat,lng" parsing, with no dependencies.
 *
 * This lived in `lib/quick-search`, which imports the 183-product catalogue.
 * Eight modules need only this parser — including `lib/trip`, reached from the
 * root layout's TripProvider, and `lib/directory` and `lib/farm-map` on the
 * directory's hot path. Each was pulling ~1,200 lines of product and
 * quick-search code to parse two numbers, and the layout edge put all of it in
 * the JavaScript every route downloads.
 *
 * A leaf module with no imports cannot drag anything in behind it.
 */
export interface QuickSearchCoordinates {
  latitude: number;
  longitude: number;
}

export function parseQuickSearchCoordinates(
  input: string,
): QuickSearchCoordinates | null {
  const coordinateMatch = input.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/,
  );

  if (!coordinateMatch) {
    return null;
  }

  const latitude = Number.parseFloat(coordinateMatch[1]);
  const longitude = Number.parseFloat(coordinateMatch[2]);

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return { latitude, longitude };
}

/** Great-circle distance in km. Pure maths — no data tables. */
export function haversineDistanceKm(
  from: QuickSearchCoordinates,
  to: QuickSearchCoordinates,
) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
