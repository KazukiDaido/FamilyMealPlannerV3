import React from 'react';
import { View } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

export function HomeIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
  );
}

export function CalendarIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 4 }} />
  );
}

export function SettingsIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
  );
}

