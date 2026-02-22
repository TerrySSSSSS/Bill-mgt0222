// InsForge 认证服务 - 使用原生 auth API
import { getInsforgeClient, initInsforgeClient } from './insforge-client';

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
}

/**
 * 发送注册验证码
 */
export async function sendVerificationEmail(email: string): Promise<void> {
  await initInsforgeClient();
  const client = getInsforgeClient();

  const { error } = await client.auth.sendVerificationEmail({ email });
  if (error) {
    throw new Error(`发送验证码失败: ${error.message || '请稍后重试'}`);
  }
}

/**
 * 用户注册（需要验证码）
 */
export async function registerWithVerification(
  email: string,
  password: string,
  username: string,
  verificationCode: string
): Promise<AuthResponse> {
  await initInsforgeClient();
  const client = getInsforgeClient();

  // 1. 先验证邮箱验证码
  const { error: verifyError } = await client.auth.verifyEmail({
    email,
    otp: verificationCode,
  });

  if (verifyError) {
    throw new Error('验证码错误或已过期，请重新获取');
  }

  // 2. 注册账号
  const { data, error } = await client.auth.signUp({
    email,
    password,
    name: username,
  });

  if (error || !data) {
    throw new Error(`注册失败: ${error?.message || '请稍后重试'}`);
  }

  // InsForge 注册后可能需要再次登录获取 token
  if (!data.accessToken) {
    // 注册成功但需要登录
    return await login(email, password);
  }

  const user: User = {
    id: data.user?.id || '',
    email: data.user?.email || email,
    username: data.user?.name || username,
    email_verified: true,
    created_at: data.user?.createdAt || new Date().toISOString(),
  };

  return { user, accessToken: data.accessToken };
}

/**
 * 用户注册（不需要验证码，直接注册）
 */
export async function register(
  email: string,
  password: string,
  username?: string
): Promise<AuthResponse> {
  await initInsforgeClient();
  const client = getInsforgeClient();

  const { data, error } = await client.auth.signUp({
    email,
    password,
    name: username || email.split('@')[0],
  });

  if (error) {
    throw new Error(`注册失败: ${error.message || '请稍后重试'}`);
  }

  // 如果需要邮箱验证，提示用户
  if (data?.requireEmailVerification) {
    throw new Error('REQUIRE_EMAIL_VERIFICATION');
  }

  if (!data?.accessToken) {
    throw new Error('注册失败: 未获取到登录凭证');
  }

  const user: User = {
    id: data.user?.id || '',
    email: data.user?.email || email,
    username: data.user?.name || username,
    email_verified: data.user?.emailVerified || false,
    created_at: data.user?.createdAt || new Date().toISOString(),
  };

  return { user, accessToken: data.accessToken };
}

/**
 * 用户登录
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  await initInsforgeClient();
  const client = getInsforgeClient();

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error || !data) {
    throw new Error('邮箱或密码错误');
  }

  if (!data.accessToken) {
    throw new Error('登录失败: 未获取到登录凭证');
  }

  // 设置 token 到 http client
  client.http.setAuthToken(data.accessToken);

  const user: User = {
    id: data.user?.id || '',
    email: data.user?.email || email,
    username: data.user?.name || email.split('@')[0],
    email_verified: data.user?.emailVerified || false,
    created_at: data.user?.createdAt || new Date().toISOString(),
  };

  return { user, accessToken: data.accessToken };
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();
    await client.auth.signOut();
  } catch {
    // 忽略登出错误
  }
}

/**
 * 获取当前用户（从本地存储）
 */
export async function getCurrentUser(): Promise<User | null> {
  return null; // 由 store 管理
}

/**
 * 检查用户是否已登录
 */
export async function isAuthenticated(): Promise<boolean> {
  return false; // 由 store 管理
}

/**
 * 获取访问令牌
 */
export async function getAccessToken(): Promise<string | null> {
  return null; // 由 store 管理
}
