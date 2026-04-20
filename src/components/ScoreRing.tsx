import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 120 }: Props) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const ringColor = score >= 80 ? colors.green : score >= 60 ? colors.gold : colors.red;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>{score}</Text>
    </View>
  );
}
