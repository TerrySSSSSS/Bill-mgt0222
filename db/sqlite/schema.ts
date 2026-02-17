// 数据库表结构定义

export interface Account {
  id: number;
  name: string;
  balance: number;
  icon: string;
  color: string;
  created_at: string;
  user_id?: string; // 关联用户 ID
  synced?: boolean; // 是否已同步到云端
  last_sync?: string; // 最后同步时间
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  category_icon: string;
  account_id: number;
  account_name?: string;
  date: string;
  description: string;
  created_at: string;
  user_id?: string; // 关联用户 ID
  synced?: boolean; // 是否已同步到云端
  last_sync?: string; // 最后同步时间
  invoice_image_url?: string; // 发票图片 URL
  voice_note_url?: string; // 语音备注 URL
}

// 创建表的SQL语句
export const CREATE_ACCOUNTS_TABLE = `
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    balance REAL DEFAULT 0,
    icon TEXT DEFAULT 'wallet',
    color TEXT DEFAULT '#60A5FA',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    synced INTEGER DEFAULT 0,
    last_sync TEXT
  );
`;

export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    category_icon TEXT DEFAULT 'circle',
    account_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    synced INTEGER DEFAULT 0,
    last_sync TEXT,
    invoice_image_url TEXT,
    voice_note_url TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  );
`;

// 预定义类别
export const EXPENSE_CATEGORIES = [
  { name: '餐饮', icon: 'utensils', color: '#F472B6' },
  { name: '交通', icon: 'car', color: '#60A5FA' },
  { name: '购物', icon: 'shopping-bag', color: '#FBBF24' },
  { name: '居家', icon: 'home', color: '#34D399' },
  { name: '娱乐', icon: 'gamepad-2', color: '#A78BFA' },
  { name: '医疗', icon: 'heart-pulse', color: '#F87171' },
  { name: '教育', icon: 'graduation-cap', color: '#38BDF8' },
  { name: '水电', icon: 'zap', color: '#FB923C' },
  { name: '通讯', icon: 'phone', color: '#4ADE80' },
  { name: '其他', icon: 'more-horizontal', color: '#9CA3AF' },
];

export const INCOME_CATEGORIES = [
  { name: '工资', icon: 'briefcase', color: '#4CAF50' },
  { name: '奖金', icon: 'gift', color: '#FBBF24' },
  { name: '投资', icon: 'trending-up', color: '#60A5FA' },
  { name: '兼职', icon: 'laptop', color: '#A78BFA' },
  { name: '红包', icon: 'wallet', color: '#F472B6' },
  { name: '其他', icon: 'more-horizontal', color: '#9CA3AF' },
];

// 账户图标选项
export const ACCOUNT_ICONS = [
  { name: 'wallet', label: '钱包' },
  { name: 'credit-card', label: '银行卡' },
  { name: 'banknote', label: '现金' },
  { name: 'landmark', label: '银行' },
  { name: 'smartphone', label: '支付宝/微信' },
  { name: 'piggy-bank', label: '储蓄' },
];

