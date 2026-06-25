import { api, unwrap } from './client';
import { Booking, ChatMessage, Driver, BookingStatus } from './types';

// Endpoints for a logged-in DRIVER account.
export const driverPortalApi = {
  async me(): Promise<Driver> {
    return unwrap((await api.get('/driver/me')).data);
  },
  async requests(params?: { lat?: number; lng?: number }): Promise<Booking[]> {
    return unwrap((await api.get('/driver/requests', { params })).data);
  },
  async accept(bookingId: string): Promise<Booking> {
    return unwrap((await api.post(`/driver/requests/${bookingId}/accept`)).data);
  },
  async myBookings(): Promise<Booking[]> {
    return unwrap((await api.get('/driver/bookings')).data);
  },
  async updateStatus(
    bookingId: string,
    status: Extract<BookingStatus, 'ARRIVING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'>
  ): Promise<Booking> {
    return unwrap((await api.post(`/driver/bookings/${bookingId}/status`, { status })).data);
  },

  async listMessages(bookingId: string): Promise<ChatMessage[]> {
    return unwrap((await api.get(`/driver/bookings/${bookingId}/messages`)).data);
  },
  async sendMessage(bookingId: string, text: string): Promise<ChatMessage> {
    return unwrap(
      (await api.post(`/driver/bookings/${bookingId}/messages`, { text, senderType: 'DRIVER' })).data
    );
  },
};
