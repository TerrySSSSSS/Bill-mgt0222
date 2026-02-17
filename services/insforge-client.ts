// InsForge SDK 客户端配置
import { createClient } from '@insforge/sdk';

// InsForge 配置
const INSFORGE_CONFIG = {
  baseUrl: 'https://c6xm83me.us-east.insforge.app',
  anonKey: 'ik_e2dc086c6e39ccf0ccb86fb18380a740',
};

// 创建 InsForge 客户端实例
let insforgeClient: any = null;

/**
 * 初始化 InsForge 客户端
 * 需要先获取 anon key
 */
export async function initInsforgeClient(anonKey?: string) {
  if (insforgeClient) {
    return insforgeClient;
  }

  const key = anonKey || INSFORGE_CONFIG.anonKey;

  if (!key) {
    throw new Error('InsForge anon key is required. Please set it in config or pass as parameter.');
  }

  insforgeClient = createClient({
    baseUrl: INSFORGE_CONFIG.baseUrl,
    anonKey: key,
  });

  console.log('✅ InsForge client initialized');
  return insforgeClient;
}

/**
 * 获取 InsForge 客户端实例
 */
export function getInsforgeClient() {
  if (!insforgeClient) {
    throw new Error('InsForge client not initialized. Call initInsforgeClient() first.');
  }
  return insforgeClient;
}

/**
 * 设置 anon key（从 MCP 工具获取后调用）
 */
export function setAnonKey(anonKey: string) {
  INSFORGE_CONFIG.anonKey = anonKey;
}

export { INSFORGE_CONFIG };
