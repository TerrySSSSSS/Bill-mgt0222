// 数据同步服务 - 本地 ↔ 云端（简化版）
import { getInsforgeClient, initInsforgeClient } from './insforge-client';
import * as SQLite from '../db/sqlite/database';
import { Account } from './data-service';
import { Transaction } from './transaction-service';

/**
 * 同步未同步的账户到云端
 */
export async function syncAccountsToCloud(userId: string): Promise<number> {
  try {
    const db = await SQLite.getDatabase();

    // 获取所有未同步的账户
    const unsyncedAccounts = await db.getAllAsync<Account>(
      'SELECT * FROM accounts WHERE user_id = ? AND synced = 0',
      [userId]
    );

    if (unsyncedAccounts.length === 0) {
      console.log('✅ 没有需要同步的账户');
      return 0;
    }

    console.log(`📤 开始同步 ${unsyncedAccounts.length} 个账户到云端...`);

    await initInsforgeClient();
    const client = getInsforgeClient();

    // 批量上传到云端
    const { error } = await client.database
      .from('accounts')
      .upsert(unsyncedAccounts, { onConflict: 'id' });

    if (error) {
      throw new Error(`同步账户失败: ${error.message}`);
    }

    // 更新本地同步状态
    const now = new Date().toISOString();
    for (const account of unsyncedAccounts) {
      await db.runAsync(
        'UPDATE accounts SET synced = 1, last_sync = ? WHERE id = ?',
        [now, account.id]
      );
    }

    console.log(`✅ 成功同步 ${unsyncedAccounts.length} 个账户`);
    return unsyncedAccounts.length;
  } catch (error) {
    console.error('同步账户到云端失败:', error);
    throw error;
  }
}

/**
 * 从云端同步账户到本地
 */
export async function syncAccountsFromCloud(userId: string): Promise<number> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    // 从云端获取所有账户
    const { data: cloudAccounts, error } = await client.database
      .from('accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`获取云端账户失败: ${error.message}`);
    }

    if (!cloudAccounts || cloudAccounts.length === 0) {
      console.log('✅ 云端没有账户数据');
      return 0;
    }

    console.log(`📥 开始从云端同步 ${cloudAccounts.length} 个账户...`);

    const db = await SQLite.getDatabase();
    const now = new Date().toISOString();

    // 批量插入或更新到本地
    for (const account of cloudAccounts) {
      await db.runAsync(
        `INSERT OR REPLACE INTO accounts (
          id, user_id, name, balance, icon, color,
          created_at, updated_at, synced, last_sync
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          account.id,
          account.user_id,
          account.name,
          account.balance,
          account.icon,
          account.color,
          account.created_at,
          account.updated_at,
          now,
        ]
      );
    }

    console.log(`✅ 成功从云端同步 ${cloudAccounts.length} 个账户`);
    return cloudAccounts.length;
  } catch (error) {
    console.error('从云端同步账户失败:', error);
    throw error;
  }
}

/**
 * 同步未同步的交易到云端
 */
export async function syncTransactionsToCloud(userId: string): Promise<number> {
  try {
    const db = await SQLite.getDatabase();

    // 获取所有未同步的交易
    const unsyncedTransactions = await db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE user_id = ? AND synced = 0',
      [userId]
    );

    if (unsyncedTransactions.length === 0) {
      console.log('✅ 没有需要同步的交易');
      return 0;
    }

    console.log(`📤 开始同步 ${unsyncedTransactions.length} 个交易到云端...`);

    await initInsforgeClient();
    const client = getInsforgeClient();

    // 批量上传到云端
    const { error } = await client.database
      .from('transactions')
      .upsert(unsyncedTransactions, { onConflict: 'id' });

    if (error) {
      throw new Error(`同步交易失败: ${error.message}`);
    }

    // 更新本地同步状态
    const now = new Date().toISOString();
    for (const transaction of unsyncedTransactions) {
      await db.runAsync(
        'UPDATE transactions SET synced = 1, last_sync = ? WHERE id = ?',
        [now, transaction.id]
      );
    }

    console.log(`✅ 成功同步 ${unsyncedTransactions.length} 个交易`);
    return unsyncedTransactions.length;
  } catch (error) {
    console.error('同步交易到云端失败:', error);
    throw error;
  }
}

/**
 * 从云端同步交易到本地
 */
export async function syncTransactionsFromCloud(userId: string): Promise<number> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    // 从云端获取所有交易
    const { data: cloudTransactions, error } = await client.database
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`获取云端交易失败: ${error.message}`);
    }

    if (!cloudTransactions || cloudTransactions.length === 0) {
      console.log('✅ 云端没有交易数据');
      return 0;
    }

    console.log(`📥 开始从云端同步 ${cloudTransactions.length} 个交易...`);

    const db = await SQLite.getDatabase();
    const now = new Date().toISOString();

    // 批量插入或更新到本地
    for (const transaction of cloudTransactions) {
      await db.runAsync(
        `INSERT OR REPLACE INTO transactions (
          id, user_id, account_id, type, amount, category, category_icon,
          date, description, created_at, updated_at, synced, last_sync,
          invoice_image_url, voice_note_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          transaction.id,
          transaction.user_id,
          transaction.account_id,
          transaction.type,
          transaction.amount,
          transaction.category,
          transaction.category_icon,
          transaction.date,
          transaction.description,
          transaction.created_at,
          transaction.updated_at,
          now,
          transaction.invoice_image_url,
          transaction.voice_note_url,
        ]
      );
    }

    console.log(`✅ 成功从云端同步 ${cloudTransactions.length} 个交易`);
    return cloudTransactions.length;
  } catch (error) {
    console.error('从云端同步交易失败:', error);
    throw error;
  }
}

/**
 * 完整同步：本地 → 云端 → 本地
 */
export async function fullSync(userId: string): Promise<{
  accountsToCloud: number;
  accountsFromCloud: number;
  transactionsToCloud: number;
  transactionsFromCloud: number;
}> {
  console.log('🔄 开始完整同步...');

  try {
    // 1. 先上传本地未同步的数据到云端
    const accountsToCloud = await syncAccountsToCloud(userId);
    const transactionsToCloud = await syncTransactionsToCloud(userId);

    // 2. 再从云端下载最新数据到本地
    const accountsFromCloud = await syncAccountsFromCloud(userId);
    const transactionsFromCloud = await syncTransactionsFromCloud(userId);

    console.log('✅ 完整同步完成');

    return {
      accountsToCloud,
      accountsFromCloud,
      transactionsToCloud,
      transactionsFromCloud,
    };
  } catch (error) {
    console.error('完整同步失败:', error);
    throw error;
  }
}

/**
 * 自动同步（后台定期执行）
 */
export async function autoSync(userId: string): Promise<void> {
  try {
    console.log('🔄 自动同步开始...');
    await fullSync(userId);
    console.log('✅ 自动同步完成');
  } catch (error) {
    console.error('⚠️ 自动同步失败，将在下次重试:', error);
  }
}

/**
 * 启动自动同步（每 5 分钟）
 */
export function startAutoSync(userId: string): ReturnType<typeof setInterval> {
  console.log('🚀 启动自动同步服务（每 5 分钟）');

  // 立即执行一次
  autoSync(userId);

  // 每 5 分钟执行一次
  return setInterval(() => {
    autoSync(userId);
  }, 5 * 60 * 1000);
}

/**
 * 停止自动同步
 */
export function stopAutoSync(intervalId: ReturnType<typeof setInterval>): void {
  clearInterval(intervalId);
  console.log('⏹️ 自动同步服务已停止');
}
