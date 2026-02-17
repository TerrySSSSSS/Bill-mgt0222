// 使用 InsForge MCP 在云端创建数据库表
const { spawn } = require('child_process');

const API_KEY = 'ik_7ef84c7032e3c45a56867999943094f1';
const API_BASE_URL = 'https://3jusuein.us-west.insforge.app';

// SQL 语句
const SQL_STATEMENTS = [
  {
    name: 'users 表',
    sql: `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `.trim()
  },
  {
    name: 'accounts 表',
    sql: `
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

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    `.trim()
  },
  {
    name: 'transactions 表',
    sql: `
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

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    `.trim()
  }
];

// 启动 MCP 服务器
const mcp = spawn('npx', ['-y', '@insforge/mcp@latest'], {
  env: {
    ...process.env,
    API_KEY: API_KEY,
    API_BASE_URL: API_BASE_URL
  }
});

let messageId = 1;
let currentStep = 0;

mcp.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());

  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      console.log('\n📥 Response:', JSON.stringify(response, null, 2));

      // 处理初始化响应
      if (response.id === 1 && response.result) {
        console.log('\n✅ MCP 服务器初始化成功');
        // 发送 initialized 通知
        setTimeout(() => {
          const initializedNotification = {
            jsonrpc: '2.0',
            method: 'notifications/initialized'
          };
          mcp.stdin.write(JSON.stringify(initializedNotification) + '\n');
          console.log('\n📤 发送 initialized 通知');

          // 开始创建第一个表
          setTimeout(() => createNextTable(), 500);
        }, 500);
      }

      // 处理 SQL 执行结果
      if (response.id > 1 && response.result) {
        console.log(`\n✅ ${SQL_STATEMENTS[currentStep - 1].name} 创建成功！`);

        // 创建下一个表
        if (currentStep < SQL_STATEMENTS.length) {
          setTimeout(() => createNextTable(), 500);
        } else {
          console.log('\n🎉 所有数据库表创建完成！');
          setTimeout(() => {
            mcp.kill();
            process.exit(0);
          }, 1000);
        }
      }

      // 处理错误
      if (response.error) {
        console.error(`\n❌ 错误:`, response.error);
        mcp.kill();
        process.exit(1);
      }
    } catch (e) {
      // 忽略非 JSON 行
    }
  });
});

mcp.stderr.on('data', (data) => {
  console.log('ℹ️ ', data.toString().trim());
});

mcp.on('close', (code) => {
  console.log(`\n🔚 MCP 服务器已关闭 (code: ${code})`);
});

function createNextTable() {
  if (currentStep >= SQL_STATEMENTS.length) {
    return;
  }

  const statement = SQL_STATEMENTS[currentStep];
  console.log(`\n📤 正在创建 ${statement.name}...`);

  const callToolMessage = {
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/call',
    params: {
      name: 'run-raw-sql',
      arguments: {
        query: statement.sql
      }
    }
  };

  mcp.stdin.write(JSON.stringify(callToolMessage) + '\n');
  currentStep++;
}

// 初始化 MCP 服务器
setTimeout(() => {
  const initMessage = {
    jsonrpc: '2.0',
    id: messageId++,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'insforge-migration', version: '1.0.0' }
    }
  };
  console.log('📤 初始化 MCP 服务器...');
  mcp.stdin.write(JSON.stringify(initMessage) + '\n');
}, 500);

// 超时保护
setTimeout(() => {
  console.error('\n⏱️  超时：操作未在 30 秒内完成');
  mcp.kill();
  process.exit(1);
}, 30000);
