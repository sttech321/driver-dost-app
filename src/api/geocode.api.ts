import { api, unwrap } from './client';
import { LatLng, Place } from './types';

export interface RoadRoute {
  points: LatLng[];
  distanceKm: number;
  durationMin: number;
}

export const geocodeApi = {
  async search(q: string, opts?: { lat?: number; lng?: number; limit?: number }): Promise<Place[]> {
    if (!q || q.trim().length < 2) return [];
    return unwrap(
      (await api.get('/geocode/search', { params: { q, ...opts } })).data
    );
  },
  async reverse(lat: number, lng: number): Promise<Place | null> {
    return unwrap((await api.get('/geocode/reverse', { params: { lat, lng } })).data);
  },
  async route(from: LatLng, to: LatLng): Promise<RoadRoute | null> {
    return unwrap(
      (
        await api.get('/geocode/route', {
          params: { fromLat: from.lat, fromLng: from.lng, toLat: to.lat, toLng: to.lng },
        })
      ).data
    );
  },
};
