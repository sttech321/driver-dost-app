import { api, unwrap } from './client';
import { Booking, ChatMessage, OutstationTripType, PaymentMethod } from './types';

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
  async pay(id: string, paymentMethod: PaymentMethod): Promise<Booking> {
    return unwrap((await api.post(`/bookings/${id}/pay`, { paymentMethod })).data);
  },

  async listMessages(bookingId: string): Promise<ChatMessage[]> {
    return unwrap((await api.get(`/bookings/${bookingId}/messages`)).data);
  },
  async sendMessage(bookingId: string, text: string, senderType: 'USER' | 'DRIVER' = 'USER'): Promise<ChatMessage> {
    return unwrap((await api.post(`/bookings/${bookingId}/messages`, { text, senderType })).data);
  },
};
