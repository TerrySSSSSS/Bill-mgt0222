import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { useAuthStore } from '@/store/auth';
import { recognizeInvoice, InvoiceRecognitionResult } from '@/services/insforge';

interface InvoiceRecognitionProps {
  onRecognitionComplete?: (result: InvoiceRecognitionResult) => void;
}

export default function InvoiceRecognition({ onRecognitionComplete }: InvoiceRecognitionProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<InvoiceRecognitionResult | null>(null);
  const { token, isAuthenticated } = useAuthStore();

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
    if (!isAuthenticated || !token) {
      Alert.alert('提示', '请先登录后使用 AI 识别功能');
      return;
    }

    setIsRecognizing(true);
    try {
      // 将图片转换为 base64
      const response = await fetch(uri);
      const blob = await response.blob();

      // 调用 InsForge AI 识别
      const recognitionResult = await recognizeInvoice(blob, token);

      setResult(recognitionResult);

      Alert.alert(
        '识别成功',
        `发票金额: ¥${recognitionResult.totalAmount || recognitionResult.amount || 0}\n` +
        `商家: ${recognitionResult.vendor || '未识别'}\n` +
        `日期: ${recognitionResult.date || '未识别'}`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '使用此数据',
            onPress: () => onRecognitionComplete?.(recognitionResult),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('识别失败', error.message || '发票识别失败，请重试');
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI 发票识别</Text>
      <Text style={styles.subtitle}>拍照或选择发票图片，自动识别金额和信息</Text>

      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
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
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>金额:</Text>
            <Text style={styles.resultValue}>¥{result.totalAmount || result.amount || 0}</Text>
          </View>
          {result.vendor && (
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>商家:</Text>
              <Text style={styles.resultValue}>{result.vendor}</Text>
            </View>
          )}
          {result.date && (
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>日期:</Text>
              <Text style={styles.resultValue}>{result.date}</Text>
            </View>
          )}
          {result.category && (
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>分类:</Text>
              <Text style={styles.resultValue}>{result.category}</Text>
            </View>
          )}
          {result.confidence && (
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>置信度:</Text>
              <Text style={styles.resultValue}>{(result.confidence * 100).toFixed(1)}%</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={takePhoto}
          disabled={isRecognizing}
        >
          <Text style={styles.buttonText}>📷 拍照识别</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={pickImage}
          disabled={isRecognizing}
        >
          <Text style={styles.buttonText}>🖼️ 相册选择</Text>
        </TouchableOpacity>
      </View>

      {!isAuthenticated && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠️ 需要登录后才能使用 AI 识别功能</Text>
        </View>
      )}
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
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  resultLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#3B82F6',
  },
  galleryButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
});
