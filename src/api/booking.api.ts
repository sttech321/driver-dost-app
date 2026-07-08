import { api, unwrap } from './client';
import { Booking, ChatMessage, Driver, OutstationTripType, PaymentMethod, Review } from './types';

export interface PayResult {
  booking: Booking;
  needsCheckout?: boolean;
  mock?: boolean;
  order?: { id: string; amount: number; currency: string; keyId: string };
}

interface PlaceInput {
  pickupLabel?: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  destinationLabel?: string;
  destinationAddress?: string;
  destinationLat?: number;
  destinationLng?: number;
  scheduledAt?: string;
}

export const bookingApi = {
  async createOneWay(body: PlaceInput & { distanceKm?: number; etaMinutes?: number }): Promise<Booking> {
    return unwrap((await api.post('/bookings/one-way', body)).data);
  },
  async createHourly(
    body: Omit<PlaceInput, 'destinationLabel' | 'destinationAddress' | 'destinationLat' | 'destinationLng'> & {
      startHour: number;
      endHour: number;
    }
  ): Promise<Booking> {
    return unwrap((await api.post('/bookings/hourly', body)).data);
  },
  async createOutstation(body: PlaceInput & { outstationType: OutstationTripType }): Promise<Booking> {
    return unwrap((await api.post('/bookings/outstation', body)).data);
  },

  async list(): Promise<Booking[]> {
    return unwrap((await api.get('/bookings')).data);
  },
  async get(id: string): Promise<Booking> {
    return unwrap((await api.get(`/bookings/${id}`)).data);
  },
  async cancel(id: string): Promise<Booking> {
    return unwrap((await api.post(`/bookings/${id}/cancel`)).data);
  },
  async pay(id: string, paymentMethod: PaymentMethod): Promise<PayResult> {
    return unwrap((await api.post(`/bookings/${id}/pay`, { paymentMethod })).data);
  },
  async verifyPayment(
    id: string,
    body: { orderId: string; paymentId: string; signature: string }
  ): Promise<{ booking: Booking }> {
    return unwrap((await api.post(`/bookings/${id}/pay/verify`, body)).data);
  },
  async review(
    id: string,
    body: { rating: number; comment?: string }
  ): Promise<{ review: Review; driver: Driver }> {
    return unwrap((await api.post(`/bookings/${id}/review`, body)).data);
  },

  async listMessages(bookingId: string): Promise<ChatMessage[]> {
    return unwrap((await api.get(`/bookings/${bookingId}/messages`)).data);
  },
  async sendMessage(bookingId: string, text: string, senderType: 'USER' | 'DRIVER' = 'USER'): Promise<ChatMessage> {
    return unwrap((await api.post(`/bookings/${bookingId}/messages`, { text, senderType })).data);
  },
};
