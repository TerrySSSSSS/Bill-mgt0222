import { useAuthStore } from '@/store/auth';
import {
  getAllAccounts,
  getAllTransactions,
  syncDataToCloud,
  syncDataFromCloud,
  SyncData,
} from '@/services/insforge';
import * as database from '@/db/sqlite/database';
import { Account, Transaction } from '@/db/sqlite/schema';

// 同步状态管理
let isSyncing = false;
let lastSyncTime: string | null = null;

// 获取最后同步时间
export function getLastSyncTime(): string | null {
  return lastSyncTime;
}

// 上传本地数据到云端
export async function uploadLocalData(): Promise<void> {
  const { token, isAuthenticated, user } = useAuthStore.getState();

  if (!isAuthenticated || !token || !user) {
    throw new Error('请先登录');
  }

  if (isSyncing) {
    throw new Error('正在同步中，请稍候');
  }

  isSyncing = true;

  try {
    // 获取本地所有数据
    const accounts = await database.getAllAccounts();
    const transactions = await database.getAllTransactions();

    // 添加用户 ID
    const accountsWithUserId = accounts.map(acc => ({
      ...acc,
      user_id: user.id,
    }));

    const transactionsWithUserId = transactions.map(trans => ({
      ...trans,
      user_id: user.id,
    }));

    // 上传到云端
    const syncData: SyncData = {
      accounts: accountsWithUserId,
      transactions: transactionsWithUserId,
      lastSyncTime: new Date().toISOString(),
    };

    await syncDataToCloud(syncData, token);

    // 更新本地同步状态
    lastSyncTime = new Date().toISOString();

    console.log('Data uploaded to cloud successfully');
  } catch (error) {
    console.error('Upload data failed:', error);
    throw error;
  } finally {
    isSyncing = false;
  }
}

// 从云端下载数据到本地
export async function downloadCloudData(): Promise<void> {
  const { token, isAuthenticated, user } = useAuthStore.getState();

  if (!isAuthenticated || !token || !user) {
    throw new Error('请先登录');
  }

  if (isSyncing) {
    throw new Error('正在同步中，请稍候');
  }

  isSyncing = true;

  try {
    // 从云端下载数据
    const cloudData = await syncDataFromCloud(token);

    if (!cloudData.accounts && !cloudData.transactions) {
      console.log('No cloud data to sync');
      return;
    }

    // 清空本地数据（可选，根据需求决定是否清空）
    // 这里我们采用合并策略，不清空本地数据

    // 同步账户数据
    if (cloudData.accounts && cloudData.accounts.length > 0) {
      for (const account of cloudData.accounts) {
        // 检查账户是否已存在
        const existingAccount = await database.getAccountById(account.id);
        if (existingAccount) {
          // 更新账户
          await database.updateAccount(account.id, account);
        } else {
          // 创建新账户
          await database.createAccount(account);
        }
      }
    }

    // 同步交易数据
    if (cloudData.transactions && cloudData.transactions.length > 0) {
      for (const transaction of cloudData.transactions) {
        // 检查交易是否已存在
        const existingTransaction = await database.getTransactionById(transaction.id);
        if (existingTransaction) {
          // 更新交易
          await database.updateTransaction(transaction.id, transaction);
        } else {
          // 创建新交易
          await database.createTransaction(transaction);
        }
      }
    }

    // 更新最后同步时间
    lastSyncTime = cloudData.lastSyncTime || new Date().toISOString();

    console.log('Data downloaded from cloud successfully');
  } catch (error) {
    console.error('Download data failed:', error);
    throw error;
  } finally {
    isSyncing = false;
  }
}

// 自动同步（上传本地更改）
export async function autoSync(): Promise<void> {
  const { isAuthenticated } = useAuthStore.getState();

  if (!isAuthenticated) {
    return;
  }

  try {
    await uploadLocalData();
  } catch (error) {
    console.error('Auto sync failed:', error);
  }
}

// 双向同步（先下载，再上传）
export async function bidirectionalSync(): Promise<void> {
  const { token, isAuthenticated } = useAuthStore.getState();

  if (!isAuthenticated || !token) {
    throw new Error('请先登录');
  }

  if (isSyncing) {
    throw new Error('正在同步中，请稍候');
  }

  try {
    // 先从云端下载数据
    await downloadCloudData();

    // 再上传本地数据
    await uploadLocalData();

    console.log('Bidirectional sync completed');
  } catch (error) {
    console.error('Bidirectional sync failed:', error);
    throw error;
  }
}

// 检查是否需要同步
export function shouldSync(): boolean {
  if (!lastSyncTime) {
    return true;
  }

  const lastSync = new Date(lastSyncTime);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

  // 如果超过 30 分钟未同步，则需要同步
  return diffMinutes > 30;
}

// 初始化同步（应用启动时调用）
export async function initSync(): Promise<void> {
  const { isAuthenticated } = useAuthStore.getState();

  if (!isAuthenticated) {
    return;
  }

  try {
    // 检查是否需要同步
    if (shouldSync()) {
      await bidirectionalSync();
    }
  } catch (error) {
    console.error('Init sync failed:', error);
  }
}
