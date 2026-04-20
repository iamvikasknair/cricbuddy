import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shared } from '../theme';
import { ScoreRing } from '../components/ScoreRing';
import { FeedbackCard } from '../components/FeedbackCard';
import type { RootTabParamList } from '../navigation/TabNavigator';
import type { ShotType } from '../types';

type Route = RouteProp<RootTabParamList, 'Feedback'>;
type Nav = BottomTabNavigationProp<RootTabParamList, 'Feedback'>;

const SHOT_LABELS: Record<ShotType, string> = {
  drive: 'Front Foot Drive',
  pull: 'Pull Shot',
  cut: 'Cut Shot',
  sweep: 'Sweep Shot',
  defence: 'Defensive Shot',
  unknown: 'Unknown Shot',
};

const SHOT_TIPS: Record<ShotType, string> = {
  drive: 'Lead with the elbow and play close to the body.',
  pull: 'Get inside the line early and roll the wrists at contact.',
  cut: 'Position behind the line; hit with a horizontal bat.',
  sweep: 'Get down on one knee; keep head over the ball.',
  defence: 'Meet the ball under your eyes with soft hands.',
  unknown: 'Continue practising to build a consistent shot pattern.',
};

const SEVERITY_ORDER: Record<string, number> = { critical: 0, 'needs-work': 1, good: 2, excellent: 3 };

export function FeedbackScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const session = route.params?.session ?? null;

  if (!session) {
    return (
      <SafeAreaView style={shared.screen}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No Feedback Yet</Text>
          <Text style={styles.emptyDesc}>Run an analysis in the Analyse tab to get personalised coaching feedback.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { overallScore, shotType, feedback, duration, frames } = session;
  const validFrames = frames.filter(f => f.pose !== null);
  const poseAccuracy = frames.length > 0 ? Math.round((validFrames.length / frames.length) * 100) : 0;
  const avgKnee = validFrames.length > 0
    ? validFrames.reduce((s, f) => s + (f.kneeFlexion ?? 0), 0) / validFrames.length
    : null;
  const avgWeight = validFrames.length > 0
    ? validFrames.reduce((s, f) => s + (f.weightDistribution ?? 0), 0) / validFrames.length
    : null;

  const counts = {
    excellent: feedback.filter(f => f.severity === 'excellent').length,
    good: feedback.filter(f => f.severity === 'good').length,
    'needs-work': feedback.filter(f => f.severity === 'needs-work').length,
    critical: feedback.filter(f => f.severity === 'critical').length,
  };

  const sorted = [...feedback].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return (
    <SafeAreaView style={shared.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={shared.heading}>Coaching Feedback</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Charts', { session })}>
            <Text style={styles.navLink}>Charts ›</Text>
          </TouchableOpacity>
        </View>

        {/* Score card */}
        <View style={shared.card}>
          <View style={styles.scoreRow}>
            <ScoreRing score={overallScore} />
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <Text style={styles.scoreValue}>{overallScore} / 100</Text>
              <Text style={styles.shotLabel}>Shot: <Text style={{ color: colors.gold }}>{SHOT_LABELS[shotType]}</Text></Text>
              <Text style={styles.shotTip}>{SHOT_TIPS[shotType]}</Text>
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatCell label="Duration" value={`${duration.toFixed(1)}s`} />
            <StatCell label="Frames" value={`${validFrames.length}`} />
            <StatCell label="Pose Acc." value={`${poseAccuracy}%`} />
            {avgKnee !== null && <StatCell label="Avg Knee" value={`${avgKnee.toFixed(0)}°`} />}
            {avgWeight !== null && <StatCell label="Fwd Weight" value={`${avgWeight.toFixed(0)}%`} />}
          </View>
        </View>

        {/* Summary badges */}
        <View style={styles.badgeRow}>
          <SummaryBadge count={counts.excellent} label="Strengths" color={colors.green} bgColor="rgba(82,183,136,0.12)" />
          <SummaryBadge count={counts.good} label="Good" color={colors.blue} bgColor="rgba(72,149,239,0.12)" />
          <SummaryBadge count={counts['needs-work']} label="Improve" color={colors.yellow} bgColor="rgba(245,158,11,0.12)" />
          <SummaryBadge count={counts.critical} label="Critical" color={colors.red} bgColor="rgba(230,57,70,0.12)" />
        </View>

        {/* Feedback cards */}
        <Text style={[shared.subheading, { marginTop: 4, marginBottom: 4 }]}>Coaching Notes</Text>
        {sorted.map((item, i) => <FeedbackCard key={i} item={item} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', fontFamily: 'monospace' }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function SummaryBadge({ count, label, color, bgColor }: { count: number; label: string; color: string; bgColor: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor: color + '50' }]}>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{count}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  navLink: { color: colors.blue, fontSize: 14, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 16 },
  scoreInfo: { flex: 1, gap: 3 },
  scoreLabel: { fontSize: 12, color: colors.textMuted },
  scoreValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  shotLabel: { fontSize: 13, color: colors.textSecondary },
  shotTip: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', lineHeight: 17 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  statCell: { minWidth: '30%', flex: 1, alignItems: 'center', padding: 8, backgroundColor: colors.surfaceLight, borderRadius: 10 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center', gap: 3 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
