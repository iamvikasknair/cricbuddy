import { useEffect, useRef, useState, useCallback } from 'react';
import type { Pose, FrameAnalysis } from '../types';
import { analyzeFrame } from '../utils/poseUtils';

// TF.js ecosystem is loaded via CDN globals in index.html
declare global {
  interface Window {
    tf: {
      setBackend: (b: string) => Promise<void>;
      ready: () => Promise<void>;
    };
    poseDetection: {
      createDetector: (model: string, config: object) => Promise<PoseDetectorInstance>;
      SupportedModels: { MoveNet: string };
      movenet: { modelType: { SINGLEPOSE_LIGHTNING: string; SINGLEPOSE_THUNDER: string } };
    };
  }
}

interface PoseDetectorInstance {
  estimatePoses: (img: HTMLVideoElement | HTMLCanvasElement) => Promise<RawPose[]>;
  dispose: () => void;
}

interface RawPose {
  score?: number;
  keypoints: Array<{ x: number; y: number; score?: number; name?: string }>;
}

export type DetectorState = 'idle' | 'loading' | 'ready' | 'error';

interface UsePoseDetectionReturn {
  detectorState: DetectorState;
  initDetector: () => Promise<void>;
  analyzeVideoFrame: (
    videoEl: HTMLVideoElement | HTMLCanvasElement,
    timestamp: number,
  ) => Promise<FrameAnalysis>;
  drawPose: (canvas: HTMLCanvasElement, pose: Pose | null) => void;
}

const SKELETON_CONNECTIONS: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['nose', 'left_shoulder'],
  ['nose', 'right_shoulder'],
];

const KEYPOINT_COLORS: Record<string, string> = {
  nose: '#e9c46a',
  left_shoulder: '#52b788',
  right_shoulder: '#52b788',
  left_elbow: '#74c69d',
  right_elbow: '#74c69d',
  left_wrist: '#f4a261',
  right_wrist: '#f4a261',
  left_hip: '#4895ef',
  right_hip: '#4895ef',
  left_knee: '#4cc9f0',
  right_knee: '#4cc9f0',
  left_ankle: '#7209b7',
  right_ankle: '#7209b7',
};

export function usePoseDetection(): UsePoseDetectionReturn {
  const detectorRef = useRef<PoseDetectorInstance | null>(null);
  const [detectorState, setDetectorState] = useState<DetectorState>('idle');

  const initDetector = useCallback(async () => {
    if (detectorRef.current) return;
    if (!window.tf || !window.poseDetection) {
      // CDN scripts not loaded yet — retry once
      await new Promise(r => setTimeout(r, 2000));
      if (!window.tf || !window.poseDetection) {
        setDetectorState('error');
        return;
      }
    }
    setDetectorState('loading');
    try {
      await window.tf.setBackend('webgl');
      await window.tf.ready();
      detectorRef.current = await window.poseDetection.createDetector(
        window.poseDetection.SupportedModels.MoveNet,
        {
          modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        },
      );
      setDetectorState('ready');
    } catch (err) {
      console.error('Pose detector init failed:', err);
      setDetectorState('error');
    }
  }, []);

  const analyzeVideoFrame = useCallback(
    async (
      videoEl: HTMLVideoElement | HTMLCanvasElement,
      timestamp: number,
    ): Promise<FrameAnalysis> => {
      if (!detectorRef.current) return analyzeFrame(null, timestamp);
      try {
        const poses = await detectorRef.current.estimatePoses(videoEl);
        if (poses.length === 0) return analyzeFrame(null, timestamp);

        const rawPose = poses[0];
        const pose: Pose = {
          score: rawPose.score ?? 0,
          keypoints: rawPose.keypoints.map(kp => ({
            x: kp.x,
            y: kp.y,
            score: kp.score ?? 0,
            name: kp.name ?? '',
          })),
        };
        return analyzeFrame(pose, timestamp);
      } catch {
        return analyzeFrame(null, timestamp);
      }
    },
    [],
  );

  const drawPose = useCallback((canvas: HTMLCanvasElement, pose: Pose | null) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!pose) return;

    const kpMap: Record<string, { x: number; y: number; score: number }> = {};
    pose.keypoints.forEach(kp => {
      if (kp.score > 0.3) kpMap[kp.name] = kp;
    });

    // Draw connections
    SKELETON_CONNECTIONS.forEach(([a, b]) => {
      const kpA = kpMap[a];
      const kpB = kpMap[b];
      if (!kpA || !kpB) return;
      ctx.beginPath();
      ctx.moveTo(kpA.x, kpA.y);
      ctx.lineTo(kpB.x, kpB.y);
      ctx.strokeStyle = 'rgba(82, 183, 136, 0.85)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    });

    // Draw keypoints
    pose.keypoints.forEach(kp => {
      if (kp.score < 0.3) return;
      const color = KEYPOINT_COLORS[kp.name] ?? '#ffffff';
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, []);

  useEffect(() => {
    return () => {
      detectorRef.current?.dispose();
    };
  }, []);

  return { detectorState, initDetector, analyzeVideoFrame, drawPose };
}
