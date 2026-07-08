import { useEffect, useState } from 'react';
import { geocodeApi } from '@/api/geocode.api';
import { LatLng } from '@/api/types';

/**
 * Road-snapped driving route between two points (follows streets).
 * Falls back to a straight [from, to] line if routing is unavailable.
 */
export function useRoute(
  from?: LatLng | null,
  to?: LatLng | null
): { lat: number; lng: number }[] | undefined {
  const [points, setPoints] = useState<LatLng[] | null>(null);

  useEffect(() => {
    if (!from || !to) {
      setPoints(null);
      return;
    }
    let active = true;
    geocodeApi
      .route(from, to)
      .then((r) => {
        if (active) setPoints(r?.points && r.points.length > 1 ? r.points : null);
      })
      .catch(() => active && setPoints(null));
    return () => {
      active = false;
    };
  }, [from?.lat, from?.lng, to?.lat, to?.lng]);

  if (points && points.length > 1) return points;
  if (from && to) return [from, to]; // straight-line fallback
  return undefined;
}
