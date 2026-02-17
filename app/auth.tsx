import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    clearError();

    if (!email || !password) {
      Alert.alert('错误', '请填写邮箱和密码');
      return;
    }

    try {
      if (isLogin) {
        await login({ email, password });
        Alert.alert('成功', '登录成功！');
        router.replace('/(tabs)');
      } else {
        if (!username) {
          Alert.alert('错误', '请填写用户名');
          return;
        }

        if (!confirmPassword) {
          Alert.alert('错误', '请确认密码');
          return;
        }

        if (password !== confirmPassword) {
          Alert.alert('错误', '两次输入的密码不一致');
          return;
        }

        await register({ email, password, username });
        Alert.alert('成功', '注册成功！');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('错误', err.message || (isLogin ? '登录失败' : '注册失败'));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isLogin ? '欢迎回来' : '创建账户'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLogin ? '登录您的账户' : '注册开始使用'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>邮箱</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="请输入邮箱"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>用户名</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                placeholder="请输入用户名"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>密码</Text>
              {isLogin && (
                <TouchableOpacity>
                  <Text style={[styles.forgotPassword, { color: colors.primary }]}>忘记密码？</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.passwordContainer, {
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="请输入密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>确认密码</Text>
              <View style={[styles.passwordContainer, {
                backgroundColor: colors.card,
                borderColor: colors.border
              }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.text }]}
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text style={[styles.switchQuestion, { color: colors.textSecondary }]}>
              {isLogin ? '还没有账户？' : '已有账户？'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                clearError();
              }}
            >
              <Text style={[styles.switchLink, { color: colors.primary }]}>
                {isLogin ? '立即注册' : '立即登录'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchQuestion: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
