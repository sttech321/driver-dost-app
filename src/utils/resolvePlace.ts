import { geocodeApi } from '@/api/geocode.api';
import { Place } from '@/api/types';

/**
 * Resolve a booking field to a Place with real coordinates.
 * - If the user already selected a suggestion / map point, use it.
 * - Otherwise geocode the typed text (first match) so we never submit a
 *   location without coordinates.
 * Returns null if nothing usable could be resolved.
 */
export async function resolvePlace(
  text: string,
  selected: Place | null,
  bias?: { lat: number; lng: number } | null
): Promise<Place | null> {
  if (selected) return selected;
  const q = text.trim();
  if (q.length < 2) return null;
  try {
    const [first] = await geocodeApi.search(q, { lat: bias?.lat, lng: bias?.lng, limit: 1 });
    return first ?? null;
  } catch {
    return null;
  }
}
