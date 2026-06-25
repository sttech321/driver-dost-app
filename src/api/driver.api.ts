import { api, unwrap } from './client';
import { Driver } from './types';

export const driverApi = {
  async recommended(params?: { lat?: number; lng?: number; limit?: number }): Promise<Driver[]> {
    return unwrap((await api.get('/drivers/recommended', { params })).data);
  },
  async getById(id: string): Promise<Driver> {
    return unwrap((await api.get(`/drivers/${id}`)).data);
  },
  async nearbyCount(params: { lat?: number; lng?: number }): Promise<{ count: number }> {
    return unwrap((await api.get('/drivers/nearby-count', { params })).data);
  },
};
