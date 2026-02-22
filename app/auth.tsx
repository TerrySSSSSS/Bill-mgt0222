import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type AuthMode = 'login' | 'register' | 'verify';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, sendCode, registerWithCode, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请填写邮箱和密码');
      return;
    }
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('登录失败', err.message || '请检查邮箱和密码');
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('错误', '请先填写邮箱');
      return;
    }
    if (!username) {
      Alert.alert('错误', '请先填写用户名');
      return;
    }
    if (!password || !confirmPassword) {
      Alert.alert('错误', '请先填写密码');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }
    try {
      await sendCode(email);
      setMode('verify');
      Alert.alert('验证码已发送', `请查收 ${email} 的邮件，输入验证码完成注册`);
    } catch (err: any) {
      Alert.alert('发送失败', err.message || '请稍后重试');
    }
  };

  const handleRegister = async () => {
    if (!verificationCode) {
      Alert.alert('错误', '请输入验证码');
      return;
    }
    try {
      await registerWithCode({ email, password, username, verificationCode });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('注册失败', err.message || '请检查验证码是否正确');
    }
  };

  const switchToRegister = () => {
    clearError();
    setMode('register');
  };

  const switchToLogin = () => {
    clearError();
    setMode('login');
    setVerificationCode('');
  };

  const backToRegister = () => {
    clearError();
    setMode('register');
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
            {mode === 'login' ? '欢迎回来' : mode === 'register' ? '创建账户' : '验证邮箱'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode === 'login' ? '登录您的账户' : mode === 'register' ? '注册开始使用' : `验证码已发送至 ${email}`}
          </Text>
        </View>

        <View style={styles.form}>
          {/* 登录 / 注册表单 */}
          {mode !== 'verify' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>邮箱</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  placeholder="请输入邮箱"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {mode === 'register' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>用户名</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="请输入用户名"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>密码</Text>
                <View style={[styles.passwordContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder="请输入密码"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {mode === 'register' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>确认密码</Text>
                  <View style={[styles.passwordContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {/* 验证码输入 */}
          {mode === 'verify' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>验证码</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, letterSpacing: 8, textAlign: 'center', fontSize: 24 }]}
                placeholder="请输入验证码"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity onPress={handleSendCode} disabled={isLoading} style={styles.resendButton}>
                <Text style={[styles.resendText, { color: colors.primary }]}>重新发送验证码</Text>
              </TouchableOpacity>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 主按钮 */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
            onPress={mode === 'login' ? handleLogin : mode === 'register' ? handleSendCode : handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '处理中...' : mode === 'login' ? '登录' : mode === 'register' ? '发送验证码' : '完成注册'}
            </Text>
          </TouchableOpacity>

          {/* 底部切换链接 */}
          <View style={styles.switchContainer}>
            {mode === 'login' ? (
              <>
                <Text style={[styles.switchQuestion, { color: colors.textSecondary }]}>还没有账户？</Text>
                <TouchableOpacity onPress={switchToRegister}>
                  <Text style={[styles.switchLink, { color: colors.primary }]}>立即注册</Text>
                </TouchableOpacity>
              </>
            ) : mode === 'register' ? (
              <>
                <Text style={[styles.switchQuestion, { color: colors.textSecondary }]}>已有账户？</Text>
                <TouchableOpacity onPress={switchToLogin}>
                  <Text style={[styles.switchLink, { color: colors.primary }]}>立即登录</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.switchQuestion, { color: colors.textSecondary }]}>信息有误？</Text>
                <TouchableOpacity onPress={backToRegister}>
                  <Text style={[styles.switchLink, { color: colors.primary }]}>返回修改</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center' },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12 },
  passwordInput: { flex: 1, padding: 16, fontSize: 16 },
  eyeIcon: { padding: 16 },
  resendButton: { marginTop: 12, alignItems: 'center' },
  resendText: { fontSize: 14, fontWeight: '500' },
  errorContainer: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  button: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  switchQuestion: { fontSize: 14 },
  switchLink: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
});
