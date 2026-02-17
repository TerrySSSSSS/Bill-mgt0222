// 数据访问抽象层 - 支持本地 SQLite 和云端 InsForge 切换
import { getInsforgeClient, initInsforgeClient } from './insforge-client';
import { getAccessToken } from './insforge-auth';
import * as SQLite from '../db/sqlite/database';

// 数据源类型
export type DataSource = 'local' | 'cloud' | 'hybrid';

// 当前数据源配置
let currentDataSource: DataSource = 'hybrid'; // 默认混合模式

/**
 * 设置数据源
 */
export function setDataSource(source: DataSource) {
  currentDataSource = source;
  console.log(`📊 数据源已切换到: ${source}`);
}

/**
 * 获取当前数据源
 */
export function getDataSource(): DataSource {
  return currentDataSource;
}

// ============ 账户相关操作 ============

export interface Account {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
  synced?: boolean;
  last_sync?: string;
}

/**
 * 获取所有账户
 */
export async function getAccounts(userId: string): Promise<Account[]> {
  if (currentDataSource === 'cloud') {
    return getAccountsFromCloud(userId);
  } else if (currentDataSource === 'local') {
    return getAccountsFromLocal(userId);
  } else {
    // hybrid: 优先从本地读取，如果为空则从云端读取
    const localAccounts = await getAccountsFromLocal(userId);
    if (localAccounts.length > 0) {
      return localAccounts;
    }
    return getAccountsFromCloud(userId);
  }
}

/**
 * 从云端获取账户
 */
async function getAccountsFromCloud(userId: string): Promise<Account[]> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    const { data, error } = await client.database
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`获取账户失败: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('从云端获取账户失败:', error);
    throw error;
  }
}

/**
 * 从本地获取账户
 */
async function getAccountsFromLocal(userId: string): Promise<Account[]> {
  try {
    const db = await SQLite.getDatabase();
    return db.getAllAsync<Account>(
      'SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  } catch (error) {
    console.error('从本地获取账户失败:', error);
    throw error;
  }
}

/**
 * 创建账户
 */
export async function createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
  const accountId = generateId();
  const now = new Date().toISOString();

  const newAccount: Account = {
    ...account,
    id: accountId,
    created_at: now,
    updated_at: now,
    synced: currentDataSource === 'cloud',
  };

  if (currentDataSource === 'local') {
    return createAccountInLocal(newAccount);
  } else if (currentDataSource === 'cloud') {
    return createAccountInCloud(newAccount);
  } else {
    // hybrid: 同时写入本地和云端
    const cloudAccount = await createAccountInCloud(newAccount);
    await createAccountInLocal({ ...cloudAccount, synced: true });
    return cloudAccount;
  }
}

/**
 * 在云端创建账户
 */
async function createAccountInCloud(account: Account): Promise<Account> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    const { data, error } = await client.database
      .from('accounts')
      .insert([account])
      .select()
      .single();

    if (error) {
      throw new Error(`创建账户失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('在云端创建账户失败:', error);
    throw error;
  }
}

/**
 * 在本地创建账户
 */
async function createAccountInLocal(account: Account): Promise<Account> {
  try {
    const db = await SQLite.getDatabase();
    await db.runAsync(
      `INSERT INTO accounts (id, user_id, name, balance, icon, color, created_at, updated_at, synced, last_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.id,
        account.user_id,
        account.name,
        account.balance,
        account.icon || 'wallet',
        account.color || '#60A5FA',
        account.created_at || new Date().toISOString(),
        account.updated_at || new Date().toISOString(),
        account.synced ? 1 : 0,
        account.last_sync || new Date().toISOString(),
      ]
    );
    return account;
  } catch (error) {
    console.error('在本地创建账户失败:', error);
    throw error;
  }
}

/**
 * 更新账户
 */
export async function updateAccount(accountId: string, updates: Partial<Account>): Promise<Account> {
  const now = new Date().toISOString();
  const updatedData = {
    ...updates,
    updated_at: now,
    synced: currentDataSource === 'cloud',
  };

  if (currentDataSource === 'local') {
    return updateAccountInLocal(accountId, updatedData);
  } else if (currentDataSource === 'cloud') {
    return updateAccountInCloud(accountId, updatedData);
  } else {
    // hybrid: 同时更新本地和云端
    const cloudAccount = await updateAccountInCloud(accountId, updatedData);
    await updateAccountInLocal(accountId, { ...updatedData, synced: true });
    return cloudAccount;
  }
}

/**
 * 在云端更新账户
 */
async function updateAccountInCloud(accountId: string, updates: Partial<Account>): Promise<Account> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    const { data, error } = await client.database
      .from('accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新账户失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('在云端更新账户失败:', error);
    throw error;
  }
}

/**
 * 在本地更新账户
 */
async function updateAccountInLocal(accountId: string, updates: Partial<Account>): Promise<Account> {
  try {
    const db = await SQLite.getDatabase();

    // 构建 SET 子句
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);

    await db.runAsync(
      `UPDATE accounts SET ${setClause} WHERE id = ?`,
      [...values, accountId]
    );

    // 查询更新后的账户
    const result = await db.getFirstAsync<Account>(
      'SELECT * FROM accounts WHERE id = ?',
      [accountId]
    );

    if (!result) {
      throw new Error('账户不存在');
    }

    return result;
  } catch (error) {
    console.error('在本地更新账户失败:', error);
    throw error;
  }
}

/**
 * 删除账户
 */
export async function deleteAccount(accountId: string): Promise<void> {
  if (currentDataSource === 'local') {
    return deleteAccountFromLocal(accountId);
  } else if (currentDataSource === 'cloud') {
    return deleteAccountFromCloud(accountId);
  } else {
    // hybrid: 同时删除本地和云端
    await deleteAccountFromCloud(accountId);
    await deleteAccountFromLocal(accountId);
  }
}

/**
 * 从云端删除账户
 */
async function deleteAccountFromCloud(accountId: string): Promise<void> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    const { error } = await client.database
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      throw new Error(`删除账户失败: ${error.message}`);
    }
  } catch (error) {
    console.error('从云端删除账户失败:', error);
    throw error;
  }
}

/**
 * 从本地删除账户
 */
async function deleteAccountFromLocal(accountId: string): Promise<void> {
  try {
    const db = await SQLite.getDatabase();
    await db.runAsync('DELETE FROM accounts WHERE id = ?', [accountId]);
  } catch (error) {
    console.error('从本地删除账户失败:', error);
    throw error;
  }
}

// ============ 辅助函数 ============

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
