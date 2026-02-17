import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { getInsForgeConfig } from '@/config/insforge';

// 创建 axios 实例（动态配置）
function createInsForgeClient(): AxiosInstance {
  const config = getInsForgeConfig();

  return axios.create({
    baseURL: config.baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    timeout: 30000,
  });
}

// 获取客户端实例
function getClient(): AxiosInstance {
  return createInsForgeClient();
}

// 检查 InsForge 是否启用
function isInsForgeEnabled(): boolean {
  const config = getInsForgeConfig();
  return config.enabled;
}

// 包装 API 调用，处理离线模式
async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  offlineMessage: string = '当前处于离线模式，此功能需要 InsForge 服务器'
): Promise<T> {
  if (!isInsForgeEnabled()) {
    throw new Error(offlineMessage);
  }

  try {
    return await apiCall();
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('无法连接到 InsForge 服务器，请检查服务器是否运行');
    }
    throw error;
  }
}

// ============ 用户认证相关 ============

export interface UserRegistration {
  email: string;
  password: string;
  username?: string;
  phone?: string;
  code?: string; // 验证码
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// 用户注册
export async function registerUser(data: UserRegistration): Promise<AuthResponse> {
  return safeApiCall(async () => {
    const client = getClient();
    const response = await client.post('/api/auth/register', data);
    return response.data;
  }, '注册功能需要 InsForge 服务器');
}

// 用户登录
export async function loginUser(data: UserLogin): Promise<AuthResponse> {
  return safeApiCall(async () => {
    const client = getClient();
    const response = await client.post('/api/auth/login', data);
    return response.data;
  }, '登录功能需要 InsForge 服务器');
}

// 获取当前用户信息
export async function getCurrentUser(token: string): Promise<User> {
  return safeApiCall(async () => {
    const client = getClient();
    const response = await client.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }, '获取用户信息需要 InsForge 服务器');
}

// 退出登录
export async function logoutUser(token: string): Promise<void> {
  return safeApiCall(async () => {
    const client = getClient();
    await client.post('/api/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }, '退出登录需要 InsForge 服务器');
}

// ============ AI 功能相关 ============

export interface InvoiceRecognitionResult {
  invoiceNumber?: string;
  date?: string;
  amount?: number;
  vendor?: string;
  category?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    price?: number;
    amount?: number;
  }>;
  taxAmount?: number;
  totalAmount?: number;
  confidence?: number;
}

export interface VoiceRecognitionResult {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
}

// AI 发票识别
export async function recognizeInvoice(
  imageData: string | Blob,
  token: string
): Promise<InvoiceRecognitionResult> {
  return safeApiCall(async () => {
    const client = getClient();
    const formData = new FormData();

    if (typeof imageData === 'string') {
      formData.append('image', imageData);
    } else {
      formData.append('image', imageData, 'invoice.jpg');
    }

    const response = await client.post('/api/ai/invoice-recognition', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }, 'AI 发票识别需要 InsForge 服务器');
}

// AI 语音识别
export async function recognizeVoice(
  audioData: string | Blob,
  token: string,
  language: string = 'zh-CN'
): Promise<VoiceRecognitionResult> {
  return safeApiCall(async () => {
    const client = getClient();
    const formData = new FormData();

    if (typeof audioData === 'string') {
      formData.append('audio', audioData);
    } else {
      formData.append('audio', audioData, 'voice.wav');
    }

    formData.append('language', language);

    const response = await client.post('/api/ai/voice-recognition', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }, 'AI 语音识别需要 InsForge 服务器');
}

// AI 智能分类（根据描述自动分类交易）
export async function categorizeTransaction(
  description: string,
  token: string
): Promise<{ category: string; categoryIcon: string; confidence: number }> {
  return safeApiCall(async () => {
    const client = getClient();
    const response = await client.post('/api/ai/categorize',
      { description },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  }, 'AI 智能分类需要 InsForge 服务器');
}

// ============ 数据同步相关 ============

export interface SyncData {
  accounts?: any[];
  transactions?: any[];
  lastSyncTime?: string;
}

// 上传数据到云端
export async function syncDataToCloud(data: SyncData, token: string): Promise<void> {
  return safeApiCall(async () => {
    const client = getClient();
    await client.post('/api/sync/upload', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }, '数据同步需要 InsForge 服务器');
}

// 从云端下载数据
export async function syncDataFromCloud(token: string): Promise<SyncData> {
  return safeApiCall(async () => {
    const client = getClient();
    const response = await client.get('/api/sync/download', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }, '数据同步需要 InsForge 服务器');
}

// ============ 文件存储相关 ============

export interface FileUploadResult {
  fileId: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// 上传文件（如发票图片、语音文件）
export async function uploadFile(
  file: Blob | File,
  token: string,
  folder: string = 'invoices'
): Promise<FileUploadResult> {
  return safeApiCall(async () => {
    const client = getClient();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await client.post('/api/storage/upload', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }, '文件上传需要 InsForge 服务器');
}

// 获取文件 URL
export async function getFileUrl(fileId: string, token: string): Promise<string> {
  return safeApiCall(async () => {
    const client = getClient();
    const response = await client.get(`/api/storage/file/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.url;
  }, '获取文件需要 InsForge 服务器');
}

// 删除文件
export async function deleteFile(fileId: string, token: string): Promise<void> {
  return safeApiCall(async () => {
    const client = getClient();
    await client.delete(`/api/storage/file/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }, '删除文件需要 InsForge 服务器');
}

// 导出配置函数供外部使用
export { getInsForgeConfig, isInsForgeEnabled };
