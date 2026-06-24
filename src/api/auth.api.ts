import { api, unwrap } from './client';
import { AuthResult } from './types';

export const authApi = {
  async config(): Promise<{ firebaseEnabled: boolean }> {
    return unwrap(await api.get('/auth/config').then((r) => r.data));
  },

  async register(body: {
    phone: string;
    password: string;
    name?: string;
    email?: string;
    role?: 'USER' | 'DRIVER';
  }): Promise<AuthResult> {
    return unwrap((await api.post('/auth/register', body)).data);
  },

  async login(body: { phone: string; password: string }): Promise<AuthResult> {
    return unwrap((await api.post('/auth/login', body)).data);
  },

  // Google sign-in / Firebase phone OTP exchange a Firebase ID token here.
  async firebase(idToken: string): Promise<AuthResult> {
    return unwrap((await api.post('/auth/firebase', { idToken })).data);
  },

  // Fallback OTP (when Firebase isn't configured) — Screen 3.
  async sendOtp(phone: string): Promise<{ sent: boolean; devCode?: string; firebaseEnabled: boolean }> {
    return unwrap((await api.post('/auth/otp/send', { phone })).data);
  },
  async verifyOtp(phone: string, code: string): Promise<AuthResult> {
    return unwrap((await api.post('/auth/otp/verify', { phone, code })).data);
  },

  async forgotPassword(body: {
    phone: string;
    newPassword: string;
    code?: string;
    firebaseIdToken?: string;
  }): Promise<AuthResult> {
    return unwrap((await api.post('/auth/forgot-password', body)).data);
  },
};
