# InsForge 数据库迁移指南

## 📋 迁移步骤

根据教案要求，需要将当前的 SQLite 数据库迁移到 InsForge 云端。

### 方式 1：通过 AI 助手使用 MCP 工具（推荐）

向 AI 助手（Claude Code）发送以下指令：

```
请使用 InsForge MCP 的 run-raw-sql 工具，在 InsForge 云端创建以下数据库表：

1. users 表（用户认证）
2. accounts 表（账户管理）
3. transactions 表（交易记录）

使用以下 SQL 语句创建表...
```

### 方式 2：手动执行 SQL（备用方案）

如果 MCP 工具不可用，可以使用以下 SQL 语句手动创建表。

## 📝 数据库表结构

### 1. Users 表（用户认证）

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### 2. Accounts 表（账户管理）

```sql
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  balance REAL DEFAULT 0,
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT '#60A5FA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
```

### 3. Transactions 表（交易记录）

```sql
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  category_icon TEXT DEFAULT 'circle',
  date TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  invoice_image_url TEXT,
  voice_note_url TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
```

## 🔄 数据同步策略

### 本地缓存 + 云端同步

```
┌─────────────────┐
│  React Native   │
│      App        │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────┐   ┌──────────────┐
│   SQLite    │   │   InsForge   │
│  (本地缓存)  │◄─►│   (云端)     │
└─────────────┘   └──────────────┘
```

### 同步逻辑

1. **读取数据**：优先从本地 SQLite 读取（快速）
2. **写入数据**：同时写入本地和云端
3. **后台同步**：定期将本地未同步的数据上传到云端
4. **冲突解决**：使用 `updated_at` 时间戳，保留最新的数据

## 📦 迁移后的 API 结构

### 认证 API

```typescript
// 用户注册
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名",
  "code": "123456"
}

// 用户登录
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 账户 API

```typescript
// 获取所有账户
GET /api/accounts
Authorization: Bearer {token}

// 创建账户
POST /api/accounts
Authorization: Bearer {token}
{
  "name": "支付宝",
  "balance": 1000,
  "icon": "wallet",
  "color": "#60A5FA"
}

// 更新账户
PUT /api/accounts/:id
Authorization: Bearer {token}
{
  "balance": 1500
}

// 删除账户
DELETE /api/accounts/:id
Authorization: Bearer {token}
```

### 交易 API

```typescript
// 获取所有交易
GET /api/transactions?limit=50
Authorization: Bearer {token}

// 创建交易
POST /api/transactions
Authorization: Bearer {token}
{
  "type": "expense",
  "amount": 50,
  "category": "餐饮",
  "category_icon": "utensils",
  "account_id": "account_123",
  "date": "2026-02-13",
  "description": "午餐"
}

// 更新交易
PUT /api/transactions/:id
Authorization: Bearer {token}
{
  "amount": 60,
  "description": "午餐（更新）"
}

// 删除交易
DELETE /api/transactions/:id
Authorization: Bearer {token}
```

## 🚀 下一步

1. **创建数据库表**：使用上面的 SQL 语句在 InsForge 创建表
2. **实现 API 端点**：在 `insforge-proxy-server.js` 中添加账户和交易的 CRUD 操作
3. **修改前端代码**：将 SQLite 调用改为 API 调用
4. **实现数据同步**：添加后台同步逻辑

## 📚 相关文件

- `db/sqlite/schema.ts` - 本地数据库 schema
- `insforge-proxy-server.js` - 代理服务器
- `services/insforge.ts` - InsForge API 客户端
- `services/sync.ts` - 数据同步服务

## ⚠️ 注意事项

1. **ID 类型变更**：从 INTEGER 改为 TEXT（UUID）
2. **密码加密**：使用 bcrypt 加密密码
3. **时间戳格式**：统一使用 ISO 8601 格式
4. **外键约束**：确保数据完整性
5. **索引优化**：为常用查询字段创建索引
