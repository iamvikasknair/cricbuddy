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
    return {
      timestamp,
      pose: null,
      batAngle: null,
      kneeFlexion: null,
      hipRotation: null,
      headPosition: null,
      weightDistribution: null,
      elbowAngle: null,
    };
  }

  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const rightShoulder = getKeypoint(pose, 'right_shoulder');
  const rightElbow = getKeypoint(pose, 'right_elbow');
  const leftWrist = getKeypoint(pose, 'left_wrist');
  const rightWrist = getKeypoint(pose, 'right_wrist');
  const leftHip = getKeypoint(pose, 'left_hip');
  const rightHip = getKeypoint(pose, 'right_hip');
  const leftKnee = getKeypoint(pose, 'left_knee');
  const rightKnee = getKeypoint(pose, 'right_knee');
  const leftAnkle = getKeypoint(pose, 'left_ankle');
  const rightAnkle = getKeypoint(pose, 'right_ankle');
  const nose = getKeypoint(pose, 'nose');

  // Knee flexion (average both knees)
  let kneeFlexion: number | null = null;
  if (leftHip && leftKnee && leftAnkle && rightHip && rightKnee && rightAnkle) {
    const leftFlex = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightFlex = calculateAngle(rightHip, rightKnee, rightAnkle);
    kneeFlexion = (leftFlex + rightFlex) / 2;
  }

  // Hip rotation: angle between shoulders relative to hips
  let hipRotation: number | null = null;
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x,
    ) * (180 / Math.PI);
    const hipAngle = Math.atan2(
      rightHip.y - leftHip.y,
      rightHip.x - leftHip.x,
    ) * (180 / Math.PI);
    hipRotation = Math.abs(shoulderAngle - hipAngle);
  }

  // Bat angle: estimated from wrist-to-wrist line
  let batAngle: number | null = null;
  if (leftWrist && rightWrist) {
    batAngle = Math.atan2(
      rightWrist.y - leftWrist.y,
      rightWrist.x - leftWrist.x,
    ) * (180 / Math.PI);
    batAngle = Math.abs(batAngle);
  }

  // Head position relative to hips
  let headPosition: FrameAnalysis['headPosition'] = null;
  if (nose && leftHip && rightHip) {
    const hipY = (leftHip.y + rightHip.y) / 2;
    const relativeY = (hipY - nose.y) / hipY;
    if (relativeY > 0.45) headPosition = 'ideal';
    else if (relativeY > 0.3) headPosition = 'too-low';
    else headPosition = 'too-high';
  }

  // Weight distribution (front-to-back) from ankle x positions
  let weightDistribution: number | null = null;
  if (leftAnkle && rightAnkle && leftHip && rightHip) {
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const ankleSpan = Math.abs(leftAnkle.x - rightAnkle.x);
    if (ankleSpan > 0) {
      const frontAnkle = leftAnkle.x < rightAnkle.x ? leftAnkle : rightAnkle;
      weightDistribution = Math.min(
        100,
        Math.max(0, ((hipMidX - frontAnkle.x) / ankleSpan) * 100),
      );
    }
  }

  // Elbow angle (dominant arm)
  let elbowAngle: number | null = null;
  if (rightShoulder && rightElbow && rightWrist) {
    elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  }

  return {
    timestamp,
    pose,
    batAngle,
    kneeFlexion,
    hipRotation,
    headPosition,
    weightDistribution,
    elbowAngle,
  };
}

export function detectShotType(frames: FrameAnalysis[]): ShotType {
  const validFrames = frames.filter(f => f.batAngle !== null);
  if (validFrames.length === 0) return 'unknown';

  const avgBatAngle = validFrames.reduce((s, f) => s + (f.batAngle ?? 0), 0) / validFrames.length;
  const avgKnee = validFrames.reduce((s, f) => s + (f.kneeFlexion ?? 160), 0) / validFrames.length;
  const avgWeight = validFrames.reduce((s, f) => s + (f.weightDistribution ?? 50), 0) / validFrames.length;

  if (avgKnee < 130 && avgWeight > 55) return 'drive';
  if (avgBatAngle > 60 && avgWeight < 45) return 'pull';
  if (avgBatAngle > 45 && avgWeight < 50) return 'cut';
  if (avgKnee < 120) return 'sweep';
  if (avgKnee > 155) return 'defence';
  return 'unknown';
}

export function generateFeedback(frames: FrameAnalysis[]): CoachingFeedback[] {
  const feedback: CoachingFeedback[] = [];
  const valid = frames.filter(f => f.pose !== null);
  if (valid.length === 0) return [];

  const avgKnee = valid.reduce((s, f) => s + (f.kneeFlexion ?? 160), 0) / valid.length;
  const avgElbow = valid.reduce((s, f) => s + (f.elbowAngle ?? 90), 0) / valid.length;
  const avgWeight = valid.reduce((s, f) => s + (f.weightDistribution ?? 50), 0) / valid.length;
  const avgHip = valid.reduce((s, f) => s + (f.hipRotation ?? 0), 0) / valid.length;

  const headCounts = { ideal: 0, 'too-high': 0, 'too-low': 0 };
  valid.forEach(f => {
    if (f.headPosition) headCounts[f.headPosition]++;
  });
  const dominantHead = (Object.entries(headCounts) as [string, number][]).reduce((a, b) =>
    b[1] > a[1] ? b : a,
  )[0] as FrameAnalysis['headPosition'];

  // Stance / knee flexion
  if (avgKnee >= 130 && avgKnee <= 155) {
    feedback.push({
      category: 'stance',
      severity: 'excellent',
      title: 'Excellent Batting Stance',
      detail: `Knee flexion at ${avgKnee.toFixed(0)}° is in the ideal 130–155° range. You have a solid, balanced base.`,
    });
  } else if (avgKnee > 155) {
    feedback.push({
      category: 'stance',
      severity: 'needs-work',
      title: 'Straighten Your Knees Less',
      detail: `Knees are too straight (${avgKnee.toFixed(0)}°). Bend them more to 130–155° for better balance and power transfer.`,
    });
  } else {
    feedback.push({
      category: 'stance',
      severity: 'critical',
      title: 'Over-Crouching Detected',
      detail: `Knee angle of ${avgKnee.toFixed(0)}° is too deep. Raise your stance slightly to improve mobility and shot range.`,
    });
  }

  // Head position
  if (dominantHead === 'ideal') {
    feedback.push({
      category: 'head-position',
      severity: 'excellent',
      title: 'Great Head Position',
      detail: 'Your head stays over the ball with eyes level — a hallmark of elite batsmen.',
    });
  } else if (dominantHead === 'too-high') {
    feedback.push({
      category: 'head-position',
      severity: 'needs-work',
      title: 'Head Falling Back',
      detail: 'Your head is pulling back from the line of the ball. Keep your eyes level and chin pointing down towards the pitch.',
    });
  } else if (dominantHead === 'too-low') {
    feedback.push({
      category: 'head-position',
      severity: 'good',
      title: 'Slightly Low Head Position',
      detail: 'Head is slightly low, which can restrict your vision. Try to keep chin parallel to the ground when playing the shot.',
    });
  }

  // Balance / weight distribution
  if (avgWeight >= 40 && avgWeight <= 65) {
    feedback.push({
      category: 'balance',
      severity: 'good',
      title: 'Good Weight Balance',
      detail: `Weight distribution at ${avgWeight.toFixed(0)}% towards front foot is well balanced for shot-making.`,
    });
  } else if (avgWeight > 65) {
    feedback.push({
      category: 'balance',
      severity: 'needs-work',
      title: 'Falling Forward',
      detail: `You're leaning too far forward (${avgWeight.toFixed(0)}%). Maintain your centre of gravity to stay balanced on both shots.`,
    });
  } else {
    feedback.push({
      category: 'balance',
      severity: 'needs-work',
      title: 'Too Much Weight on Back Foot',
      detail: `Weight at ${avgWeight.toFixed(0)}% back-foot heavy. For front-foot drives, transfer weight forward as you play.`,
    });
  }

  // Elbow / backlift
  if (avgElbow >= 80 && avgElbow <= 130) {
    feedback.push({
      category: 'backlift',
      severity: 'excellent',
      title: 'Textbook Backlift',
      detail: `Elbow angle of ${avgElbow.toFixed(0)}° indicates a high, correct backlift towards mid-on / second slip.`,
    });
  } else if (avgElbow < 80) {
    feedback.push({
      category: 'backlift',
      severity: 'critical',
      title: 'Low Backlift',
      detail: `Elbow angle of ${avgElbow.toFixed(0)}° suggests a flat backlift. Raise the bat higher towards your shoulder for more power.`,
    });
  } else {
    feedback.push({
      category: 'backlift',
      severity: 'good',
      title: 'High Backlift — Watch Control',
      detail: `Backlift is generous (${avgElbow.toFixed(0)}°). Ensure the bat comes down straight to maintain control against pace.`,
    });
  }

  // Hip rotation
  if (avgHip >= 15 && avgHip <= 40) {
    feedback.push({
      category: 'follow-through',
      severity: 'excellent',
      title: 'Good Hip Rotation',
      detail: `Hip rotation of ${avgHip.toFixed(0)}° is generating strong power through the shot with good shoulder turn.`,
    });
  } else if (avgHip < 15) {
    feedback.push({
      category: 'follow-through',
      severity: 'needs-work',
      title: 'Limited Hip Rotation',
      detail: 'Your hips are not rotating enough through the shot. Drive the hips towards the bowler to generate power.',
    });
  }

  return feedback;
}

export function computeOverallScore(frames: FrameAnalysis[]): number {
  const feedback = generateFeedback(frames);
  if (feedback.length === 0) return 0;
  const weights: Record<string, number> = {
    excellent: 100,
    good: 75,
    'needs-work': 40,
    critical: 10,
  };
  const total = feedback.reduce((s, f) => s + weights[f.severity], 0);
  return Math.round(total / feedback.length);
}
