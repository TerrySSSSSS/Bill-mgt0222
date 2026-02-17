# InsForge 集成测试指南

## 🎯 当前状态

### ✅ 已完成
1. **InsForge SDK 客户端配置** - `services/insforge-client.ts`
2. **用户认证服务** - `services/insforge-auth.ts`
3. **数据访问抽象层** - `services/data-service.ts`
4. **交易数据服务** - `services/transaction-service.ts`
5. **数据同步服务** - `services/sync-service.ts`
6. **Auth Store 更新** - 使用新的 InsForge 认证服务
7. **Auth UI 简化** - 移除验证码功能（暂时）

### 📊 云端数据库
- ✅ users 表（用户认证）
- ✅ accounts 表（账户管理）
- ✅ transactions 表（交易记录）

## 🧪 测试步骤

### 1. 启动开发服务器

```bash
npm start
```

### 2. 测试用户注册

1. 打开应用（http://localhost:8081）
2. 点击"立即注册"
3. 填写信息：
   - 邮箱：test@example.com
   - 用户名：TestUser
   - 密码：Test123456
4. 点击"注册"按钮

**预期结果：**
- ✅ 注册成功提示
- ✅ 自动跳转到主页面
- ✅ 用户数据保存到 InsForge 云端

### 3. 测试用户登录

1. 登出（如果已登录）
2. 填写信息：
   - 邮箱：test@example.com
   - 密码：Test123456
3. 点击"登录"按钮

**预期结果：**
- ✅ 登录成功提示
- ✅ 自动跳转到主页面
- ✅ Token 保存到 AsyncStorage

### 4. 验证数据持久化

打开浏览器开发者工具 → Application → Local Storage，查看：
- `@bill_app_token` - JWT token
- `@bill_app_user` - 用户信息

## 🔍 调试信息

### 查看 InsForge 云端数据

使用 MCP 工具查询用户表：

```bash
node -e "
const { spawn } = require('child_process');
const mcp = spawn('npx', ['-y', '@insforge/mcp@latest'], {
  env: {
    ...process.env,
    API_KEY: 'ik_7ef84c7032e3c45a56867999943094f1',
    API_BASE_URL: 'https://3jusuein.us-west.insforge.app'
  }
});

let messageId = 1;

mcp.stdout.on('data', (data) => {
  console.log(data.toString());
});

setTimeout(() => {
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' }
    }
  }) + '\n');
}, 500);

setTimeout(() => {
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  }) + '\n');
}, 1000);

setTimeout(() => {
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/call',
    params: {
      name: 'run-raw-sql',
      arguments: {
        query: 'SELECT id, email, username, created_at FROM users ORDER BY created_at DESC LIMIT 5'
      }
    }
  }) + '\n');
}, 1500);

setTimeout(() => {
  mcp.kill();
  process.exit(0);
}, 5000);
"
```

### 常见问题

#### 1. 注册失败："注册失败"

**可能原因：**
- InsForge 连接失败
- 邮箱已存在
- 密码哈希失败

**解决方法：**
- 检查网络连接
- 使用不同的邮箱
- 查看浏览器控制台错误信息

#### 2. 登录失败："邮箱或密码错误"

**可能原因：**
- 用户不存在
- 密码错误
- 数据库查询失败

**解决方法：**
- 确认邮箱和密码正确
- 先注册再登录
- 查看浏览器控制台错误信息

#### 3. CORS 错误

**错误信息：**
```
Access to fetch at 'https://3jusuein.us-west.insforge.app/...'
from origin 'http://localhost:8081' has been blocked by CORS policy
```

**解决方法：**
这是正常的！InsForge SDK 会自动处理 CORS 问题。如果看到这个错误但功能正常，可以忽略。

## 📝 下一步计划

### 必须完成：
1. **测试账户 CRUD**
   - 创建账户
   - 查看账户列表
   - 更新账户余额
   - 删除账户

2. **测试交易 CRUD**
   - 创建交易
   - 查看交易列表
   - 更新交易
   - 删除交易

3. **测试数据同步**
   - 本地 → 云端同步
   - 云端 → 本地同步
   - 自动同步

### 可选优化：
4. **邮件验证**
   - 集成第三方邮件服务
   - 实现验证码发送

5. **密码安全**
   - 使用真正的 bcrypt
   - 实现密码强度检查

6. **Token 管理**
   - 实现 JWT 签名验证
   - 添加 token 刷新机制

## 🔧 技术架构

```
┌─────────────────────────────────────────┐
│         React Native App                │
│         (Web Platform)                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Auth Store (Zustand)               │
│      - register()                       │
│      - login()                          │
│      - logout()                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   services/insforge-auth.ts             │
│   - register(email, password, username) │
│   - login(email, password)              │
│   - getCurrentUser()                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   services/insforge-client.ts           │
│   - InsForge SDK Client                 │
│   - Base URL + Anon Key                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   InsForge Cloud Database               │
│   - users 表                            │
│   - accounts 表                         │
│   - transactions 表                     │
└─────────────────────────────────────────┘
```

## 📚 API 文档

### 注册 API

```typescript
import { register } from '@/services/insforge-auth';

const result = await register(
  'user@example.com',  // email
  'password123',       // password
  'Username'           // username (optional)
);

// 返回：
// {
//   user: { id, email, username, email_verified, created_at },
//   accessToken: 'eyJhbGc...'
// }
```

### 登录 API

```typescript
import { login } from '@/services/insforge-auth';

const result = await login(
  'user@example.com',  // email
  'password123'        // password
);

// 返回：
// {
//   user: { id, email, username, email_verified, created_at },
//   accessToken: 'eyJhbGc...'
// }
```

### 获取当前用户

```typescript
import { getCurrentUser } from '@/services/insforge-auth';

const user = await getCurrentUser();

// 返回：
// { id, email, username, email_verified, created_at }
// 或 null（未登录）
```

## 🎨 UI 变更

### 登录/注册页面

**移除的功能：**
- ❌ 验证码输入框
- ❌ "获取验证码"按钮
- ❌ 验证码发送逻辑

**保留的功能：**
- ✅ 邮箱输入
- ✅ 密码输入（带显示/隐藏）
- ✅ 用户名输入（仅注册）
- ✅ 登录/注册切换
- ✅ 错误提示

## 🚀 快速开始

1. **确保依赖已安装：**
```bash
npm install
```

2. **启动开发服务器：**
```bash
npm start
```

3. **打开浏览器：**
```
http://localhost:8081
```

4. **测试注册：**
- 点击"立即注册"
- 填写邮箱、用户名、密码
- 点击"注册"

5. **测试登录：**
- 使用刚注册的账号登录

## ✅ 验收标准

- [ ] 用户可以成功注册
- [ ] 用户可以成功登录
- [ ] Token 正确保存到 AsyncStorage
- [ ] 用户信息正确保存到 InsForge 云端
- [ ] 登录后可以访问主页面
- [ ] 登出功能正常
- [ ] 错误提示清晰明确

## 📞 支持

如果遇到问题，请检查：
1. 浏览器控制台错误信息
2. Network 标签查看 API 请求
3. Application → Local Storage 查看存储数据
4. InsForge 云端数据库（使用 MCP 工具查询）
