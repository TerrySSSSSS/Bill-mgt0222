import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseVoiceToBill, BillData } from '@/services/insforge-ai';
import { useAuthStore } from '@/store/auth';
import { X } from 'lucide-react-native';

interface VoiceBillInputProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (billData: BillData) => void;
}

export default function VoiceBillInput({ visible, onClose, onComplete }: VoiceBillInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token, isAuthenticated } = useAuthStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<BillData | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      console.log('🎤 Recording started');
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

      console.log('⏹️ Recording stopped, URI:', uri);

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

      // 调用 AI 语音识别并解析为账单
      const billData = await parseVoiceToBill(blob);
      setResult(billData);
    } catch (error: any) {
      Alert.alert('识别失败', error.message || '语音识别失败，请重试');
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleUseData = () => {
    if (result) {
      onComplete(result);
      handleClose();
    }
  };

  const handleClose = () => {
    // 如果正在录音，先停止
    if (isRecording && recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      setIsRecording(false);
    }

    // 清理计时器
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setRecordingDuration(0);
    setResult(null);
    onClose();
  };

  const handleRetry = () => {
    setResult(null);
    setRecordingDuration(0);
  };

  // 格式化时间
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>🎤 语音识别</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              按住录音按钮说话，AI 自动识别并解析
            </Text>

            {/* 录音中 */}
            {isRecording && (
              <View style={[styles.recordingContainer, { backgroundColor: colors.expense + '20' }]}>
                <View style={styles.recordingIndicator}>
                  <View style={[styles.recordingDot, { backgroundColor: colors.expense }]} />
                  <Text style={[styles.recordingText, { color: colors.expense }]}>录音中...</Text>
                </View>
                <Text style={[styles.durationText, { color: colors.text }]}>
                  {formatDuration(recordingDuration)}
                </Text>
              </View>
            )}

            {/* 识别中 */}
            {isRecognizing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  AI 识别中...
                </Text>
              </View>
            )}

            {/* 识别结果 */}
            {result && !isRecognizing && (
              <View style={[styles.resultContainer, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.resultTitle, { color: colors.text }]}>✅ 识别结果</Text>

                <View style={styles.resultItem}>
                  <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>类型:</Text>
                  <Text style={[styles.resultValue, { color: colors.text }]}>
                    {result.type === 'expense' ? '支出' : '收入'}
                  </Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>金额:</Text>
                  <Text style={[styles.resultValue, { color: result.type === 'expense' ? colors.expense : colors.income }]}>
                    ¥{result.amount.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>分类:</Text>
                  <Text style={[styles.resultValue, { color: colors.text }]}>
                    {result.category}
                  </Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>描述:</Text>
                  <Text style={[styles.resultValue, { color: colors.text }]}>
                    {result.description}
                  </Text>
                </View>

                {result.vendor && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>商家:</Text>
                    <Text style={[styles.resultValue, { color: colors.text }]}>
                      {result.vendor}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 录音按钮 */}
            {!result && !isRecognizing && (
              <View style={styles.buttonContainer}>
                {!isRecording ? (
                  <TouchableOpacity
                    style={styles.recordButton}
                    onPress={startRecording}
                  >
                    <View style={[styles.recordButtonInner, { backgroundColor: colors.primary }]}>
                      <Text style={styles.recordButtonText}>🎤</Text>
                    </View>
                    <Text style={[styles.recordButtonLabel, { color: colors.textSecondary }]}>
                      点击开始录音
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.recordButton}
                    onPress={stopRecording}
                  >
                    <View style={[styles.recordButtonInner, styles.stopButtonInner, { backgroundColor: colors.expense }]}>
                      <Text style={styles.recordButtonText}>⏹️</Text>
                    </View>
                    <Text style={[styles.recordButtonLabel, { color: colors.textSecondary }]}>
                      点击停止录音
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 使用提示 */}
            {!result && !isRecognizing && !isRecording && (
              <View style={[styles.tipsContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.tipsTitle, { color: colors.text }]}>💡 使用提示</Text>
                <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                  • 在安静的环境中录音效果更好{'\n'}
                  • 说话清晰，语速适中{'\n'}
                  • 支持中文普通话识别{'\n'}
                  • 示例："今天吃饭花了五十块钱"
                </Text>
              </View>
            )}
          </View>

          {/* Footer Buttons */}
          {result && (
            <View style={styles.footer}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.retryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={handleRetry}
                >
                  <Text style={[styles.retryButtonText, { color: colors.text }]}>重新录音</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.useButton, { backgroundColor: colors.primary }]}
                  onPress={handleUseData}
                >
                  <Text style={styles.buttonText}>使用此数据</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  recordingContainer: {
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
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  resultContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  resultLabel: {
    fontSize: 14,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  recordButton: {
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButtonInner: {},
  recordButtonText: {
    fontSize: 32,
  },
  recordButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    borderWidth: 1,
  },
  useButton: {
    flex: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
