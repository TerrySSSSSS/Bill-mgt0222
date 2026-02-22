import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  login,
  logout,
  registerWithVerification,
  sendVerificationEmail,
  User,
} from '@/services/insforge-auth';

interface UserRegistrationWithCode {
  email: string;
  password: string;
  username: string;
  verificationCode: string;
}

interface UserLogin {
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  sendCode: (email: string, password: string, username: string) => Promise<void>;
  registerWithCode: (data: UserRegistrationWithCode) => Promise<void>;
  login: (data: UserLogin) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_KEY = '@bill_app_token';
const USER_KEY = '@bill_app_user';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  sendCode: async (email: string, password: string, username: string) => {
    set({ isLoading: true, error: null });
    try {
      await sendVerificationEmail(email, password, username);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || '发送验证码失败', isLoading: false });
      throw error;
    }
  },

  registerWithCode: async (data: UserRegistrationWithCode) => {
    set({ isLoading: true, error: null });
    try {
      const response = await registerWithVerification(
        data.email,
        data.password,
        data.username,
        data.verificationCode
      );

      await AsyncStorage.setItem(TOKEN_KEY, response.accessToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message || '注册失败', isLoading: false });
      throw error;
    }
  },

  login: async (data: UserLogin) => {
    set({ isLoading: true, error: null });
    try {
      const response = await login(data.email, data.password);

      await AsyncStorage.setItem(TOKEN_KEY, response.accessToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message || '登录失败', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await logout();
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message || '退出登录失败', isLoading: false });
      throw error;
    }
  },

  loadUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(USER_KEY);

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || '加载用户信息失败', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
