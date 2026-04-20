import type { FrameAnalysis, Pose } from '../types';

// Generates a realistic front-foot drive sequence for demo/testing
// Simulates 24 frames over 2.4s with biomechanically plausible values
export function simulateSession(frameCount = 24, duration = 2.4): FrameAnalysis[] {
  const frames: FrameAnalysis[] = [];

  for (let i = 0; i < frameCount; i++) {
    const t = (i / frameCount) * duration;
    const progress = i / frameCount; // 0 → 1

    // Knee bends deeper mid-shot then recovers
    const kneeFlexion = 165 - 30 * Math.sin(progress * Math.PI);
    // Elbow rises through backlift phase
    const elbowAngle = 60 + 60 * Math.sin(progress * Math.PI * 0.8);
    // Weight transfers forward through shot
    const weightDistribution = 35 + 30 * progress;
    // Hip rotation accelerates through contact
    const hipRotation = 5 + 35 * Math.sin(progress * Math.PI * 0.9);
    // Bat angle changes through swing
    const batAngle = 20 + 50 * Math.sin(progress * Math.PI);

    // Add slight randomness for realism
    const jitter = (range: number) => (Math.random() - 0.5) * range;

    // Build a simplified pose (scaled to a 480×640 viewport)
    const pose = buildBatsmanPose(progress);

    const headPosition: FrameAnalysis['headPosition'] =
      progress < 0.2 ? 'ideal' : progress < 0.7 ? 'ideal' : Math.random() > 0.7 ? 'too-high' : 'ideal';

    frames.push({
      timestamp: t,
      pose,
      kneeFlexion: kneeFlexion + jitter(4),
      elbowAngle: elbowAngle + jitter(6),
      weightDistribution: weightDistribution + jitter(5),
      hipRotation: hipRotation + jitter(3),
      batAngle: batAngle + jitter(5),
      headPosition,
    });
  }

  return frames;
}

function buildBatsmanPose(progress: number): Pose {
  const cx = 240;
  const baseY = 100;

  const kneeY = baseY + 200 + 20 * Math.sin(progress * Math.PI);
  const hipY = baseY + 150;
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
      kp('left_hip', cx - 30, hipY),
      kp('right_hip', cx + 30, hipY),
      kp('left_knee', cx - 40 - footForward, kneeY),
      kp('right_knee', cx + 20, kneeY - 10),
      kp('left_ankle', cx - 55 - footForward, baseY + 300),
      kp('right_ankle', cx + 35, baseY + 290),
    ],
  };
}
