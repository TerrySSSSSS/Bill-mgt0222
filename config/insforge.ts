// InsForge 配置管理
export interface InsForgeConfig {
  apiKey: string;
  baseURL: string;
  enabled: boolean;
}

// 云端配置（使用真实的 InsForge 服务）
const CLOUD_CONFIG: InsForgeConfig = {
  apiKey: 'ik_7ef84c7032e3c45a56867999943094f1',
  baseURL: 'https://3jusuein.us-west.insforge.app',
  enabled: true, // 默认启用云端服务
};

// 本地配置（备用）
const LOCAL_CONFIG: InsForgeConfig = {
  apiKey: 'ik_7ef84c7032e3c45a56867999943094f1',
  baseURL: 'http://localhost:7130',
  enabled: false,
};

// 当前配置 - 默认使用云端服务
let currentConfig: InsForgeConfig = { ...CLOUD_CONFIG };

// 获取当前配置
export function getInsForgeConfig(): InsForgeConfig {
  return { ...currentConfig };
}

// 设置配置
export function setInsForgeConfig(config: Partial<InsForgeConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  console.log('InsForge config updated:', currentConfig);
}

// 切换到本地服务器
export function useLocalServer(): void {
  setInsForgeConfig({
    baseURL: LOCAL_CONFIG.baseURL,
  });
}

// 切换到云端服务器
export function useCloudServer(): void {
  setInsForgeConfig({
    baseURL: CLOUD_CONFIG.baseURL,
  });
}

// 启用 InsForge
export function enableInsForge(): void {
  setInsForgeConfig({ enabled: true });
}

// 禁用 InsForge
export function disableInsForge(): void {
  setInsForgeConfig({ enabled: false });
}

// 检查 InsForge 是否可用
export async function checkInsForgeAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${currentConfig.baseURL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentConfig.apiKey}`,
      },
      timeout: 5000,
    } as any);

    if (response.ok) {
      console.log('InsForge server is available:', currentConfig.baseURL);
      enableInsForge();
      return true;
    }
  } catch (error) {
    console.log('InsForge server is not available:', error);
  }

  disableInsForge();
  return false;
}

// 自动检测并配置最佳服务器
export async function autoConfigureInsForge(): Promise<void> {
  // 直接使用固定的云端服务器，不做自动检测
  console.log('InsForge configured:', CLOUD_CONFIG.baseURL);
}

export default currentConfig;
