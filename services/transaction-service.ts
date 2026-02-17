// 交易数据服务扩展
import { getInsforgeClient, initInsforgeClient } from './insforge-client';
import * as SQLite from '../db/sqlite/database';
import { getDataSource } from './data-service';

// 交易类型定义
export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  category_icon?: string;
  date: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  synced?: boolean;
  last_sync?: string;
  invoice_image_url?: string;
  voice_note_url?: string;
}

/**
 * 获取所有交易
 */
export async function getTransactions(userId: string, limit?: number): Promise<Transaction[]> {
  const dataSource = getDataSource();

  if (dataSource === 'cloud') {
    return getTransactionsFromCloud(userId, limit);
  } else if (dataSource === 'local') {
    return getTransactionsFromLocal(userId, limit);
  } else {
    // hybrid: 优先从本地读取
    const localTransactions = await getTransactionsFromLocal(userId, limit);
    if (localTransactions.length > 0) {
      return localTransactions;
    }
    return getTransactionsFromCloud(userId, limit);
  }
}

/**
 * 从云端获取交易
 */
async function getTransactionsFromCloud(userId: string, limit?: number): Promise<Transaction[]> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    let query = client.database
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取交易失败: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('从云端获取交易失败:', error);
    throw error;
  }
}

/**
 * 从本地获取交易
 */
async function getTransactionsFromLocal(userId: string, limit?: number): Promise<Transaction[]> {
  try {
    const db = await SQLite.getDatabase();
    const sql = limit
      ? 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT ?'
      : 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC';
    const params = limit ? [userId, limit] : [userId];

    return db.getAllAsync<Transaction>(sql, params);
  } catch (error) {
    console.error('从本地获取交易失败:', error);
    throw error;
  }
}

/**
 * 创建交易
 */
export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
): Promise<Transaction> {
  const transactionId = generateId();
  const now = new Date().toISOString();

  const newTransaction: Transaction = {
    ...transaction,
    id: transactionId,
    created_at: now,
    updated_at: now,
    synced: getDataSource() === 'cloud',
  };

  const dataSource = getDataSource();

  if (dataSource === 'local') {
    return createTransactionInLocal(newTransaction);
  } else if (dataSource === 'cloud') {
    return createTransactionInCloud(newTransaction);
  } else {
    // hybrid: 同时写入本地和云端
    const cloudTransaction = await createTransactionInCloud(newTransaction);
    await createTransactionInLocal({ ...cloudTransaction, synced: true });
    return cloudTransaction;
  }
}

/**
 * 在云端创建交易
 */
async function createTransactionInCloud(transaction: Transaction): Promise<Transaction> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    const { data, error } = await client.database
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      throw new Error(`创建交易失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('在云端创建交易失败:', error);
    throw error;
  }
}

/**
 * 在本地创建交易
 */
async function createTransactionInLocal(transaction: Transaction): Promise<Transaction> {
  try {
    const db = await SQLite.getDatabase();
    await db.runAsync(
      `INSERT INTO transactions (
        id, user_id, account_id, type, amount, category, category_icon,
        date, description, created_at, updated_at, synced, last_sync,
        invoice_image_url, voice_note_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.user_id,
        transaction.account_id,
        transaction.type,
        transaction.amount,
        transaction.category,
        transaction.category_icon || 'circle',
        transaction.date,
        transaction.description || '',
        transaction.created_at || new Date().toISOString(),
        transaction.updated_at || new Date().toISOString(),
        transaction.synced ? 1 : 0,
        transaction.last_sync || new Date().toISOString(),
        transaction.invoice_image_url || null,
        transaction.voice_note_url || null,
      ]
    );
    return transaction;
  } catch (error) {
    console.error('在本地创建交易失败:', error);
    throw error;
  }
}

/**
 * 更新交易
 */
export async function updateTransaction(
  transactionId: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  const now = new Date().toISOString();
  const updatedData = {
    ...updates,
    updated_at: now,
    synced: getDataSource() === 'cloud',
  };

  const dataSource = getDataSource();

  if (dataSource === 'local') {
    return updateTransactionInLocal(transactionId, updatedData);
  } else if (dataSource === 'cloud') {
    return updateTransactionInCloud(transactionId, updatedData);
  } else {
    // hybrid: 同时更新本地和云端
    const cloudTransaction = await updateTransactionInCloud(transactionId, updatedData);
    await updateTransactionInLocal(transactionId, { ...updatedData, synced: true });
    return cloudTransaction;
  }
}

/**
 * 在云端更新交易
 */
async function updateTransactionInCloud(
  transactionId: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    const { data, error } = await client.database
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新交易失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('在云端更新交易失败:', error);
    throw error;
  }
}

/**
 * 在本地更新交易
 */
async function updateTransactionInLocal(
  transactionId: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  try {
    const db = await SQLite.getDatabase();

    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);

    await db.runAsync(
      `UPDATE transactions SET ${setClause} WHERE id = ?`,
      [...values, transactionId]
    );

    const result = await db.getFirstAsync<Transaction>(
      'SELECT * FROM transactions WHERE id = ?',
      [transactionId]
    );

    if (!result) {
      throw new Error('交易不存在');
    }

    return result;
  } catch (error) {
    console.error('在本地更新交易失败:', error);
    throw error;
  }
}

/**
 * 删除交易
 */
export async function deleteTransaction(transactionId: string): Promise<void> {
  const dataSource = getDataSource();

  if (dataSource === 'local') {
    return deleteTransactionFromLocal(transactionId);
  } else if (dataSource === 'cloud') {
    return deleteTransactionFromCloud(transactionId);
  } else {
    // hybrid: 同时删除本地和云端
    await deleteTransactionFromCloud(transactionId);
    await deleteTransactionFromLocal(transactionId);
  }
}

/**
 * 从云端删除交易
 */
async function deleteTransactionFromCloud(transactionId: string): Promise<void> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    const { error } = await client.database.from('transactions').delete().eq('id', transactionId);

    if (error) {
      throw new Error(`删除交易失败: ${error.message}`);
    }
  } catch (error) {
    console.error('从云端删除交易失败:', error);
    throw error;
  }
}

/**
 * 从本地删除交易
 */
async function deleteTransactionFromLocal(transactionId: string): Promise<void> {
  try {
    const db = await SQLite.getDatabase();
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [transactionId]);
  } catch (error) {
    console.error('从本地删除交易失败:', error);
    throw error;
  }
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
