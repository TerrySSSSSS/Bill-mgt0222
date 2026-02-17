// Web 平台使用 IndexedDB 实现数据库功能
import { Account, Transaction } from './schema';

const DB_NAME = 'billing_db';
const DB_VERSION = 1;
const ACCOUNTS_STORE = 'accounts';
const TRANSACTIONS_STORE = 'transactions';

let db: IDBDatabase | null = null;

// 初始化 IndexedDB
export async function initDatabase(): Promise<any> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB initialized successfully for web platform');
      resolve(db);
    };

    request.onupgradeneeded = (event: any) => {
      const database = event.target.result;

      // 创建账户表
      if (!database.objectStoreNames.contains(ACCOUNTS_STORE)) {
        const accountStore = database.createObjectStore(ACCOUNTS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        accountStore.createIndex('name', 'name', { unique: false });
        accountStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // 创建交易表
      if (!database.objectStoreNames.contains(TRANSACTIONS_STORE)) {
        const transactionStore = database.createObjectStore(TRANSACTIONS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        transactionStore.createIndex('account_id', 'account_id', { unique: false });
        transactionStore.createIndex('date', 'date', { unique: false });
        transactionStore.createIndex('type', 'type', { unique: false });
        transactionStore.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
}

export async function getDatabase(): Promise<any> {
  if (!db) {
    return initDatabase();
  }
  return db;
}

// ============ 账户操作 ============

export async function getAllAccounts(): Promise<Account[]> {
  const database = await getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([ACCOUNTS_STORE], 'readonly');
    const store = transaction.objectStore(ACCOUNTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const accounts = request.result.sort((a: Account, b: Account) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      resolve(accounts);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAccountById(id: number): Promise<Account | null> {
  const database = await getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([ACCOUNTS_STORE], 'readonly');
    const store = transaction.objectStore(ACCOUNTS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function createAccount(account: Omit<Account, 'id' | 'created_at'>): Promise<number> {
  const database = await getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([ACCOUNTS_STORE], 'readwrite');
    const store = transaction.objectStore(ACCOUNTS_STORE);
    const newAccount = {
      ...account,
      created_at: new Date().toISOString(),
    };
    const request = store.add(newAccount);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function updateAccount(id: number, account: Partial<Account>): Promise<void> {
  const database = await getDatabase();
  return new Promise(async (resolve, reject) => {
    const existing = await getAccountById(id);
    if (!existing) {
      reject(new Error('Account not found'));
      return;
    }

    const transaction = database.transaction([ACCOUNTS_STORE], 'readwrite');
    const store = transaction.objectStore(ACCOUNTS_STORE);
    const updated = { ...existing, ...account, id };
    const request = store.put(updated);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAccount(id: number): Promise<void> {
  const database = await getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([ACCOUNTS_STORE], 'readwrite');
    const store = transaction.objectStore(ACCOUNTS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getTotalBalance(): Promise<number> {
  const accounts = await getAllAccounts();
  return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
}

// ============ 交易操作 ============

export async function getAllTransactions(limit?: number): Promise<Transaction[]> {
  const database = await getDatabase();
  return new Promise(async (resolve, reject) => {
    const transaction = database.transaction([TRANSACTIONS_STORE, ACCOUNTS_STORE], 'readonly');
    const transactionStore = transaction.objectStore(TRANSACTIONS_STORE);
    const accountStore = transaction.objectStore(ACCOUNTS_STORE);
    const request = transactionStore.getAll();

    request.onsuccess = async () => {
      let transactions = request.result;

      // 添加账户名称
      const transactionsWithAccountName = await Promise.all(
        transactions.map(async (t: Transaction) => {
          const accountRequest = accountStore.get(t.account_id);
          return new Promise<Transaction>((res) => {
            accountRequest.onsuccess = () => {
              res({
                ...t,
                account_name: accountRequest.result?.name || '',
              });
            };
            accountRequest.onerror = () => res({ ...t, account_name: '' });
          });
        })
      );

      // 排序
      transactionsWithAccountName.sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      resolve(limit ? transactionsWithAccountName.slice(0, limit) : transactionsWithAccountName);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  const allTransactions = await getAllTransactions();
  return allTransactions.filter(t => t.date >= startDate && t.date <= endDate);
}

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'account_name'>): Promise<number> {
  const database = await getDatabase();
  return new Promise(async (resolve, reject) => {
    try {
      // 插入交易记录
      const trans = database.transaction([TRANSACTIONS_STORE, ACCOUNTS_STORE], 'readwrite');
      const transactionStore = trans.objectStore(TRANSACTIONS_STORE);
      const accountStore = trans.objectStore(ACCOUNTS_STORE);

      const newTransaction = {
        ...transaction,
        created_at: new Date().toISOString(),
      };

      const addRequest = transactionStore.add(newTransaction);

      addRequest.onsuccess = async () => {
        const transactionId = addRequest.result as number;

        // 更新账户余额
        const account = await getAccountById(transaction.account_id);
        if (account) {
          const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
          await updateAccount(account.id, { balance: account.balance + balanceChange });
        }

        resolve(transactionId);
      };

      addRequest.onerror = () => reject(addRequest.error);
    } catch (error) {
      reject(error);
    }
  });
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  const database = await getDatabase();
  return new Promise(async (resolve, reject) => {
    const transaction = database.transaction([TRANSACTIONS_STORE, ACCOUNTS_STORE], 'readonly');
    const transactionStore = transaction.objectStore(TRANSACTIONS_STORE);
    const accountStore = transaction.objectStore(ACCOUNTS_STORE);
    const request = transactionStore.get(id);

    request.onsuccess = async () => {
      const trans = request.result;
      if (!trans) {
        resolve(null);
        return;
      }

      const accountRequest = accountStore.get(trans.account_id);
      accountRequest.onsuccess = () => {
        resolve({
          ...trans,
          account_name: accountRequest.result?.name || '',
        });
      };
      accountRequest.onerror = () => resolve({ ...trans, account_name: '' });
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateTransaction(
  id: number,
  updates: Partial<Omit<Transaction, 'id' | 'created_at' | 'account_name'>>
): Promise<void> {
  const database = await getDatabase();

  // 获取原始交易信息
  const oldTransaction = await getTransactionById(id);
  if (!oldTransaction) {
    throw new Error('交易记录不存在');
  }

  // 还原旧账户余额
  const oldAccount = await getAccountById(oldTransaction.account_id);
  if (oldAccount) {
    const oldBalanceChange = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
    await updateAccount(oldAccount.id, { balance: oldAccount.balance + oldBalanceChange });
  }

  // 更新交易记录
  const newType = updates.type ?? oldTransaction.type;
  const newAmount = updates.amount ?? oldTransaction.amount;
  const newAccountId = updates.account_id ?? oldTransaction.account_id;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRANSACTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(TRANSACTIONS_STORE);
    const updated = { ...oldTransaction, ...updates, id };
    delete (updated as any).account_name;
    const request = store.put(updated);

    request.onsuccess = async () => {
      // 更新新账户余额
      const newAccount = await getAccountById(newAccountId);
      if (newAccount) {
        const newBalanceChange = newType === 'income' ? newAmount : -newAmount;
        await updateAccount(newAccount.id, { balance: newAccount.balance + newBalanceChange });
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTransaction(id: number): Promise<void> {
  const database = await getDatabase();

  // 先获取交易信息以还原余额
  const transaction = await getTransactionById(id);
  if (transaction) {
    const account = await getAccountById(transaction.account_id);
    if (account) {
      const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      await updateAccount(account.id, { balance: account.balance + balanceChange });
    }
  }

  return new Promise((resolve, reject) => {
    const trans = database.transaction([TRANSACTIONS_STORE], 'readwrite');
    const store = trans.objectStore(TRANSACTIONS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getIncomeExpenseSummary(startDate?: string, endDate?: string): Promise<{ income: number; expense: number }> {
  let transactions = await getAllTransactions();

  if (startDate && endDate) {
    transactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
  }

  const summary = { income: 0, expense: 0 };
  transactions.forEach(t => {
    if (t.type === 'income') summary.income += t.amount;
    if (t.type === 'expense') summary.expense += t.amount;
  });

  return summary;
}

export async function getCategorySummary(type: 'income' | 'expense', startDate?: string, endDate?: string) {
  let transactions = await getAllTransactions();

  if (startDate && endDate) {
    transactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
  }

  transactions = transactions.filter(t => t.type === type);

  const categoryMap = new Map<string, { category: string; category_icon: string; total: number }>();

  transactions.forEach(t => {
    const existing = categoryMap.get(t.category);
    if (existing) {
      existing.total += t.amount;
    } else {
      categoryMap.set(t.category, {
        category: t.category,
        category_icon: t.category_icon,
        total: t.amount,
      });
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
}
