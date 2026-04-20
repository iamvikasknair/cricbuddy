import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { colors } from '../theme';
import type { SessionAnalysis } from '../types';

export type RootTabParamList = {
  Capture: undefined;
  Analyse: { videoUri: string | null };
  Charts: { session: SessionAnalysis | null };
  Feedback: { session: SessionAnalysis | null };
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// Lazy imports to avoid circular deps
import { CaptureScreen } from '../screens/CaptureScreen';
import { AnalyseScreen } from '../screens/AnalyseScreen';
import { ChartsScreen } from '../screens/ChartsScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, color: focused ? colors.green : colors.textMuted, fontWeight: focused ? '600' : '400' }}>
        {label}
      </Text>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Capture"
        component={CaptureScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📹" label="Capture" focused={focused} /> }}
        initialParams={undefined}
      />
      <Tab.Screen
        name="Analyse"
        component={AnalyseScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" label="Analyse" focused={focused} /> }}
        initialParams={{ videoUri: null }}
      />
      <Tab.Screen
        name="Charts"
        component={ChartsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Charts" focused={focused} /> }}
        initialParams={{ session: null }}
      />
      <Tab.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💬" label="Feedback" focused={focused} /> }}
        initialParams={{ session: null }}
      />
    </Tab.Navigator>
  );
}
