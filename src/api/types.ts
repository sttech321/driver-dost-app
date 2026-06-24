export type AuthProvider = 'PHONE' | 'GOOGLE' | 'PASSWORD';
export type UserRole = 'USER' | 'DRIVER';

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  photoUrl: string | null;
  role: UserRole;
  provider: AuthProvider;
  walletBalance: string;
  isPhoneVerified: boolean;
  createdAt: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface Driver {
  id: string;
  code: string;
  name: string;
  title: string;
  photoUrl: string | null;
  phone: string | null;
  rating: string;
  ratingCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  lat: number | null;
  lng: number | null;
  distanceKm?: number | null;
}

export interface SavedPlace {
  id: string;
  label: string;
  addressLine: string;
  lat: number | null;
  lng: number | null;
}

export type BookingType = 'ONE_WAY' | 'HOURLY' | 'ROUND_TRIP' | 'OUTSTATION';
export type OutstationTripType = 'ROUND_TRIP' | 'ONE_WAY';
export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'ARRIVING'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';
export type PaymentMethod = 'CREDIT_CARD' | 'UPI' | 'CASH' | 'WALLET';

export interface Booking {
  id: string;
  type: BookingType;
  status: BookingStatus;
  pickupLabel: string | null;
  pickupAddress: string | null;
  destinationLabel: string | null;
  destinationAddress: string | null;
  scheduledAt: string | null;
  startHour: number | null;
  endHour: number | null;
  hours: number | null;
  outstationType: OutstationTripType | null;
  distanceKm: number | null;
  etaMinutes: number | null;
  amount: string;
  paymentMethod: PaymentMethod | null;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  driver: Driver | null;
  /** The requesting user (included on driver-portal endpoints). */
  user?: { id: string; name: string | null; phone: string | null; photoUrl: string | null } | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderType: 'USER' | 'DRIVER';
  text: string;
  createdAt: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}
