import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { getInsForgeConfig, checkInsForgeAvailability } from '@/config/insforge';
import { registerUser, loginUser } from '@/services/insforge';

export default function InsForgeTestScreen() {
  const [status, setStatus] = useState('未检测');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setTestResults([]);
    addResult('开始测试连接...');

    try {
      // 1. 检查配置
      const config = getInsForgeConfig();
      addResult(`配置: ${config.baseURL}`);
      addResult(`状态: ${config.enabled ? '已启用' : '未启用'}`);

      // 2. 检查可用性
      addResult('检查服务器可用性...');
      const isAvailable = await checkInsForgeAvailability();
      addResult(`服务器可用: ${isAvailable ? '✅ 是' : '❌ 否'}`);

      if (isAvailable) {
        setStatus('✅ 已连接');

        // 3. 测试注册
        addResult('测试用户注册...');
        try {
          const testEmail = `test${Date.now()}@example.com`;
          const result = await registerUser({
            email: testEmail,
            password: 'password123',
            username: '测试用户'
          });
          addResult(`✅ 注册成功: ${result.user.email}`);
          addResult(`Token: ${result.token.substring(0, 20)}...`);
        } catch (error: any) {
          addResult(`❌ 注册失败: ${error.message}`);
        }

      } else {
        setStatus('❌ 未连接');
        addResult('❌ 无法连接到 InsForge 服务器');
      }

    } catch (error: any) {
      addResult(`❌ 错误: ${error.message}`);
      setStatus('❌ 错误');
    }
  };

  const testDirectFetch = async () => {
    addResult('直接测试 HTTP 请求...');
    try {
      const response = await fetch('http://localhost:7130/health');
      const data = await response.json();
      addResult(`✅ 直接请求成功: ${JSON.stringify(data)}`);
    } catch (error: any) {
      addResult(`❌ 直接请求失败: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>InsForge 连接测试</Text>
        <Text style={styles.status}>状态: {status}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testConnection}>
          <Text style={styles.buttonText}>🔍 测试连接</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testDirectFetch}>
          <Text style={styles.buttonText}>🌐 直接 HTTP 测试</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={() => setTestResults([])}
        >
          <Text style={styles.buttonText}>🗑️ 清除日志</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>测试日志:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.emptyText}>点击"测试连接"开始测试</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 说明</Text>
        <Text style={styles.infoText}>
          • 如果显示"已连接"，说明应用可以访问 InsForge 服务器
        </Text>
        <Text style={styles.infoText}>
          • 如果显示"未连接"，请检查服务器是否运行
        </Text>
        <Text style={styles.infoText}>
          • 服务器地址: http://localhost:7130
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    color: '#6B7280',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    minHeight: 200,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  resultText: {
    color: '#F3F4F6',
    fontSize: 13,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 4,
  },
});
