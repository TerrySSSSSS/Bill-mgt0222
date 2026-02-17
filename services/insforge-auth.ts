// InsForge 认证服务
import { getInsforgeClient, initInsforgeClient } from './insforge-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// 用户类型定义
export interface User {
  id: string;
  email: string;
  username?: string;
  email_verified: boolean;
  created_at: string;
}

// 认证响应类型
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

// 存储 token 的 key
const TOKEN_KEY = '@insforge_access_token';
const USER_KEY = '@insforge_user';

/**
 * 用户注册
 * @param email 邮箱
 * @param password 密码
 * @param username 用户名（可选）
 */
export async function register(
  email: string,
  password: string,
  username?: string
): Promise<AuthResponse> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    // 生成用户 ID
    const userId = uuidv4();

    // 使用 bcrypt 加密密码（简化版，实际应该在服务端处理）
    const passwordHash = await hashPassword(password);

    // 插入用户数据到 InsForge 数据库
    const { data, error } = await client.database.from('users').insert([
      {
        id: userId,
        email: email,
        username: username || email.split('@')[0],
        password_hash: passwordHash,
        email_verified: false,
      },
    ]).select();

    if (error) {
      throw new Error(`注册失败: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('注册失败: 未返回用户数据');
    }

    const user = data[0];

    // 生成 JWT token（使用 InsForge 的认证功能）
    const accessToken = await generateToken(user);

    // 保存 token 和用户信息
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        email_verified: user.email_verified,
        created_at: user.created_at,
      },
      accessToken,
    };
  } catch (error: any) {
    console.error('注册错误:', error);
    throw error;
  }
}

/**
 * 用户登录
 * @param email 邮箱
 * @param password 密码
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    // 查询用户
    const { data, error } = await client.database
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      throw new Error('邮箱或密码错误');
    }

    // 验证密码
    const isValid = await verifyPassword(password, data.password_hash);
    if (!isValid) {
      throw new Error('邮箱或密码错误');
    }

    // 生成 JWT token
    const accessToken = await generateToken(data);

    // 保存 token 和用户信息
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data));

    return {
      user: {
        id: data.id,
        email: data.email,
        username: data.username,
        email_verified: data.email_verified,
        created_at: data.created_at,
      },
      accessToken,
    };
  } catch (error: any) {
    console.error('登录错误:', error);
    throw error;
  }
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('登出错误:', error);
    throw error;
  }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    if (!userJson) {
      return null;
    }
    return JSON.parse(userJson);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return null;
  }
}

/**
 * 获取访问令牌
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('获取 token 错误:', error);
    return null;
  }
}

/**
 * 检查用户是否已登录
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

/**
 * 发送邮箱验证码
 */
export async function sendVerificationEmail(email: string): Promise<void> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    const { error } = await client.auth.resendVerificationEmail({
      email: email
    });

    if (error) {
      throw new Error(`发送验证码失败: ${error.message}`);
    }

    console.log('✅ 验证码已发送到:', email);
    console.log('💡 开发提示: 如果邮件未收到，请检查 InsForge 后端的 SMTP 配置');
    console.log('💡 临时测试: 你也可以直接使用原来的注册方式（不需要验证码）');
  } catch (error: any) {
    console.error('发送验证码错误:', error);
    throw error;
  }
}

/**
 * 验证邮箱并注册
 */
export async function registerWithVerification(
  email: string,
  password: string,
  username: string,
  verificationCode: string
): Promise<AuthResponse> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    console.log('🔐 开始验证邮箱:', email);

    // 1. 先验证邮箱
    const { error: verifyError } = await client.auth.verifyEmail({
      email: email,
      otp: verificationCode
    });

    if (verifyError) {
      throw new Error(`验证码错误: ${verifyError.message}`);
    }

    console.log('✅ 邮箱验证成功');

    // 2. 验证成功后创建用户（使用 InsForge 的 signUp）
    const { data, error } = await client.auth.signUp({
      email: email,
      password: password,
      name: username
    });

    if (error || !data) {
      throw new Error(`注册失败: ${error?.message || '未知错误'}`);
    }

    console.log('✅ 用户注册成功:', data.user.email);

    // 3. 保存 token 和用户信息
    await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.name || username,
        email_verified: data.user.emailVerified || true,
        created_at: data.user.createdAt || new Date().toISOString(),
      },
      accessToken: data.accessToken,
    };
  } catch (error: any) {
    console.error('注册验证错误:', error);
    throw error;
  }
}

// ============ 辅助函数 ============

/**
 * 简单的密码哈希（实际应该使用 bcrypt）
 */
async function hashPassword(password: string): Promise<string> {
  // 这里使用简单的哈希，实际应该使用 bcrypt
  // 在生产环境中，密码哈希应该在服务端处理
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * 验证密码
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * 生成 JWT token（简化版）
 */
async function generateToken(user: any): Promise<string> {
  // 这里使用简单的 token 生成
  // 实际应该使用 InsForge 的认证功能或 JWT 库
  const payload = {
    sub: user.id,
    email: user.email,
    role: 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 天过期
  };

  // 简化版：直接返回 base64 编码的 payload
  // 实际应该使用 JWT 库进行签名
  return btoa(JSON.stringify(payload));
}
