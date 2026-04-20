import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shared } from '../theme';
import type { RootTabParamList } from '../navigation/TabNavigator';

type Nav = BottomTabNavigationProp<RootTabParamList, 'Capture'>;

export function CaptureScreen() {
  const navigation = useNavigation<Nav>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'select' | 'camera'>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setRecordSeconds(0);
    timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const openCamera = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission required', 'Camera access is needed to record batting shots.');
        return;
      }
    }
    setMode('camera');
  }, [permission, requestPermission]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current) return;
    setIsRecording(true);
    startTimer();
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });
      if (video?.uri) {
        navigation.navigate('Analyse', { videoUri: video.uri });
      }
    } catch (err) {
      console.warn('Recording error:', err);
    } finally {
      setIsRecording(false);
      stopTimer();
    }
  }, [navigation]);

  const stopRecording = useCallback(() => {
    cameraRef.current?.stopRecording();
    setIsRecording(false);
    stopTimer();
  }, []);

  const pickFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      navigation.navigate('Analyse', { videoUri: result.assets[0].uri });
    }
  }, [navigation]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (mode === 'camera') {
    return (
      <View style={styles.screen}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="video"
        />
        {/* Header overlay */}
        <SafeAreaView edges={['top']} style={styles.cameraHeader}>
          <Text style={styles.appName}>🏏 CricBuddy</Text>
          {isRecording && (
            <View style={styles.recIndicator}>
              <View style={styles.recDot} />
              <Text style={styles.recTime}>{fmtTime(recordSeconds)}</Text>
            </View>
          )}
        </SafeAreaView>

        {/* Camera controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('select')}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={isRecording ? styles.stopShape : styles.recordShape} />
          </TouchableOpacity>

          <View style={{ width: 60 }} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={shared.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>🏏 CricBuddy</Text>
          <Text style={styles.appSubtitle}>AI Cricket Coach</Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Start Batting Analysis</Text>
          <Text style={styles.heroSubtitle}>Record live or upload existing footage for AI-powered coaching feedback</Text>
        </View>

        {/* Option cards */}
        <TouchableOpacity style={[styles.optionCard, { borderColor: colors.green }]} onPress={openCamera}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(82,183,136,0.15)' }]}>
            <Text style={styles.iconEmoji}>📷</Text>
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Live Camera</Text>
            <Text style={styles.optionDesc}>Record a batting shot with your phone camera</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionCard, { borderColor: colors.gold }]} onPress={pickFromGallery}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(233,196,106,0.15)' }]}>
            <Text style={styles.iconEmoji}>📂</Text>
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Upload Video</Text>
            <Text style={styles.optionDesc}>Select an existing batting video from your gallery</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Tips card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📐 Recording Tips</Text>
          {[
            'Film from the side (leg or off stump angle)',
            'Ensure the full body is visible in frame',
            'Use good lighting for accurate pose detection',
            'Record at least one complete shot',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipDot}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  container: { padding: 20, gap: 16 },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
  appTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  appSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  heroSection: { marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 24 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 3 },
  optionDesc: { fontSize: 13, color: colors.textSecondary },
  arrow: { fontSize: 22, color: colors.textMuted },
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 4,
  },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 10 },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  tipDot: { color: colors.green, fontSize: 14 },
  tipText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  // Camera styles
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  appName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  recIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.red },
  recTime: { color: '#fff', fontFamily: 'monospace', fontSize: 13 },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
  },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#fff', fontSize: 16 },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnActive: { borderColor: colors.red },
  recordShape: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.red },
  stopShape: { width: 24, height: 24, borderRadius: 4, backgroundColor: colors.red },
});
