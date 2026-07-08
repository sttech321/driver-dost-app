import { api, unwrap } from './client';
import { SavedPlace, User } from './types';

export interface WalletTopUpOrderResult {
  needsCheckout?: boolean;
  mock?: boolean;
  order?: { id: string; amount: number; currency: string; keyId: string };
  user?: User;
}

export interface WalletPackage {
  id: string;
  pay: number;
  bonus: number;
  credit: number; // pay + bonus
}

export interface WalletOptions {
  packages: WalletPackage[];
  manual: { min: number; max: number };
}

export const userApi = {
  async me(): Promise<User> {
    return unwrap((await api.get('/users/me')).data);
  },
  async updateProfile(body: Partial<Pick<User, 'name' | 'email' | 'photoUrl'>>): Promise<User> {
    return unwrap((await api.patch('/users/me', body)).data);
  },
  // Gateway-backed "Add Money via Razorpay": packages → create order → checkout → verify.
  async walletPackages(): Promise<WalletOptions> {
    return unwrap((await api.get('/users/me/wallet/packages')).data);
  },
  async walletTopUpOrder(body: { packageId?: string; amount?: number }): Promise<WalletTopUpOrderResult> {
    return unwrap((await api.post('/users/me/wallet/topup/order', body)).data);
  },
  async walletTopUpVerify(body: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<{ user: User }> {
    return unwrap((await api.post('/users/me/wallet/topup/verify', body)).data);
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
