import { TextStyle } from 'react-native';
import { colors } from './colors';

// The designs use a rounded geometric sans. We rely on the platform system
// font (San Francisco / Roboto) with weights tuned to match.
export const typography: Record<string, TextStyle> = {
  display: { fontSize: 34, fontWeight: '700', color: colors.textPrimary, lineHeight: 40 },
  h1: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, lineHeight: 24 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary, lineHeight: 22 },
  bodyMuted: { fontSize: 15, fontWeight: '400', color: colors.textSecondary, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  button: { fontSize: 17, fontWeight: '700', color: colors.textOnPrimary },
};
