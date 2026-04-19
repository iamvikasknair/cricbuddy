import { CheckCircle, AlertCircle, AlertTriangle, Star } from 'lucide-react';
import type { CoachingFeedback, SessionAnalysis, ShotType } from '../../types';

interface FeedbackPanelProps {
  session: SessionAnalysis;
}

const SEVERITY_CONFIG = {
  excellent: {
    icon: Star,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/30',
    badge: 'bg-green-500/20 text-green-300',
    label: 'Excellent',
  },
  good: {
    icon: CheckCircle,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300',
    label: 'Good',
  },
  'needs-work': {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-300',
    label: 'Needs Work',
  },
  critical: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    badge: 'bg-red-500/20 text-red-300',
    label: 'Critical',
  },
};

const SHOT_LABELS: Record<ShotType, string> = {
  drive: 'Front Foot Drive',
  pull: 'Pull Shot',
  cut: 'Cut Shot',
  sweep: 'Sweep Shot',
  defence: 'Defensive Shot',
  unknown: 'Unknown Shot',
};

const SHOT_TIPS: Record<ShotType, string> = {
  drive: 'Focus on leading with the elbow and playing close to the body.',
  pull: 'Get inside the line early and roll the wrists at contact.',
  cut: 'Position behind the line and hit with a horizontal bat.',
  sweep: 'Get down on one knee and keep the head over the ball.',
  defence: 'Meet the ball under your eyes with soft hands.',
  unknown: 'Continue practising to build a consistent shot pattern.',
};

function ScoreRing({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#52b788' : score >= 60 ? '#e9c46a' : '#e63946';

  return (
    <svg width={120} height={120} className="rotate-[-90deg]">
      <circle cx={60} cy={60} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle
        cx={60}
        cy={60}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x={60}
        y={60}
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#fff"
        fontSize={24}
        fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: '60px 60px' }}
      >
        {score}
      </text>
    </svg>
  );
}

function FeedbackCard({ item }: { item: CoachingFeedback }) {
  const cfg = SEVERITY_CONFIG[item.severity];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border p-4 fade-in ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={`${cfg.color} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-white font-semibold text-sm">{item.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">{item.detail}</p>
        </div>
      </div>
    </div>
  );
}

export function FeedbackPanel({ session }: FeedbackPanelProps) {
  const { overallScore, shotType, feedback, duration, frames } = session;

  const validFrames = frames.filter(f => f.pose !== null);
  const poseAccuracy = frames.length > 0 ? Math.round((validFrames.length / frames.length) * 100) : 0;

  const avgKnee =
    validFrames.length > 0
      ? validFrames.reduce((s, f) => s + (f.kneeFlexion ?? 0), 0) / validFrames.length
      : null;
  const avgWeight =
    validFrames.length > 0
      ? validFrames.reduce((s, f) => s + (f.weightDistribution ?? 0), 0) / validFrames.length
      : null;

  const excellent = feedback.filter(f => f.severity === 'excellent').length;
  const critical = feedback.filter(f => f.severity === 'critical').length;

  return (
    <div className="flex flex-col gap-5 fade-in">
      {/* Score header */}
      <div className="glass rounded-2xl p-6 flex items-center gap-6 flex-wrap">
        <ScoreRing score={overallScore} />
        <div className="flex-1 min-w-0">
          <div className="text-slate-400 text-sm mb-1">Overall Technique Score</div>
          <div className="text-white text-3xl font-bold mb-1">{overallScore} / 100</div>
          <div className="text-slate-300 text-sm">
            Shot detected:{' '}
            <span className="text-yellow-300 font-semibold">{SHOT_LABELS[shotType]}</span>
          </div>
          <div className="text-slate-400 text-xs mt-1 italic">{SHOT_TIPS[shotType]}</div>
        </div>
        <div className="flex flex-col gap-2 text-sm min-w-[140px]">
          <StatRow label="Duration" value={`${duration.toFixed(1)}s`} />
          <StatRow label="Frames Analysed" value={`${validFrames.length}`} />
          <StatRow label="Pose Accuracy" value={`${poseAccuracy}%`} />
          {avgKnee !== null && <StatRow label="Avg Knee Flex" value={`${avgKnee.toFixed(0)}°`} />}
          {avgWeight !== null && (
            <StatRow label="Avg Fwd Weight" value={`${avgWeight.toFixed(0)}%`} />
          )}
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        <SummaryBadge count={excellent} label="Strengths" color="green" />
        <SummaryBadge count={feedback.filter(f => f.severity === 'good').length} label="Good" color="blue" />
        <SummaryBadge
          count={feedback.filter(f => f.severity === 'needs-work').length}
          label="Needs Work"
          color="yellow"
        />
        <SummaryBadge count={critical} label="Critical" color="red" />
      </div>

      {/* Feedback cards — sorted by severity */}
      <div className="flex flex-col gap-3">
        <h3 className="text-white font-semibold text-lg">Coaching Feedback</h3>
        {[...feedback]
          .sort((a, b) => {
            const order = { critical: 0, 'needs-work': 1, good: 2, excellent: 3 };
            return order[a.severity] - order[b.severity];
          })
          .map((item, i) => (
            <FeedbackCard key={i} item={item} />
          ))}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-mono font-semibold">{value}</span>
    </div>
  );
}

function SummaryBadge({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
}) {
  const colors = {
    green: 'bg-green-500/15 text-green-300 border-green-500/30',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    yellow: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    red: 'bg-red-500/15 text-red-300 border-red-500/30',
  };
  return (
    <div className={`border rounded-xl px-4 py-2 flex items-center gap-2 ${colors[color]}`}>
      <span className="text-xl font-bold">{count}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
