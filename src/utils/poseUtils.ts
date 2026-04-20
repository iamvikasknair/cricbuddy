import type { Keypoint, Pose, FrameAnalysis, CoachingFeedback, ShotType } from '../types';

export function calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(rad * (180 / Math.PI));
  if (deg > 180) deg = 360 - deg;
  return deg;
}

export function getKeypoint(pose: Pose, name: string): Keypoint | null {
  const kp = pose.keypoints.find(k => k.name === name);
  return kp && kp.score > 0.3 ? kp : null;
}

export function analyzeFrame(pose: Pose | null, timestamp: number): FrameAnalysis {
  if (!pose) {
    return { timestamp, pose: null, batAngle: null, kneeFlexion: null, hipRotation: null, headPosition: null, weightDistribution: null, elbowAngle: null };
  }

  const get = (name: string) => getKeypoint(pose, name);
  const leftShoulder = get('left_shoulder');
  const rightShoulder = get('right_shoulder');
  const rightElbow = get('right_elbow');
  const leftWrist = get('left_wrist');
  const rightWrist = get('right_wrist');
  const leftHip = get('left_hip');
  const rightHip = get('right_hip');
  const leftKnee = get('left_knee');
  const rightKnee = get('right_knee');
  const leftAnkle = get('left_ankle');
  const rightAnkle = get('right_ankle');
  const nose = get('nose');

  let kneeFlexion: number | null = null;
  if (leftHip && leftKnee && leftAnkle && rightHip && rightKnee && rightAnkle) {
    kneeFlexion = (calculateAngle(leftHip, leftKnee, leftAnkle) + calculateAngle(rightHip, rightKnee, rightAnkle)) / 2;
  }

  let hipRotation: number | null = null;
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderAngle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x) * (180 / Math.PI);
    const hipAngle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x) * (180 / Math.PI);
    hipRotation = Math.abs(shoulderAngle - hipAngle);
  }

  let batAngle: number | null = null;
  if (leftWrist && rightWrist) {
    batAngle = Math.abs(Math.atan2(rightWrist.y - leftWrist.y, rightWrist.x - leftWrist.x) * (180 / Math.PI));
  }

  let headPosition: FrameAnalysis['headPosition'] = null;
  if (nose && leftHip && rightHip) {
    const hipY = (leftHip.y + rightHip.y) / 2;
    const rel = (hipY - nose.y) / hipY;
    headPosition = rel > 0.45 ? 'ideal' : rel > 0.3 ? 'too-low' : 'too-high';
  }

  let weightDistribution: number | null = null;
  if (leftAnkle && rightAnkle && leftHip && rightHip) {
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const span = Math.abs(leftAnkle.x - rightAnkle.x);
    if (span > 0) {
      const front = leftAnkle.x < rightAnkle.x ? leftAnkle : rightAnkle;
      weightDistribution = Math.min(100, Math.max(0, ((hipMidX - front.x) / span) * 100));
    }
  }

  let elbowAngle: number | null = null;
  if (rightShoulder && rightElbow && rightWrist) {
    elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  }

  return { timestamp, pose, batAngle, kneeFlexion, hipRotation, headPosition, weightDistribution, elbowAngle };
}

export function detectShotType(frames: FrameAnalysis[]): ShotType {
  const valid = frames.filter(f => f.batAngle !== null);
  if (!valid.length) return 'unknown';
  const avgBat = valid.reduce((s, f) => s + (f.batAngle ?? 0), 0) / valid.length;
  const avgKnee = valid.reduce((s, f) => s + (f.kneeFlexion ?? 160), 0) / valid.length;
  const avgWeight = valid.reduce((s, f) => s + (f.weightDistribution ?? 50), 0) / valid.length;
  if (avgKnee < 130 && avgWeight > 55) return 'drive';
  if (avgBat > 60 && avgWeight < 45) return 'pull';
  if (avgBat > 45 && avgWeight < 50) return 'cut';
  if (avgKnee < 120) return 'sweep';
  if (avgKnee > 155) return 'defence';
  return 'unknown';
}

export function generateFeedback(frames: FrameAnalysis[]): CoachingFeedback[] {
  const valid = frames.filter(f => f.pose !== null);
  if (!valid.length) return [];

  const avg = (key: keyof FrameAnalysis, fallback: number) =>
    valid.reduce((s, f) => s + ((f[key] as number) ?? fallback), 0) / valid.length;

  const avgKnee = avg('kneeFlexion', 160);
  const avgElbow = avg('elbowAngle', 90);
  const avgWeight = avg('weightDistribution', 50);
  const avgHip = avg('hipRotation', 0);

  const headCounts = { ideal: 0, 'too-high': 0, 'too-low': 0 };
  valid.forEach(f => { if (f.headPosition) headCounts[f.headPosition]++; });
  const dominantHead = (Object.entries(headCounts) as [string, number][])
    .reduce((a, b) => b[1] > a[1] ? b : a)[0] as FrameAnalysis['headPosition'];

  const feedback: CoachingFeedback[] = [];

  if (avgKnee >= 130 && avgKnee <= 155)
    feedback.push({ category: 'stance', severity: 'excellent', title: 'Excellent Batting Stance', detail: `Knee flexion ${avgKnee.toFixed(0)}° is ideal. Solid, balanced base.` });
  else if (avgKnee > 155)
    feedback.push({ category: 'stance', severity: 'needs-work', title: 'Knees Too Straight', detail: `Knee angle ${avgKnee.toFixed(0)}° — bend to 130–155° for balance and power.` });
  else
    feedback.push({ category: 'stance', severity: 'critical', title: 'Over-Crouching', detail: `Knee angle ${avgKnee.toFixed(0)}° is too deep. Raise stance for better mobility.` });

  if (dominantHead === 'ideal')
    feedback.push({ category: 'head-position', severity: 'excellent', title: 'Great Head Position', detail: 'Head stays over the ball, eyes level — a hallmark of elite batsmen.' });
  else if (dominantHead === 'too-high')
    feedback.push({ category: 'head-position', severity: 'needs-work', title: 'Head Falling Back', detail: 'Head pulling away from the ball. Keep eyes level, chin pointing toward pitch.' });
  else if (dominantHead === 'too-low')
    feedback.push({ category: 'head-position', severity: 'good', title: 'Slightly Low Head', detail: 'Head slightly low, restricting vision. Keep chin parallel to ground at contact.' });

  if (avgWeight >= 40 && avgWeight <= 65)
    feedback.push({ category: 'balance', severity: 'good', title: 'Good Weight Balance', detail: `${avgWeight.toFixed(0)}% front-foot weight is well-balanced for shot-making.` });
  else if (avgWeight > 65)
    feedback.push({ category: 'balance', severity: 'needs-work', title: 'Falling Forward', detail: `${avgWeight.toFixed(0)}% forward weight — maintain centre of gravity across both feet.` });
  else
    feedback.push({ category: 'balance', severity: 'needs-work', title: 'Too Much Back-Foot Weight', detail: `${avgWeight.toFixed(0)}% back-foot — transfer weight forward on front-foot drives.` });

  if (avgElbow >= 80 && avgElbow <= 130)
    feedback.push({ category: 'backlift', severity: 'excellent', title: 'Textbook Backlift', detail: `Elbow ${avgElbow.toFixed(0)}° indicates a high, correct backlift toward mid-on.` });
  else if (avgElbow < 80)
    feedback.push({ category: 'backlift', severity: 'critical', title: 'Low Backlift', detail: `Elbow ${avgElbow.toFixed(0)}° — flat backlift detected. Raise bat higher for more power.` });
  else
    feedback.push({ category: 'backlift', severity: 'good', title: 'High Backlift', detail: `Generous backlift (${avgElbow.toFixed(0)}°). Ensure bat comes down straight for control.` });

  if (avgHip >= 15 && avgHip <= 40)
    feedback.push({ category: 'follow-through', severity: 'excellent', title: 'Good Hip Rotation', detail: `${avgHip.toFixed(0)}° hip rotation generating strong power through the shot.` });
  else if (avgHip < 15)
    feedback.push({ category: 'follow-through', severity: 'needs-work', title: 'Limited Hip Rotation', detail: 'Hips not rotating enough. Drive hips toward bowler to generate power.' });

  return feedback;
}

export function computeOverallScore(frames: FrameAnalysis[]): number {
  const feedback = generateFeedback(frames);
  if (!feedback.length) return 0;
  const weights: Record<string, number> = { excellent: 100, good: 75, 'needs-work': 40, critical: 10 };
  return Math.round(feedback.reduce((s, f) => s + weights[f.severity], 0) / feedback.length);
}
