# Driver Dost — Mobile App

React Native (Expo) app for booking trusted drivers for your own car.

## Stack
- **Expo SDK 52** + **React Native 0.76** + **TypeScript**
- **React Navigation** (native stack + bottom tabs)
- **Firebase Auth** (Google sign-in) + backend phone-OTP
- **react-native-maps**, **expo-location**
- **axios** API client with JWT bearer auth, **AsyncStorage** session

## Project structure
```
src/
  api/          # axios client + typed endpoint modules (auth, user, driver, booking)
  components/   # reusable UI (Button, TextField, Icon, Screen, DriverCard, SlideButton, …)
  config/       # env + firebase init
  context/      # AuthContext (session + location gate)
  hooks/        # useLocation, useGoogleAuth
  navigation/   # Root / Auth / App stacks + bottom tabs
  screens/      # one folder per flow
  theme/        # colors, spacing, typography (sampled from the designs)
App.tsx         # providers
```

## Screen flow (matches the designs, in order)
Welcome (slide to start) → Auth (Login / Register / Google / Forgot) →
Phone Verification (OTP keypad) → Location Permission → **Dashboard**
(Quick Actions + Recommended Drivers carousel + tabs).

Quick Actions:
- **One Way** → map + pickup/destination + Saved Places → Find a Driver →
  Driver Arriving (call / chat) → Live Chat / Driver Leaving (payment).
- **Hourly** → date strip + two-thumb hour slider → Schedule Driver.
- **Outstation / Round Trip** → pickup/destination + date + Round (₹1200) / One-Way (₹1700).

Tabs: Home · Activity (bookings) · Inbox (chats) · Profile (saved places, wallet, sign out).

## Setup
```bash
npm install
cp .env.example .env          # set EXPO_PUBLIC_API_URL to your backend
npm start                     # then press a / i, or scan with Expo Go
```

> On a physical device, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP
> (e.g. `http://192.168.1.5:4000/api`) — `localhost` won't reach your computer.

### Optional integrations
- **Google sign-in**: fill the `EXPO_PUBLIC_FIREBASE_*` and
  `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` vars. Until then the Google button is
  disabled and phone+password / OTP login still work.
- **Phone OTP**: handled by the backend's OTP endpoints. In dev the code is
  logged to the backend console (no SMS provider needed).
- **Maps on Android**: add a Google Maps API key in `app.json` →
  `android.config.googleMaps.apiKey` (a dev build / Expo Go is required for maps).

## Notes
- `npm run typecheck` — strict TypeScript, currently clean.
- `npx expo-doctor` — all checks pass.
- Native modules (maps) require **Expo Go** or a **dev client** build, not web.
