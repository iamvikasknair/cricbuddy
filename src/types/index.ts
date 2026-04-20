export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score: number;
}

export interface FrameAnalysis {
  timestamp: number;
  pose: Pose | null;
  batAngle: number | null;
  kneeFlexion: number | null;
  hipRotation: number | null;
  headPosition: 'ideal' | 'too-high' | 'too-low' | null;
  weightDistribution: number | null;
  elbowAngle: number | null;
}

export interface SessionAnalysis {
  sessionId: string;
  startTime: number;
  duration: number;
  frames: FrameAnalysis[];
  shotType: ShotType;
  overallScore: number;
  feedback: CoachingFeedback[];
}

export type ShotType = 'drive' | 'pull' | 'cut' | 'sweep' | 'defence' | 'unknown';

export interface CoachingFeedback {
  category: FeedbackCategory;
  severity: 'excellent' | 'good' | 'needs-work' | 'critical';
  title: string;
  detail: string;
  timestamp?: number;
}

export type FeedbackCategory =
  | 'stance'
  | 'backlift'
  | 'footwork'
  | 'head-position'
  | 'follow-through'
  | 'balance'
  | 'timing';
