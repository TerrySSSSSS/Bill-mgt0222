import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { Account, CREATE_ACCOUNTS_TABLE, CREATE_TRANSACTIONS_TABLE, Transaction } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

// 初始化数据库
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    // Web 平台需要特殊处理 SQLite WASM
    if (Platform.OS === 'web') {
      console.log('Initializing SQLite for web platform with WASM...');
    }

    db = await SQLite.openDatabaseAsync('billing.db');

    // 创建表
    await db.execAsync(CREATE_ACCOUNTS_TABLE);
    await db.execAsync(CREATE_TRANSACTIONS_TABLE);

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// 获取数据库实例
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return initDatabase();
  }
  return db;
}

// ============ 账户操作 ============

export async function getAllAccounts(): Promise<Account[]> {
  const database = await getDatabase();
  return database.getAllAsync<Account>('SELECT * FROM accounts ORDER BY created_at DESC');
}

export async function getAccountById(id: number): Promise<Account | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Account>('SELECT * FROM accounts WHERE id = ?', [id]);
}

export async function createAccount(account: Omit<Account, 'id' | 'created_at'>): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO accounts (name, balance, icon, color) VALUES (?, ?, ?, ?)',
    [account.name, account.balance, account.icon, account.color]
  );
  return result.lastInsertRowId;
}

export async function updateAccount(id: number, account: Partial<Account>): Promise<void> {
  const database = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];
  
  if (account.name !== undefined) { fields.push('name = ?'); values.push(account.name); }
  if (account.balance !== undefined) { fields.push('balance = ?'); values.push(account.balance); }
  if (account.icon !== undefined) { fields.push('icon = ?'); values.push(account.icon); }
  if (account.color !== undefined) { fields.push('color = ?'); values.push(account.color); }
  
  if (fields.length > 0) {
    values.push(id);
    await database.runAsync(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

export async function deleteAccount(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
}

export async function getTotalBalance(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(balance), 0) as total FROM accounts');
  return result?.total ?? 0;
}

// ============ 交易操作 ============

export async function getAllTransactions(limit?: number): Promise<Transaction[]> {
  const database = await getDatabase();
  const sql = `
    SELECT t.*, a.name as account_name 
    FROM transactions t 
    LEFT JOIN accounts a ON t.account_id = a.id 
    ORDER BY t.date DESC, t.created_at DESC
    ${limit ? `LIMIT ${limit}` : ''}
  `;
  return database.getAllAsync<Transaction>(sql);
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  const database = await getDatabase();
  return database.getAllAsync<Transaction>(
    `SELECT t.*, a.name as account_name 
     FROM transactions t 
     LEFT JOIN accounts a ON t.account_id = a.id 
     WHERE t.date BETWEEN ? AND ? 
     ORDER BY t.date DESC`,
    [startDate, endDate]
  );
}

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'account_name'>): Promise<number> {
  const database = await getDatabase();
  
  // 插入交易记录
  const result = await database.runAsync(
    'INSERT INTO transactions (type, amount, category, category_icon, account_id, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [transaction.type, transaction.amount, transaction.category, transaction.category_icon, transaction.account_id, transaction.date, transaction.description]
  );
  
  // 更新账户余额
  const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
  await database.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [balanceChange, transaction.account_id]);
  
  return result.lastInsertRowId;
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Transaction>(
    `SELECT t.*, a.name as account_name
     FROM transactions t
     LEFT JOIN accounts a ON t.account_id = a.id
     WHERE t.id = ?`,
    [id]
  );
}

export async function updateTransaction(
  id: number,
  updates: Partial<Omit<Transaction, 'id' | 'created_at' | 'account_name'>>
): Promise<void> {
  const database = await getDatabase();

  // 获取原始交易信息
  const oldTransaction = await database.getFirstAsync<Transaction>(
    'SELECT * FROM transactions WHERE id = ?',
    [id]
  );

  if (!oldTransaction) {
    throw new Error('交易记录不存在');
  }

  // 构建更新字段
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
  if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.category_icon !== undefined) { fields.push('category_icon = ?'); values.push(updates.category_icon); }
  if (updates.account_id !== undefined) { fields.push('account_id = ?'); values.push(updates.account_id); }
  if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }

  if (fields.length === 0) return;

  // 计算余额变化
  const newType = updates.type ?? oldTransaction.type;
  const newAmount = updates.amount ?? oldTransaction.amount;
  const newAccountId = updates.account_id ?? oldTransaction.account_id;

  // 还原旧账户余额
  const oldBalanceChange = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
  await database.runAsync(
    'UPDATE accounts SET balance = balance + ? WHERE id = ?',
    [oldBalanceChange, oldTransaction.account_id]
  );

  // 更新新账户余额
  const newBalanceChange = newType === 'income' ? newAmount : -newAmount;
  await database.runAsync(
    'UPDATE accounts SET balance = balance + ? WHERE id = ?',
    [newBalanceChange, newAccountId]
  );

  // 更新交易记录
  values.push(id);
  await database.runAsync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteTransaction(id: number): Promise<void> {
  const database = await getDatabase();

  // 先获取交易信息以还原余额
  const transaction = await database.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', [id]);
  if (transaction) {
    const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
    await database.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [balanceChange, transaction.account_id]);
  }

  await database.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getIncomeExpenseSummary(startDate?: string, endDate?: string): Promise<{ income: number; expense: number }> {
  const database = await getDatabase();
  let sql = 'SELECT type, COALESCE(SUM(amount), 0) as total FROM transactions';
  const params: string[] = [];
  
  if (startDate && endDate) {
    sql += ' WHERE date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  sql += ' GROUP BY type';
  
  const results = await database.getAllAsync<{ type: string; total: number }>(sql, params);
  const summary = { income: 0, expense: 0 };
  results.forEach(r => {
    if (r.type === 'income') summary.income = r.total;
    if (r.type === 'expense') summary.expense = r.total;
  });
  return summary;
}

export async function getCategorySummary(type: 'income' | 'expense', startDate?: string, endDate?: string) {
  const database = await getDatabase();
  let sql = 'SELECT category, category_icon, SUM(amount) as total FROM transactions WHERE type = ?';
  const params: any[] = [type];
  
  if (startDate && endDate) {
    sql += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  sql += ' GROUP BY category ORDER BY total DESC';
  
  return database.getAllAsync<{ category: string; category_icon: string; total: number }>(sql, params);
}

