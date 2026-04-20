import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CoachingFeedback } from '../types';
import { colors } from '../theme';

const SEVERITY_STYLES: Record<string, { bg: string; border: string; badge: string; badgeText: string; icon: string }> = {
  excellent: { bg: 'rgba(82,183,136,0.08)', border: 'rgba(82,183,136,0.3)', badge: 'rgba(82,183,136,0.2)', badgeText: colors.green, icon: '★' },
  good: { bg: 'rgba(72,149,239,0.08)', border: 'rgba(72,149,239,0.3)', badge: 'rgba(72,149,239,0.2)', badgeText: colors.blue, icon: '✓' },
  'needs-work': { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', badge: 'rgba(245,158,11,0.2)', badgeText: colors.yellow, icon: '⚠' },
  critical: { bg: 'rgba(230,57,70,0.08)', border: 'rgba(230,57,70,0.3)', badge: 'rgba(230,57,70,0.2)', badgeText: colors.red, icon: '✗' },
};

const SEVERITY_LABEL: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  'needs-work': 'Needs Work',
  critical: 'Critical',
};

export function FeedbackCard({ item }: { item: CoachingFeedback }) {
  const s = SEVERITY_STYLES[item.severity];
  return (
    <View style={[styles.card, { backgroundColor: s.bg, borderColor: s.border }]}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: s.badgeText }]}>{s.icon}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: s.badge }]}>
          <Text style={[styles.badgeText, { color: s.badgeText }]}>{SEVERITY_LABEL[item.severity]}</Text>
        </View>
      </View>
      <Text style={styles.detail}>{item.detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    flex: 1,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detail: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
