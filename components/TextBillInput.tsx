import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseTextToBill, BillData } from '@/services/gemini-ai';
import { useAuthStore } from '@/store/auth';
import { X, Mic } from 'lucide-react-native';

interface TextBillInputProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (billData: BillData) => void;
  initialText?: string;
  onSwitchToVoice?: () => void;
}

export default function TextBillInput({ visible, onClose, onComplete, initialText, onSwitchToVoice }: TextBillInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token, isAuthenticated } = useAuthStore();

  const [text, setText] = useState(initialText || '');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<BillData | null>(null);

  // 当弹窗打开且有 initialText 时，更新文本
  useEffect(() => {
    if (visible && initialText) {
      setText(initialText);
    }
  }, [visible, initialText]);

  const handleRecognize = async () => {
    if (!text.trim()) {
      Alert.alert('提示', '请输入账单描述');
      return;
    }

    if (!isAuthenticated || !token) {
      Alert.alert('提示', '请先登录后使用 AI 识别功能');
      return;
    }

    setIsRecognizing(true);
    try {
      const billData = await parseTextToBill(text);
      setResult(billData);
    } catch (error: any) {
      Alert.alert('识别失败', error.message || '文本识别失败，请重试');
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
    setText('');
    setResult(null);
    onClose();
  };

  const handleRetry = () => {
    setResult(null);
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
            <Text style={[styles.title, { color: colors.text }]}>📝 文本识别</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              输入账单描述，AI 自动识别金额和分类
            </Text>

            {/* 示例提示 */}
            <View style={[styles.exampleBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.exampleTitle, { color: colors.text }]}>💡 示例：</Text>
              <Text style={[styles.exampleText, { color: colors.textSecondary }]}>
                • 今天在星巴克花了 45 元买咖啡{'\n'}
                • 打车去机场花了 80 块{'\n'}
                • 收到工资 8000 元{'\n'}
                • 买了一件衣服 299
              </Text>
            </View>

            {/* 文本输入 */}
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                placeholder="请输入账单描述..."
                placeholderTextColor={colors.textSecondary}
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isRecognizing && !result}
              />
              {onSwitchToVoice && !result && (
                <TouchableOpacity
                  style={[styles.voiceButton, { backgroundColor: colors.income }]}
                  onPress={onSwitchToVoice}
                  disabled={isRecognizing}
                >
                  <Mic size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

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
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            {!result ? (
              <TouchableOpacity
                style={[styles.button, styles.recognizeButton, { backgroundColor: colors.primary }]}
                onPress={handleRecognize}
                disabled={isRecognizing || !text.trim()}
              >
                <Text style={styles.buttonText}>
                  {isRecognizing ? '识别中...' : '开始识别'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.retryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={handleRetry}
                >
                  <Text style={[styles.retryButtonText, { color: colors.text }]}>重新识别</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.useButton, { backgroundColor: colors.primary }]}
                  onPress={handleUseData}
                >
                  <Text style={styles.buttonText}>使用此数据</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
    marginBottom: 16,
  },
  exampleBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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
  footer: {
    paddingHorizontal: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  recognizeButton: {
    width: '100%',
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
