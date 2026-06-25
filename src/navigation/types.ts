import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Auth: { mode?: 'login' | 'register' } | undefined;
  PhoneVerification: { phone: string; mode: 'login' | 'register' | 'forgot'; newPassword?: string };
  ForgotPassword: undefined;
};

export type TabParamList = {
  Home: undefined;
  Activity: undefined;
  Inbox: undefined;
  Profile: undefined;
};

// Chat is reachable from both the user and the driver stacks.
export type ChatParams = { bookingId: string; peerName: string; asDriver?: boolean };

export type AppStackParamList = {
  LocationPermission: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  OneWay: undefined;
  Hourly: undefined;
  Outstation: undefined;
  DriverArriving: { bookingId: string };
  Chat: ChatParams;
  DriverLeaving: { bookingId: string };
  DriverProfileView: { driverId: string };
};

export type DriverTabParamList = {
  Requests: undefined;
  Trips: undefined;
  DriverProfile: undefined;
};

export type DriverStackParamList = {
  DriverTabs: NavigatorScreenParams<DriverTabParamList>;
  Chat: ChatParams;
  DriverTripDetail: { bookingId: string };
};

export type RootStackParamList = AppStackParamList & AuthStackParamList & DriverStackParamList;
