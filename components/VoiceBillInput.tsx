import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BillData } from '@/services/gemini-ai';
import { X } from 'lucide-react-native';

interface VoiceBillInputProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (billData: BillData) => void;
  onSwitchToText?: (text: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceBillInput({ visible, onClose, onSwitchToText }: VoiceBillInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef('');
  const isRecordingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setSupported(false);
  }, []);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Alert.alert('不支持', '请使用 Chrome 或 Safari 浏览器');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      if (finalText) {
        transcriptRef.current = finalText;
        setTranscript(finalText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      if (event.error === 'not-allowed') {
        Alert.alert('权限不足', '请允许浏览器使用麦克风');
      }
      stopRecording();
    };

    recognition.onend = () => {
      // Chrome 静音超时会自动停止，这里需要处理识别结果
      if (isRecordingRef.current) {
        stopRecording();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    isRecordingRef.current = true;
    setTranscript('');
    setRecordingDuration(0);
    transcriptRef.current = '';

    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setIsRecording(false);
    isRecordingRef.current = false;

    const text = transcriptRef.current;
    transcriptRef.current = '';

    if (text.trim()) {
      handleClose();
      onSwitchToText?.(text);
    } else {
      Alert.alert('未识别到语音内容', '请检查麦克风设置后重试');
    }
  };

  const handleClose = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setIsRecording(false);
    isRecordingRef.current = false;
    setTranscript('');
    setRecordingDuration(0);
    transcriptRef.current = '';
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>🎤 语音识别</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.content}>
            {!supported ? (
              <View style={[styles.tipsContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                  当前浏览器不支持语音识别，请使用 Chrome 或 Safari
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  点击按钮说话，识别完成后可手动修改内容
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
                    {transcript ? (
                      <Text style={[styles.transcriptText, { color: colors.textSecondary }]}>
                        "{transcript}"
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* 录音按钮 */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.recordButton}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <View style={[
                      styles.recordButtonInner,
                      { backgroundColor: isRecording ? colors.expense : colors.primary }
                    ]}>
                      <Text style={styles.recordButtonText}>{isRecording ? '⏹️' : '🎤'}</Text>
                    </View>
                    <Text style={[styles.recordButtonLabel, { color: colors.textSecondary }]}>
                      {isRecording ? '点击停止' : '点击开始录音'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 使用提示 */}
                {!isRecording && (
                  <View style={[styles.tipsContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.tipsTitle, { color: colors.text }]}>💡 使用提示</Text>
                    <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                      • 在安静的环境中效果更好{'\n'}
                      • 说话清晰，语速适中{'\n'}
                      • 识别完成后会跳转到文字输入，可手动修改{'\n'}
                      • 示例："今天吃饭花了五十块钱"
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 18, fontWeight: '600' },
  content: { padding: 20 },
  subtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
  recordingContainer: { padding: 20, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  recordingText: { fontSize: 16, fontWeight: '600' },
  durationText: { fontSize: 32, fontWeight: 'bold' },
  transcriptText: { fontSize: 14, marginTop: 8, fontStyle: 'italic', textAlign: 'center' },
  buttonContainer: { alignItems: 'center', marginVertical: 32 },
  recordButton: { alignItems: 'center' },
  recordButtonInner: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  recordButtonText: { fontSize: 32 },
  recordButtonLabel: { fontSize: 16, fontWeight: '600' },
  tipsContainer: { padding: 16, borderRadius: 12, marginTop: 16 },
  tipsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  tipsText: { fontSize: 14, lineHeight: 20 },
});
