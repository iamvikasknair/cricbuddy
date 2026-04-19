import { useState, useCallback } from 'react';
import { Activity, ChevronRight, Target, TrendingUp, BarChart2 } from 'lucide-react';
import { VideoCapture } from '../VideoCapture/VideoCapture';
import { VideoAnalyser } from '../PoseAnalysis/VideoAnalyser';
import { FeedbackPanel } from '../Feedback/FeedbackPanel';
import {
  KneeFLexionChart,
  WeightDistributionChart,
  TechniqueRadarChart,
  ElbowAngleChart,
  HeadPositionChart,
  HipRotationBar,
} from '../Charts/AnalyticsCharts';
import type { SessionAnalysis } from '../../types';

type Tab = 'capture' | 'analyse' | 'charts' | 'feedback';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'capture', label: 'Capture', icon: Activity },
  { id: 'analyse', label: 'Analyse', icon: Target },
  { id: 'charts', label: 'Charts', icon: BarChart2 },
  { id: 'feedback', label: 'Feedback', icon: TrendingUp },
];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('capture');
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [session, setSession] = useState<SessionAnalysis | null>(null);

  const handleVideoReady = useCallback((src: string) => {
    setVideoSrc(src);
    setActiveTab('analyse');
  }, []);

  const handleAnalysisComplete = useCallback((s: SessionAnalysis) => {
    setSession(s);
  }, []);

  const canNavigate = (tab: Tab) => {
    if (tab === 'capture') return true;
    if (tab === 'analyse') return videoSrc !== null;
    if (tab === 'charts' || tab === 'feedback') return session !== null;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
            <span className="text-lg">🏏</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">CricBuddy</h1>
            <p className="text-slate-500 text-xs">AI Cricket Coach</p>
          </div>
        </div>
        {session && (
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${session.overallScore >= 80 ? 'bg-green-400' : session.overallScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
            />
            <span className="text-slate-300">
              Score: <span className="text-white font-semibold">{session.overallScore}/100</span>
            </span>
          </div>
        )}
      </header>

      {/* Tab bar */}
      <nav className="glass border-b border-white/10 px-4 flex gap-1 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const enabled = canNavigate(tab.id);
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => enabled && setActiveTab(tab.id)}
              disabled={!enabled}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                active
                  ? 'border-green-400 text-green-300'
                  : enabled
                    ? 'border-transparent text-slate-400 hover:text-slate-200'
                    : 'border-transparent text-slate-600 cursor-not-allowed'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.id === 'analyse' && session && (
                <span className="w-2 h-2 rounded-full bg-green-400 ml-1" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {activeTab === 'capture' && (
          <div className="fade-in">
            <VideoCapture
              onVideoReady={handleVideoReady}
              onRecordingComplete={() => {}}
            />
            {videoSrc && (
              <div className="mt-6 p-4 glass rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-slate-300 text-sm">Video loaded and ready for analysis</span>
                </div>
                <button
                  onClick={() => setActiveTab('analyse')}
                  className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium transition-colors cursor-pointer"
                >
                  Go to Analyse <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analyse' && videoSrc && (
          <div className="fade-in flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-semibold text-xl">Video Analysis</h2>
              {session && (
                <button
                  onClick={() => setActiveTab('feedback')}
                  className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium transition-colors cursor-pointer"
                >
                  View Feedback <ChevronRight size={16} />
                </button>
              )}
            </div>
            <VideoAnalyser
              videoSrc={videoSrc}
              onAnalysisComplete={result => {
                handleAnalysisComplete(result);
              }}
            />
          </div>
        )}

        {activeTab === 'charts' && session && (
          <div className="fade-in flex flex-col gap-5">
            <h2 className="text-white font-semibold text-xl">Performance Charts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TechniqueRadarChart session={session} />
              <HeadPositionChart session={session} />
              <KneeFLexionChart session={session} />
              <WeightDistributionChart session={session} />
              <ElbowAngleChart session={session} />
              <HipRotationBar session={session} />
            </div>
          </div>
        )}

        {activeTab === 'feedback' && session && (
          <div className="fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-xl">Coaching Feedback</h2>
              <button
                onClick={() => setActiveTab('charts')}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors cursor-pointer"
              >
                View Charts <ChevronRight size={16} />
              </button>
            </div>
            <FeedbackPanel session={session} />
          </div>
        )}

        {/* Empty states */}
        {activeTab === 'charts' && !session && (
          <EmptyState message="Run an analysis first to see performance charts" />
        )}
        {activeTab === 'feedback' && !session && (
          <EmptyState message="Run an analysis first to see coaching feedback" />
        )}
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🏏</div>
      <p className="text-slate-400 text-lg">{message}</p>
    </div>
  );
}
