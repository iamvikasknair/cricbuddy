import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { colors, shared, chartConfig } from '../theme';
import type { RootTabParamList } from '../navigation/TabNavigator';
import type { FrameAnalysis } from '../types';

type Route = RouteProp<RootTabParamList, 'Charts'>;

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 32;

function sampleFrames(frames: FrameAnalysis[], max = 20): FrameAnalysis[] {
  if (frames.length <= max) return frames;
  const step = Math.floor(frames.length / max);
  return frames.filter((_, i) => i % step === 0).slice(0, max);
}

function ChartCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={shared.card}>
      <View style={[styles.cardHeader, { marginBottom: 12 }]}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text style={shared.subheading}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// Minimal radar chart using SVG
function RadarChart({ scores, labels }: { scores: number[]; labels: string[] }) {
  const size = CHART_W - 32;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 30;
  const count = scores.length;

  const angleStep = (2 * Math.PI) / count;
  const getPoint = (i: number, radius: number) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const scorePoints = scores.map((s, i) => getPoint(i, (s / 100) * r));
  const polygonPoints = scorePoints.map(p => `${p.x},${p.y}`).join(' ');
  const idealPoints = Array.from({ length: count }, (_, i) => getPoint(i, r));
  const idealPolygon = idealPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <Svg width={size} height={size}>
      {/* Grid circles */}
      {gridLevels.map(level => {
        const pts = Array.from({ length: count }, (_, i) => getPoint(i, level * r));
        return (
          <Polygon
            key={level}
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}
      {/* Axis lines */}
      {Array.from({ length: count }, (_, i) => {
        const p = getPoint(i, r);
        return <SvgLine key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
      })}
      {/* Ideal area */}
      <Polygon points={idealPolygon} fill="rgba(233,196,106,0.05)" stroke="rgba(233,196,106,0.3)" strokeWidth={1} strokeDasharray="4 4" />
      {/* Score area */}
      <Polygon points={polygonPoints} fill="rgba(82,183,136,0.2)" stroke={colors.green} strokeWidth={2} />
      {/* Labels */}
      {labels.map((label, i) => {
        const p = getPoint(i, r + 20);
        return (
          <SvgText key={i} x={p.x} y={p.y} fill={colors.textMuted} fontSize={9} textAnchor="middle" alignmentBaseline="middle">
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export function ChartsScreen() {
  const route = useRoute<Route>();
  const session = route.params?.session ?? null;

  if (!session) {
    return (
      <SafeAreaView style={shared.screen}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No Analysis Yet</Text>
          <Text style={styles.emptyDesc}>Run an analysis in the Analyse tab to see performance charts here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { frames, feedback } = session;
  const validFrames = frames.filter(f => f.pose !== null);
  const sampled = sampleFrames(validFrames);
  const labels = sampled.map(f => `${f.timestamp.toFixed(1)}s`);

  // Knee flexion data
  const kneeData = sampled.map(f => f.kneeFlexion ?? 0);

  // Weight distribution data
  const weightData = sampled.map(f => f.weightDistribution ?? 0);

  // Elbow angle data
  const elbowData = sampled.map(f => f.elbowAngle ?? 0);

  // Hip rotation bar data (max 15 bars for readability)
  const hipSampled = sampleFrames(validFrames, 12);
  const hipData = hipSampled.map(f => f.hipRotation ?? 0);
  const hipLabels = hipSampled.map(f => `${f.timestamp.toFixed(1)}`);

  // Head position pie
  const headCounts = { ideal: 0, 'too-high': 0, 'too-low': 0 };
  frames.forEach(f => { if (f.headPosition) headCounts[f.headPosition]++; });
  const totalHead = frames.length || 1;
  const pieData = [
    { name: 'Ideal', population: headCounts.ideal, color: colors.green, legendFontColor: colors.textSecondary, legendFontSize: 12 },
    { name: 'Too High', population: headCounts['too-high'], color: colors.red, legendFontColor: colors.textSecondary, legendFontSize: 12 },
    { name: 'Too Low', population: headCounts['too-low'], color: colors.gold, legendFontColor: colors.textSecondary, legendFontSize: 12 },
  ].filter(d => d.population > 0);
  void totalHead;

  // Radar scores
  const scoreMap: Record<string, number> = { excellent: 100, good: 75, 'needs-work': 40, critical: 10 };
  const radarCategories = ['stance', 'backlift', 'head-position', 'balance', 'follow-through', 'timing'];
  const radarLabels = ['Stance', 'Backlift', 'Head', 'Balance', 'Follow', 'Timing'];
  const radarScores = radarCategories.map(cat => {
    const item = feedback.find(f => f.category === cat);
    return item ? scoreMap[item.severity] : 50;
  });

  const lineOpts = { ...chartConfig, color: (opacity = 1) => `rgba(82,183,136,${opacity})` };
  const weightOpts = { ...chartConfig, color: (opacity = 1) => `rgba(233,196,106,${opacity})` };
  const elbowOpts = { ...chartConfig, color: (opacity = 1) => `rgba(124,58,237,${opacity})` };

  return (
    <SafeAreaView style={shared.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[shared.heading, { margin: 16, marginBottom: 4 }]}>Performance Charts</Text>

        {/* Radar */}
        <ChartCard title="Technique Radar" color={colors.green}>
          <View style={{ alignItems: 'center' }}>
            <RadarChart scores={radarScores} labels={radarLabels} />
          </View>
          <View style={styles.radarLegend}>
            <LegendDot color={colors.green} label="Your score" />
            <LegendDot color={colors.gold} label="Ideal" dashed />
          </View>
        </ChartCard>

        {/* Head Position Pie */}
        <ChartCard title="Head Position Distribution" color={colors.red}>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={CHART_W - 32}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              center={[10, 0]}
              hasLegend
            />
          ) : (
            <Text style={shared.body}>No head position data available.</Text>
          )}
        </ChartCard>

        {/* Knee Flexion */}
        {kneeData.length > 1 && (
          <ChartCard title="Knee Flexion Over Time" color={colors.green}>
            <LineChart
              data={{ labels, datasets: [{ data: kneeData }] }}
              width={CHART_W - 32}
              height={180}
              chartConfig={lineOpts}
              bezier
              style={styles.chart}
              withDots={false}
              yAxisSuffix="°"
            />
            <Text style={styles.chartHint}>Ideal: 130–155°  |  Green = good flex</Text>
          </ChartCard>
        )}

        {/* Weight Distribution */}
        {weightData.length > 1 && (
          <ChartCard title="Weight Distribution (% Front Foot)" color={colors.gold}>
            <LineChart
              data={{ labels, datasets: [{ data: weightData }] }}
              width={CHART_W - 32}
              height={180}
              chartConfig={weightOpts}
              bezier
              style={styles.chart}
              withDots={false}
              yAxisSuffix="%"
            />
            <Text style={styles.chartHint}>40–65% forward = balanced  |  50% = even</Text>
          </ChartCard>
        )}

        {/* Elbow Angle */}
        {elbowData.length > 1 && (
          <ChartCard title="Elbow / Backlift Angle" color={colors.purple}>
            <LineChart
              data={{ labels, datasets: [{ data: elbowData }] }}
              width={CHART_W - 32}
              height={180}
              chartConfig={elbowOpts}
              bezier
              style={styles.chart}
              withDots={false}
              yAxisSuffix="°"
            />
            <Text style={styles.chartHint}>Ideal backlift: 80–130°</Text>
          </ChartCard>
        )}

        {/* Hip Rotation Bar */}
        {hipData.length > 0 && (
          <ChartCard title="Hip Rotation (°)" color={colors.blue}>
            <BarChart
              data={{ labels: hipLabels, datasets: [{ data: hipData }] }}
              width={CHART_W - 32}
              height={200}
              chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(72,149,239,${opacity})` }}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix="°"
              showValuesOnTopOfBars={false}
            />
            <Text style={styles.chartHint}>Ideal: 15–40° hip rotation</Text>
          </ChartCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 20, height: 3, backgroundColor: dashed ? 'transparent' : color, borderRadius: 2, borderWidth: dashed ? 1 : 0, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }} />
      <Text style={{ fontSize: 11, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 16, paddingTop: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  chart: { borderRadius: 8, marginLeft: -8 },
  chartHint: { fontSize: 11, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  radarLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
