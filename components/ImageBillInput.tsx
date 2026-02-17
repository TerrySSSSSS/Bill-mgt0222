import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, Image } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseImageToBill, BillData } from '@/services/insforge-ai';
import { useAuthStore } from '@/store/auth';
import { X } from 'lucide-react-native';

interface ImageBillInputProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (billData: BillData) => void;
}

export default function ImageBillInput({ visible, onClose, onComplete }: ImageBillInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token, isAuthenticated } = useAuthStore();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<BillData | null>(null);

  // 请求相机权限
  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要相机权限才能拍照');
      return false;
    }
    return true;
  };

  // 请求相册权限
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要相册权限才能选择图片');
      return false;
    }
    return true;
  };

  // 拍照
  const takePhoto = async () => {
    if (!isAuthenticated || !token) {
      Alert.alert('提示', '请先登录后使用 AI 识别功能');
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      await recognizeImage(result.assets[0].uri);
    }
  };

  // 从相册选择
  const pickImage = async () => {
    if (!isAuthenticated || !token) {
      Alert.alert('提示', '请先登录后使用 AI 识别功能');
      return;
    }

    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      await recognizeImage(result.assets[0].uri);
    }
  };

  // 识别图片
  const recognizeImage = async (uri: string) => {
    setIsRecognizing(true);
    try {
      // 将图片转换为 blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // 调用 AI 图片识别并解析为账单
      const billData = await parseImageToBill(blob);
      setResult(billData);
    } catch (error: any) {
      Alert.alert('识别失败', error.message || '图片识别失败，请重试');
      setImageUri(null);
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
    setImageUri(null);
    setResult(null);
    onClose();
  };

  const handleRetry = () => {
    setImageUri(null);
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
            <Text style={[styles.title, { color: colors.text }]}>📷 拍照识别</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              拍照或选择发票图片，AI 自动识别
            </Text>

            {/* 图片预览 */}
            {imageUri && (
              <View style={[styles.imageContainer, { backgroundColor: colors.card }]}>
                <Image source={{ uri: imageUri }} style={styles.image} />
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

                {result.date && (
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>日期:</Text>
                    <Text style={[styles.resultValue, { color: colors.text }]}>
                      {new Date(result.date).toLocaleDateString('zh-CN')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 选择图片按钮 */}
            {!imageUri && !isRecognizing && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cameraButton, { backgroundColor: colors.primary }]}
                  onPress={takePhoto}
                >
                  <Text style={styles.buttonIcon}>📷</Text>
                  <Text style={styles.buttonText}>拍照识别</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.galleryButton, { backgroundColor: colors.income }]}
                  onPress={pickImage}
                >
                  <Text style={styles.buttonIcon}>🖼️</Text>
                  <Text style={styles.buttonText}>相册选择</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 使用提示 */}
            {!imageUri && !isRecognizing && (
              <View style={[styles.tipsContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.tipsTitle, { color: colors.text }]}>💡 使用提示</Text>
                <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                  • 确保发票/账单清晰可见{'\n'}
                  • 光线充足，避免反光{'\n'}
                  • 支持各类发票、小票、账单{'\n'}
                  • 自动识别金额、商家、日期等信息
                </Text>
              </View>
            )}
          </View>

          {/* Footer Buttons */}
          {result && (
            <View style={styles.footer}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.retryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={handleRetry}
                >
                  <Text style={[styles.retryButtonText, { color: colors.text }]}>重新拍照</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerButton, styles.useButton, { backgroundColor: colors.primary }]}
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
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {},
  galleryButton: {},
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
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
  footerButton: {
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
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
