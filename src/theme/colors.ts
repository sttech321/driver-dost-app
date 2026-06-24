// Palette sampled from the Driver Dost design screens.
export const colors = {
  // Brand blues
  primary: '#2F6BC4',
  primaryDark: '#21508F',
  primaryLight: '#5B8AD4',
  primarySoft: '#E5ECF8', // quick-action tiles / soft chips
  primarySofter: '#F2F6FC',

  // Welcome / splash background
  welcomeTop: '#3E73B8',
  welcomeBottom: '#2B5390',

  // Neutrals
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  field: '#EEF1F6',
  fieldBorder: '#E2E8F0',

  // Text
  textPrimary: '#1F2A37',
  textSecondary: '#5B6472',
  textMuted: '#9AA3B2',
  textOnPrimary: '#FFFFFF',

  // Feedback
  danger: '#E2574C',
  success: '#2BA84A',
  star: '#2F6BC4',

  // Misc
  divider: '#ECEFF3',
  shadow: '#0F172A',
  mapRoute: '#6B7280',
} as const;

// Fix the gradient values (kept separate to avoid typos above).
export const welcomeGradient = ['#3E73B8', '#2B5390'] as const;

export type ColorKey = keyof typeof colors;
