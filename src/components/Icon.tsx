import React from 'react';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Semantic icon names mapped to vector-icon families so the rest of the app
// never references a specific icon set directly.
const FEATHER = {
  smartphone: 'smartphone',
  lock: 'lock',
  eye: 'eye',
  'eye-off': 'eye-off',
  'arrow-right': 'arrow-right',
  'arrow-up': 'arrow-up',
  clock: 'clock',
  'rotate-cw': 'rotate-cw',
  bell: 'bell',
  'map-pin': 'map-pin',
  'chevron-down': 'chevron-down',
  'chevron-right': 'chevron-right',
  'chevron-left': 'chevron-left',
  'more-horizontal': 'more-horizontal',
  home: 'home',
  'file-text': 'file-text',
  'message-square': 'message-square',
  user: 'user',
  phone: 'phone',
  send: 'send',
  mic: 'mic',
  calendar: 'calendar',
  crosshair: 'crosshair',
  check: 'check',
  'log-out': 'log-out',
  trash: 'trash-2',
  plus: 'plus',
} as const;

const IONICONS = {
  star: 'star',
  google: 'logo-google',
} as const;

const MCI = {
  mountain: 'image-filter-hdr',
  search: 'magnify',
} as const;

export type IconName =
  | keyof typeof FEATHER
  | keyof typeof IONICONS
  | keyof typeof MCI;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = '#1F2A37' }: IconProps) {
  if (name in FEATHER) {
    return <Feather name={FEATHER[name as keyof typeof FEATHER]} size={size} color={color} />;
  }
  if (name in IONICONS) {
    return <Ionicons name={IONICONS[name as keyof typeof IONICONS]} size={size} color={color} />;
  }
  return (
    <MaterialCommunityIcons name={MCI[name as keyof typeof MCI]} size={size} color={color} />
  );
}
