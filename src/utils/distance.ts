// Haversine distance in km between two lat/lng points (null if any missing).
export function distanceKm(
  a?: { lat?: number | null; lng?: number | null } | null,
  b?: { lat?: number | null; lng?: number | null } | null
): number | null {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return null;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

// Driver pickup search radius (must match backend REQUEST_RADIUS_KM).
export const REQUEST_RADIUS_KM = 8;
