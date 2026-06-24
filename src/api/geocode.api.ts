import { api, unwrap } from './client';
import { Place } from './types';

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
};
