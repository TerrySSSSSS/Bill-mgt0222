import { initDatabase } from '@/db/sqlite/database';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth';
import { initSync } from '@/services/sync';
import { autoConfigureInsForge } from '@/config/insforge';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loadUser, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 初始化数据库
    initDatabase();

    // 自动配置 InsForge（检测可用服务器）
    autoConfigureInsForge().then(() => {
      // 加载用户信息
      loadUser().then(() => {
        // 初始化数据同步
        initSync().catch(err => {
          console.error('Init sync failed:', err);
        });
        // 标记为已准备好
        setIsReady(true);
      });
    });
  }, []);

  // 登录状态检查和路由保护
  useEffect(() => {
    if (!isReady) return; // 等待初始化完成

    const inAuthGroup = segments[0] === 'auth';

    // 如果用户未登录且不在登录页，跳转到登录页
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth');
    }
    // 如果用户已登录且在登录页，跳转到主页
    else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isReady]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal', title: '记一笔', headerShown: false }} />
        <Stack.Screen name="add-account" options={{ presentation: 'modal', title: '添加账户', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
