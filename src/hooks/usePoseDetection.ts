import { useRef, useState, useCallback } from 'react';
import type { Pose, FrameAnalysis } from '../types';
import { analyzeFrame } from '../utils/poseUtils';

export type DetectorState = 'idle' | 'loading' | 'ready' | 'error' | 'unavailable';

interface UsePoseDetectionReturn {
  detectorState: DetectorState;
  initDetector: () => Promise<void>;
  analyzeImageTensor: (pixels: Float32Array | Uint8Array, width: number, height: number, timestamp: number) => Promise<FrameAnalysis>;
  drawPoseToPoints: (pose: Pose) => Array<{ x: number; y: number; name: string; score: number }>;
}

export function usePoseDetection(): UsePoseDetectionReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectorRef = useRef<any>(null);
  const [detectorState, setDetectorState] = useState<DetectorState>('idle');

  const initDetector = useCallback(async () => {
    if (detectorRef.current) return;
    setDetectorState('loading');
    try {
      // Dynamic import to avoid crashing on web/simulator where native GL isn't available
      const tf = await import('@tensorflow/tfjs-core');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      await import('@tensorflow/tfjs-react-native');
      await tf.ready();

      const poseDetection = await import('@tensorflow-models/pose-detection');
      detectorRef.current = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING, enableSmoothing: true },
      );
      setDetectorState('ready');
    } catch (err) {
      console.warn('TF.js pose detector unavailable, using simulation mode:', err);
      setDetectorState('unavailable');
    }
  }, []);

  const analyzeImageTensor = useCallback(
    async (pixels: Float32Array | Uint8Array, width: number, height: number, timestamp: number): Promise<FrameAnalysis> => {
      if (!detectorRef.current || detectorState !== 'ready') {
        return analyzeFrame(null, timestamp);
      }
      try {
        const tf = await import('@tensorflow/tfjs-core');
        const imageTensor = tf.tensor3d(pixels, [height, width, 3], 'float32');
        const poses = await detectorRef.current.estimatePoses(imageTensor);
        imageTensor.dispose();

        if (!poses.length) return analyzeFrame(null, timestamp);
        const raw = poses[0];
        const pose: Pose = {
          score: raw.score ?? 0,
          keypoints: raw.keypoints.map((kp: { x: number; y: number; score?: number; name?: string }) => ({
            x: kp.x, y: kp.y, score: kp.score ?? 0, name: kp.name ?? '',
          })),
        };
        return analyzeFrame(pose, timestamp);
      } catch {
        return analyzeFrame(null, timestamp);
      }
    },
    [detectorState],
  );

  const drawPoseToPoints = useCallback((pose: Pose) => {
    return pose.keypoints.filter(kp => kp.score > 0.3);
  }, []);

  return { detectorState, initDetector, analyzeImageTensor, drawPoseToPoints };
}
