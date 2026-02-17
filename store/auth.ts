import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  register,
  login,
  logout,
  getCurrentUser,
  registerWithVerification,
  User,
} from '@/services/insforge-auth';

interface UserRegistration {
  email: string;
  password: string;
  username?: string;
  code?: string;
}

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
  register: (data: UserRegistration) => Promise<void>;
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

  register: async (data: UserRegistration) => {
    set({ isLoading: true, error: null });
    try {
      const response = await register(data.email, data.password, data.username);

      // 保存 token 和用户信息
      await AsyncStorage.setItem(TOKEN_KEY, response.accessToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || '注册失败',
        isLoading: false,
      });
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

      // 保存 token 和用户信息
      await AsyncStorage.setItem(TOKEN_KEY, response.accessToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || '注册失败',
        isLoading: false,
      });
      throw error;
    }
  },

  login: async (data: UserLogin) => {
    set({ isLoading: true, error: null });
    try {
      const response = await login(data.email, data.password);

      // 保存 token 和用户信息
      await AsyncStorage.setItem(TOKEN_KEY, response.accessToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || '登录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await logout();

      // 清除本地存储
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || '退出登录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  loadUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(USER_KEY);

      if (token && userStr) {
        // 验证 token 是否有效
        try {
          const currentUser = await getCurrentUser();
          set({
            user: currentUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token 无效，清除本地存储
          await AsyncStorage.removeItem(TOKEN_KEY);
          await AsyncStorage.removeItem(USER_KEY);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error.message || '加载用户信息失败',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
