import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Radar, Bar, Doughnut } from 'react-chartjs-2';
import type { SessionAnalysis, FrameAnalysis } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const CHART_COLORS = {
  green: 'rgba(82, 183, 136, 1)',
  greenFade: 'rgba(82, 183, 136, 0.15)',
  gold: 'rgba(233, 196, 106, 1)',
  goldFade: 'rgba(233, 196, 106, 0.15)',
  blue: 'rgba(72, 149, 239, 1)',
  blueFade: 'rgba(72, 149, 239, 0.15)',
  red: 'rgba(230, 57, 70, 1)',
  redFade: 'rgba(230, 57, 70, 0.15)',
  purple: 'rgba(114, 9, 183, 1)',
  purpleFade: 'rgba(114, 9, 183, 0.15)',
};

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b', maxTicksLimit: 8 },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      ticks: { color: '#64748b' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
};

interface AnalyticsChartsProps {
  session: SessionAnalysis;
}

function sampleFrames(frames: FrameAnalysis[], maxPoints = 60): FrameAnalysis[] {
  if (frames.length <= maxPoints) return frames;
  const step = Math.floor(frames.length / maxPoints);
  return frames.filter((_, i) => i % step === 0);
}

export function KneeFLexionChart({ session }: AnalyticsChartsProps) {
  const frames = sampleFrames(session.frames.filter(f => f.kneeFlexion !== null));
  const labels = frames.map(f => `${f.timestamp.toFixed(1)}s`);

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
        Knee Flexion Over Time
      </h3>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Knee Angle (°)',
              data: frames.map(f => f.kneeFlexion),
              borderColor: CHART_COLORS.green,
              backgroundColor: CHART_COLORS.greenFade,
              fill: true,
              tension: 0.4,
              pointRadius: 2,
            },
            {
              label: 'Ideal Min (130°)',
              data: frames.map(() => 130),
              borderColor: 'rgba(255,255,255,0.2)',
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false,
            },
            {
              label: 'Ideal Max (155°)',
              data: frames.map(() => 155),
              borderColor: 'rgba(255,255,255,0.2)',
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          plugins: {
            ...baseChartOptions.plugins,
            title: { display: false },
          },
          scales: {
            ...baseChartOptions.scales,
            y: {
              ...baseChartOptions.scales.y,
              min: 80,
              max: 180,
              title: { display: true, text: 'Angle (°)', color: '#64748b' },
            },
          },
        }}
      />
    </div>
  );
}

export function WeightDistributionChart({ session }: AnalyticsChartsProps) {
  const frames = sampleFrames(session.frames.filter(f => f.weightDistribution !== null));
  const labels = frames.map(f => `${f.timestamp.toFixed(1)}s`);

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
        Weight Distribution (% Front Foot)
      </h3>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Front Foot Weight (%)',
              data: frames.map(f => f.weightDistribution),
              borderColor: CHART_COLORS.gold,
              backgroundColor: CHART_COLORS.goldFade,
              fill: true,
              tension: 0.4,
              pointRadius: 2,
            },
            {
              label: 'Balanced (50%)',
              data: frames.map(() => 50),
              borderColor: 'rgba(255,255,255,0.2)',
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          scales: {
            ...baseChartOptions.scales,
            y: {
              ...baseChartOptions.scales.y,
              min: 0,
              max: 100,
              title: { display: true, text: '% Forward', color: '#64748b' },
            },
          },
        }}
      />
    </div>
  );
}

export function TechniqueRadarChart({ session }: AnalyticsChartsProps) {
  const feedback = session.feedback;
  const scoreMap: Record<string, number> = {
    excellent: 100,
    good: 75,
    'needs-work': 40,
    critical: 10,
  };

  const categories = ['stance', 'backlift', 'footwork', 'head-position', 'follow-through', 'balance', 'timing'];
  const scores = categories.map(cat => {
    const item = feedback.find(f => f.category === cat);
    return item ? scoreMap[item.severity] : 50;
  });

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
        Technique Radar
      </h3>
      <Radar
        data={{
          labels: ['Stance', 'Backlift', 'Footwork', 'Head Pos.', 'Follow-thru', 'Balance', 'Timing'],
          datasets: [
            {
              label: 'Your Score',
              data: scores,
              backgroundColor: 'rgba(82, 183, 136, 0.2)',
              borderColor: CHART_COLORS.green,
              pointBackgroundColor: CHART_COLORS.green,
              pointBorderColor: '#fff',
              pointHoverRadius: 6,
            },
            {
              label: 'Ideal',
              data: [100, 100, 100, 100, 100, 100, 100],
              backgroundColor: 'rgba(233, 196, 106, 0.05)',
              borderColor: 'rgba(233, 196, 106, 0.4)',
              borderDash: [5, 5],
              pointRadius: 0,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { labels: { color: '#94a3b8' } },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleColor: '#e2e8f0',
              bodyColor: '#94a3b8',
            },
          },
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: { display: false },
              grid: { color: 'rgba(255,255,255,0.08)' },
              angleLines: { color: 'rgba(255,255,255,0.08)' },
              pointLabels: { color: '#94a3b8', font: { size: 11 } },
            },
          },
        }}
      />
    </div>
  );
}

export function ElbowAngleChart({ session }: AnalyticsChartsProps) {
  const frames = sampleFrames(session.frames.filter(f => f.elbowAngle !== null));
  const labels = frames.map(f => `${f.timestamp.toFixed(1)}s`);

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-purple-400 inline-block" />
        Elbow / Backlift Angle
      </h3>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Elbow Angle (°)',
              data: frames.map(f => f.elbowAngle),
              borderColor: CHART_COLORS.purple,
              backgroundColor: CHART_COLORS.purpleFade,
              fill: true,
              tension: 0.4,
              pointRadius: 2,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          scales: {
            ...baseChartOptions.scales,
            y: {
              ...baseChartOptions.scales.y,
              min: 0,
              max: 180,
              title: { display: true, text: 'Angle (°)', color: '#64748b' },
            },
          },
        }}
      />
    </div>
  );
}

export function HeadPositionChart({ session }: AnalyticsChartsProps) {
  const counts = { ideal: 0, 'too-high': 0, 'too-low': 0 };
  session.frames.forEach(f => {
    if (f.headPosition) counts[f.headPosition]++;
  });

  return (
    <div className="glass rounded-2xl p-5 flex flex-col items-center">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2 self-start">
        <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
        Head Position Distribution
      </h3>
      <div className="w-48 h-48">
        <Doughnut
          data={{
            labels: ['Ideal', 'Too High', 'Too Low'],
            datasets: [
              {
                data: [counts.ideal, counts['too-high'], counts['too-low']],
                backgroundColor: [
                  'rgba(82, 183, 136, 0.8)',
                  'rgba(230, 57, 70, 0.8)',
                  'rgba(233, 196, 106, 0.8)',
                ],
                borderColor: ['#52b788', '#e63946', '#e9c46a'],
                borderWidth: 2,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
              legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16 } },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export function HipRotationBar({ session }: AnalyticsChartsProps) {
  const frames = sampleFrames(session.frames.filter(f => f.hipRotation !== null), 30);
  const labels = frames.map(f => `${f.timestamp.toFixed(1)}s`);

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-300 inline-block" />
        Hip Rotation (°)
      </h3>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: 'Hip Rotation (°)',
              data: frames.map(f => f.hipRotation),
              backgroundColor: frames.map(f =>
                (f.hipRotation ?? 0) >= 15 && (f.hipRotation ?? 0) <= 40
                  ? CHART_COLORS.green
                  : CHART_COLORS.gold,
              ),
              borderRadius: 4,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          scales: {
            ...baseChartOptions.scales,
            y: {
              ...baseChartOptions.scales.y,
              title: { display: true, text: 'Degrees (°)', color: '#64748b' },
            },
          },
        }}
      />
    </div>
  );
}
