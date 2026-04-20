import type { FrameAnalysis, Pose } from '../types';

export function simulateSession(frameCount = 30, duration = 3.0): FrameAnalysis[] {
  const frames: FrameAnalysis[] = [];
  for (let i = 0; i < frameCount; i++) {
    const t = (i / frameCount) * duration;
    const p = i / frameCount;
    const jitter = (r: number) => (Math.random() - 0.5) * r;
    frames.push({
      timestamp: t,
      pose: buildBatsmanPose(p),
      kneeFlexion: 165 - 30 * Math.sin(p * Math.PI) + jitter(4),
      elbowAngle: 60 + 60 * Math.sin(p * Math.PI * 0.8) + jitter(6),
      weightDistribution: 35 + 30 * p + jitter(5),
      hipRotation: 5 + 35 * Math.sin(p * Math.PI * 0.9) + jitter(3),
      batAngle: 20 + 50 * Math.sin(p * Math.PI) + jitter(5),
      headPosition: p < 0.7 ? 'ideal' : Math.random() > 0.7 ? 'too-high' : 'ideal',
    });
  }
  return frames;
}

function buildBatsmanPose(progress: number): Pose {
  const cx = 240, baseY = 100;
  const kneeY = baseY + 200 + 20 * Math.sin(progress * Math.PI);
  const shoulderY = baseY + 80;
  const elbowRaise = 30 * Math.sin(progress * Math.PI * 0.8);
  const footForward = 30 * progress;
  const kp = (name: string, x: number, y: number) => ({ name, x, y, score: 0.9 });
  return {
    score: 0.88,
    keypoints: [
      kp('nose', cx, baseY + 20),
      kp('left_shoulder', cx - 35, shoulderY),
      kp('right_shoulder', cx + 35, shoulderY),
      kp('left_elbow', cx - 50, shoulderY + 40 - elbowRaise),
      kp('right_elbow', cx + 50, shoulderY + 40 - elbowRaise * 0.5),
      kp('left_wrist', cx - 60, shoulderY + 80 - elbowRaise * 1.2),
      kp('right_wrist', cx + 60, shoulderY + 75 - elbowRaise),
      kp('left_hip', cx - 30, baseY + 150),
      kp('right_hip', cx + 30, baseY + 150),
      kp('left_knee', cx - 40 - footForward, kneeY),
      kp('right_knee', cx + 20, kneeY - 10),
      kp('left_ankle', cx - 55 - footForward, baseY + 300),
      kp('right_ankle', cx + 35, baseY + 290),
    ],
  };
}
