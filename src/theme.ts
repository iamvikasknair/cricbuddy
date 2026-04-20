import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#0a0f1e',
  surface: '#111827',
  surfaceLight: '#1e293b',
  border: 'rgba(255,255,255,0.1)',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  green: '#52b788',
  greenDim: 'rgba(82,183,136,0.15)',
  gold: '#e9c46a',
  goldDim: 'rgba(233,196,106,0.15)',
  blue: '#4895ef',
  blueDim: 'rgba(72,149,239,0.15)',
  red: '#e63946',
  redDim: 'rgba(230,57,70,0.15)',
  yellow: '#f59e0b',
  yellowDim: 'rgba(245,158,11,0.15)',
  purple: '#7c3aed',
  cyan: '#4cc9f0',
};

export const skeleton = {
  connections: 'rgba(82,183,136,0.85)',
  nose: '#e9c46a',
  shoulder: '#52b788',
  elbow: '#74c69d',
  wrist: '#f4a261',
  hip: '#4895ef',
  knee: '#4cc9f0',
  ankle: '#7209b7',
};

export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  backgroundGradientFromOpacity: 1,
  backgroundGradientToOpacity: 1,
  color: (opacity = 1) => `rgba(82, 183, 136, ${opacity})`,
  labelColor: () => colors.textMuted,
  strokeWidth: 2,
  barPercentage: 0.6,
  decimalPlaces: 0,
  propsForDots: {
    r: '3',
    strokeWidth: '1',
    stroke: colors.green,
  },
  propsForBackgroundLines: {
    stroke: 'rgba(255,255,255,0.05)',
  },
};
