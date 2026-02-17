import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { useAuthStore } from '@/store/auth';
import { recognizeVoice, VoiceRecognitionResult } from '@/services/insforge';

interface VoiceRecognitionProps {
  onRecognitionComplete?: (result: VoiceRecognitionResult) => void;
}

export default function VoiceRecognition({ onRecognitionComplete }: VoiceRecognitionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<VoiceRecognitionResult | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { token, isAuthenticated } = useAuthStore();

  // 请求录音权限
  const requestPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要麦克风权限才能录音');
      return false;
    }
    return true;
  };

  // 开始录音
  const startRecording = async () => {
    if (!isAuthenticated || !token) {
      Alert.alert('提示', '请先登录后使用 AI 语音识别功能');
      return;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 创建录音实例
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      setResult(null);

      // 开始计时
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      console.log('Recording started');
    } catch (error: any) {
      Alert.alert('录音失败', error.message || '无法开始录音');
    }
  };

  // 停止录音
  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);

      // 停止计时
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // 停止录音
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      console.log('Recording stopped, URI:', uri);

      if (uri) {
        await recognizeAudio(uri);
      }

      recordingRef.current = null;
    } catch (error: any) {
      Alert.alert('停止录音失败', error.message);
    }
  };

  // 识别音频
  const recognizeAudio = async (uri: string) => {
    if (!isAuthenticated || !token) {
      Alert.alert('提示', '请先登录后使用 AI 识别功能');
      return;
    }

    setIsRecognizing(true);
    try {
      // 将音频文件转换为 blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // 调用 InsForge AI 语音识别
      const recognitionResult = await recognizeVoice(blob, token, 'zh-CN');

      setResult(recognitionResult);

      Alert.alert(
        '识别成功',
        `识别文本: ${recognitionResult.text}\n置信度: ${((recognitionResult.confidence || 0) * 100).toFixed(1)}%`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '使用此文本',
            onPress: () => onRecognitionComplete?.(recognitionResult),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('识别失败', error.message || '语音识别失败，请重试');
    } finally {
      setIsRecognizing(false);
    }
  };

  // 格式化时间
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI 语音识别</Text>
      <Text style={styles.subtitle}>按住录音按钮说话，自动识别为文字</Text>

      {isRecording && (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>录音中...</Text>
          </View>
          <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
        </View>
      )}

      {isRecognizing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>AI 识别中...</Text>
        </View>
      )}

      {result && !isRecognizing && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>识别结果</Text>
          <Text style={styles.resultText}>{result.text}</Text>
          {result.confidence && (
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>置信度:</Text>
              <Text style={styles.confidenceValue}>
                {(result.confidence * 100).toFixed(1)}%
              </Text>
            </View>
          )}
          {result.duration && (
            <Text style={styles.durationInfo}>
              录音时长: {result.duration.toFixed(1)}秒
            </Text>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!isRecording ? (
          <TouchableOpacity
            style={[styles.recordButton, isRecognizing && styles.buttonDisabled]}
            onPress={startRecording}
            disabled={isRecognizing}
          >
            <View style={styles.recordButtonInner}>
              <Text style={styles.recordButtonText}>🎤</Text>
            </View>
            <Text style={styles.recordButtonLabel}>按住录音</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.recordButton, styles.stopButton]}
            onPress={stopRecording}
          >
            <View style={[styles.recordButtonInner, styles.stopButtonInner]}>
              <Text style={styles.recordButtonText}>⏹️</Text>
            </View>
            <Text style={styles.recordButtonLabel}>停止录音</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isAuthenticated && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠️ 需要登录后才能使用 AI 语音识别功能</Text>
        </View>
      )}

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 使用提示</Text>
        <Text style={styles.tipsText}>• 在安静的环境中录音效果更好</Text>
        <Text style={styles.tipsText}>• 说话清晰，语速适中</Text>
        <Text style={styles.tipsText}>• 支持中文普通话识别</Text>
        <Text style={styles.tipsText}>• 可用于快速记录交易备注</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  recordingContainer: {
    backgroundColor: '#FEE2E2',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  durationText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    fontVariant: ['tabular-nums'],
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  resultContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  durationInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  recordButton: {
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButton: {},
  stopButtonInner: {
    backgroundColor: '#DC2626',
  },
  recordButtonText: {
    fontSize: 32,
  },
  recordButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  warningContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    textAlign: 'center',
  },
  tipsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 20,
  },
});
