import { StyleSheet } from 'react-native';

export const Colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#9333EA',
  success: '#16A34A',
  warning: '#F97316',
  danger: '#DC2626',
  background: '#F8FAFC',
  backgroundDark: '#0F172A',
  card: '#FFFFFF',
  cardDark: '#1E293B',
  text: '#0F172A',
  textDark: '#F8FAFC',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  borderDark: '#334155',
  green: '#16A34A',
  gradientStart: '#2563EB',
  gradientEnd: '#9333EA',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadow = StyleSheet.create({
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
});
