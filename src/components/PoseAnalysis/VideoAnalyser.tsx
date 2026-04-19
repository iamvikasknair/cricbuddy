import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, SkipBack, Cpu, AlertCircle } from 'lucide-react';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import type { FrameAnalysis, SessionAnalysis } from '../../types';
import { generateFeedback, computeOverallScore, detectShotType } from '../../utils/poseUtils';

interface VideoAnalyserProps {
  videoSrc: string;
  onAnalysisComplete: (session: SessionAnalysis) => void;
}

export function VideoAnalyser({ videoSrc, onAnalysisComplete }: VideoAnalyserProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const framesRef = useRef<FrameAnalysis[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState<FrameAnalysis | null>(null);
  const [analysisReady, setAnalysisReady] = useState(false);

  const { detectorState, initDetector, analyzeVideoFrame, drawPose } = usePoseDetection();

  useEffect(() => {
    initDetector();
  }, [initDetector]);

  const syncCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!video || !canvas || !overlay) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    overlay.width = canvas.width;
    overlay.height = canvas.height;
  }, []);

  const drawVideoFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }, []);

  const runAnalysis = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!video || !canvas || !overlay || detectorState !== 'ready') return;

    framesRef.current = [];
    setIsAnalysing(true);
    setAnalysisReady(false);
    video.pause();
    video.currentTime = 0;

    await new Promise<void>(res => {
      video.onseeked = () => res();
    });

    syncCanvasSize();
    const duration = video.duration;
    const sampleInterval = 0.1; // sample every 100ms
    let time = 0;

    while (time <= duration) {
      video.currentTime = time;
      await new Promise<void>(res => {
        video.onseeked = () => res();
      });

      drawVideoFrame();
      const frame = await analyzeVideoFrame(canvas, time);
      framesRef.current.push(frame);

      if (frame.pose && overlay) {
        drawPose(overlay, frame.pose);
      }
      setCurrentFrame(frame);
      setProgress(Math.min(100, Math.round((time / duration) * 100)));
      time += sampleInterval;
    }

    const frames = framesRef.current;
    const session: SessionAnalysis = {
      sessionId: `session_${Date.now()}`,
      startTime: Date.now(),
      duration,
      frames,
      shotType: detectShotType(frames),
      overallScore: computeOverallScore(frames),
      feedback: generateFeedback(frames),
    };

    setIsAnalysing(false);
    setAnalysisReady(true);
    setProgress(100);
    onAnalysisComplete(session);
    video.currentTime = 0;
  }, [detectorState, syncCanvasSize, drawVideoFrame, analyzeVideoFrame, drawPose, onAnalysisComplete]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      const tick = () => {
        drawVideoFrame();
        const canvas = canvasRef.current;
        if (canvas && overlayRef.current) {
          const frameTime = video.currentTime;
          const nearest = framesRef.current.reduce<FrameAnalysis | null>((best, f) => {
            if (!best) return f;
            return Math.abs(f.timestamp - frameTime) < Math.abs(best.timestamp - frameTime) ? f : best;
          }, null);
          if (nearest?.pose) drawPose(overlayRef.current, nearest.pose);
        }
        if (!video.paused) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      video.pause();
      setIsPlaying(false);
      cancelAnimationFrame(rafRef.current);
    }
  }, [drawVideoFrame, drawPose]);

  const restart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
    drawVideoFrame();
  }, [drawVideoFrame]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoad = () => {
      syncCanvasSize();
      drawVideoFrame();
    };
    video.addEventListener('loadeddata', onLoad);
    return () => video.removeEventListener('loadeddata', onLoad);
  }, [syncCanvasSize, drawVideoFrame]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Hidden source video */}
      <video ref={videoRef} src={videoSrc} className="hidden" preload="auto" crossOrigin="anonymous" />

      {/* Display canvas with pose overlay */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black">
        <canvas ref={canvasRef} className="w-full block" />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'screen' }}
        />

        {isAnalysing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            <Cpu size={40} className="text-green-400 mb-3 animate-pulse" />
            <p className="text-white font-semibold text-lg mb-3">Analysing Batting Technique…</p>
            <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-slate-400 text-sm mt-2">{progress}%</p>
          </div>
        )}

        {detectorState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <p className="text-slate-300 text-sm">Loading AI model…</p>
          </div>
        )}

        {detectorState === 'error' && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2">
            <AlertCircle size={16} className="text-red-400" />
            <span className="text-red-300 text-sm">Pose model unavailable — analysis limited</span>
          </div>
        )}

        {/* Live metric HUD */}
        {currentFrame && !isAnalysing && analysisReady && (
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {currentFrame.kneeFlexion !== null && (
              <MetricPill label="Knee" value={`${currentFrame.kneeFlexion.toFixed(0)}°`} />
            )}
            {currentFrame.elbowAngle !== null && (
              <MetricPill label="Elbow" value={`${currentFrame.elbowAngle.toFixed(0)}°`} />
            )}
            {currentFrame.weightDistribution !== null && (
              <MetricPill
                label="Weight"
                value={`${currentFrame.weightDistribution.toFixed(0)}% fwd`}
              />
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={togglePlay}
          disabled={isAnalysing}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={restart}
          disabled={isAnalysing}
          className="p-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer"
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={runAnalysis}
          disabled={isAnalysing || detectorState === 'loading'}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-xl font-semibold transition-all cursor-pointer ml-auto"
        >
          <Cpu size={18} />
          {isAnalysing ? 'Analysing…' : analysisReady ? 'Re-Analyse' : 'Analyse Shot'}
        </button>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-mono font-semibold">{value}</span>
    </div>
  );
}
