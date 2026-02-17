import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { getInsForgeConfig, checkInsForgeAvailability, useLocalServer, useCloudServer } from '@/config/insforge';

export default function InsForgeStatus() {
  const [config, setConfig] = useState(getInsForgeConfig());
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // 定期检查连接状态
    const interval = setInterval(() => {
      setConfig(getInsForgeConfig());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCheckConnection = async () => {
    setIsChecking(true);
    await checkInsForgeAvailability();
    setConfig(getInsForgeConfig());
    setIsChecking(false);
  };

  const handleSwitchToLocal = async () => {
    useLocalServer();
    await handleCheckConnection();
  };

  const handleSwitchToCloud = async () => {
    useCloudServer();
    await handleCheckConnection();
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusDot, config.enabled ? styles.statusOnline : styles.statusOffline]} />
          <Text style={styles.statusTitle}>
            {config.enabled ? '🟢 InsForge 已连接' : '🔴 InsForge 离线'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>服务器:</Text>
          <Text style={styles.infoValue}>{config.baseURL}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>状态:</Text>
          <Text style={[styles.infoValue, config.enabled ? styles.textSuccess : styles.textError]}>
            {config.enabled ? '在线' : '离线'}
          </Text>
        </View>

        {!config.enabled && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ InsForge 服务器未连接，以下功能将不可用：
            </Text>
            <Text style={styles.warningItem}>• 用户注册和登录</Text>
            <Text style={styles.warningItem}>• AI 发票识别</Text>
            <Text style={styles.warningItem}>• AI 语音识别</Text>
            <Text style={styles.warningItem}>• 云端数据同步</Text>
            <Text style={styles.warningNote}>
              💡 本地数据功能仍可正常使用
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, isChecking && styles.buttonDisabled]}
            onPress={handleCheckConnection}
            disabled={isChecking}
          >
            <Text style={styles.buttonText}>
              {isChecking ? '检查中...' : '🔄 检查连接'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleSwitchToLocal}
            disabled={isChecking}
          >
            <Text style={styles.buttonTextSecondary}>📍 本地服务器</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleSwitchToCloud}
            disabled={isChecking}
          >
            <Text style={styles.buttonTextSecondary}>☁️ 云端服务器</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>💡 如何启动 InsForge？</Text>
        <Text style={styles.helpText}>
          1. 使用 Docker: docker-compose up -d
        </Text>
        <Text style={styles.helpText}>
          2. 手动启动: npm run dev
        </Text>
        <Text style={styles.helpText}>
          3. 查看详细文档: INSFORGE_DEPLOYMENT.md
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusOnline: {
    backgroundColor: '#10B981',
  },
  statusOffline: {
    backgroundColor: '#EF4444',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  textSuccess: {
    color: '#10B981',
  },
  textError: {
    color: '#EF4444',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 8,
  },
  warningItem: {
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8,
    marginBottom: 4,
  },
  warningNote: {
    fontSize: 13,
    color: '#059669',
    marginTop: 8,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 16,
    gap: 8,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3B82F6',
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  helpCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 13,
    color: '#1E40AF',
    marginBottom: 6,
    lineHeight: 20,
  },
});
