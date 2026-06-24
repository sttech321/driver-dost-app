import { api, unwrap } from './client';
import { SavedPlace, User } from './types';

export const userApi = {
  async me(): Promise<User> {
    return unwrap((await api.get('/users/me')).data);
  },
  async updateProfile(body: Partial<Pick<User, 'name' | 'email' | 'photoUrl'>>): Promise<User> {
    return unwrap((await api.patch('/users/me', body)).data);
  },

  async listSavedPlaces(): Promise<SavedPlace[]> {
    return unwrap((await api.get('/users/me/saved-places')).data);
  },
  async createSavedPlace(body: {
    label: string;
    addressLine: string;
    lat?: number;
    lng?: number;
  }): Promise<SavedPlace> {
    return unwrap((await api.post('/users/me/saved-places', body)).data);
  },
  async deleteSavedPlace(id: string): Promise<{ id: string }> {
    return unwrap((await api.delete(`/users/me/saved-places/${id}`)).data);
  },
};
