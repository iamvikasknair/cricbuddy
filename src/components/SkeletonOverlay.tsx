import React from 'react';
import { Svg, Line, Circle } from 'react-native-svg';
import type { Pose } from '../types';
import { skeleton } from '../theme';

const CONNECTIONS: [string, string][] = [
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

const KEYPOINT_COLOR: Record<string, string> = {
  nose: skeleton.nose,
  left_shoulder: skeleton.shoulder,
  right_shoulder: skeleton.shoulder,
  left_elbow: skeleton.elbow,
  right_elbow: skeleton.elbow,
  left_wrist: skeleton.wrist,
  right_wrist: skeleton.wrist,
  left_hip: skeleton.hip,
  right_hip: skeleton.hip,
  left_knee: skeleton.knee,
  right_knee: skeleton.knee,
  left_ankle: skeleton.ankle,
  right_ankle: skeleton.ankle,
};

interface Props {
  pose: Pose | null;
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
}

export function SkeletonOverlay({ pose, width, height, scaleX = 1, scaleY = 1 }: Props) {
  if (!pose) return null;

  const kpMap: Record<string, { x: number; y: number; score: number }> = {};
  pose.keypoints.forEach(kp => {
    if (kp.score > 0.3) kpMap[kp.name] = { x: kp.x * scaleX, y: kp.y * scaleY, score: kp.score };
  });

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      {CONNECTIONS.map(([a, b]) => {
        const kpA = kpMap[a];
        const kpB = kpMap[b];
        if (!kpA || !kpB) return null;
        return (
          <Line
            key={`${a}-${b}`}
            x1={kpA.x} y1={kpA.y}
            x2={kpB.x} y2={kpB.y}
            stroke={skeleton.connections}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
      {pose.keypoints.filter(kp => kp.score > 0.3).map(kp => (
        <Circle
          key={kp.name}
          cx={kp.x * scaleX}
          cy={kp.y * scaleY}
          r={6}
          fill={KEYPOINT_COLOR[kp.name] ?? '#ffffff'}
          stroke="#fff"
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}
