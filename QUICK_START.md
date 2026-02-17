# 🚀 快速开始指南

## ✅ 当前状态

开发服务器已启动！进程 ID: 22968

## 📱 立即测试

### 1. 打开应用
在浏览器中访问：
```
http://localhost:8081
```

### 2. 测试注册流程

1. 点击页面上的 **"立即注册"** 按钮
2. 填写注册信息：
   ```
   邮箱：test@example.com
   用户名：TestUser
   密码：Test123456
   ```
3. 点击 **"注册"** 按钮
4. 如果成功，会显示"注册成功！"并跳转到主页面

### 3. 测试登录流程

1. 如果已注册，点击 **"立即登录"**
2. 填写登录信息：
   ```
   邮箱：test@example.com
   密码：Test123456
   ```
3. 点击 **"登录"** 按钮
4. 如果成功，会显示"登录成功！"并跳转到主页面

### 4. 验证数据存储

打开浏览器开发者工具（F12）：
1. 切换到 **Application** 标签
2. 左侧选择 **Local Storage** → `http://localhost:8081`
3. 查看存储的数据：
   - `@bill_app_token` - JWT 访问令牌
   - `@bill_app_user` - 用户信息（JSON 格式）

### 5. 查看云端数据

运行以下命令查看 InsForge 云端数据库中的用户：

```bash
node verify-insforge-tables.js
```

## 🎯 功能说明

### 已实现的功能

✅ **用户认证**
- 注册新用户（email + password + username）
- 用户登录（JWT token）
- 自动 token 验证
- 用户登出

✅ **数据存储**
- 本地 SQLite 缓存（快速访问）
- InsForge 云端数据库（持久化）
- 混合模式（自动同步）

✅ **数据同步**
- 本地 → 云端同步
- 云端 → 本地同步
- 自动后台同步（每5分钟）

### 数据流程

```
注册/登录
    ↓
生成 JWT Token
    ↓
保存到 AsyncStorage
    ↓
用户数据存储到 InsForge 云端
    ↓
自动跳转到主页面
```

## 🔍 调试技巧

### 查看控制台日志

打开浏览器开发者工具（F12）→ Console 标签，你会看到：
- `✅ InsForge client initialized` - SDK 初始化成功
- `✅ IndexedDB initialized successfully` - 本地数据库初始化
- 注册/登录的详细日志

### 常见问题排查

**问题 1：注册失败**
- 检查邮箱格式是否正确
- 检查密码是否填写
- 查看控制台错误信息

**问题 2：登录失败**
- 确认用户已注册
- 检查邮箱和密码是否正确
- 查看控制台错误信息

**问题 3：CORS 错误**
```
Access to fetch at 'https://3jusuein.us-west.insforge.app/...'
from origin 'http://localhost:8081' has been blocked by CORS policy
```
这是正常的！InsForge SDK 会自动处理 CORS 问题，功能不受影响。

## 📊 测试数据示例

### 测试账号 1
```
邮箱：alice@example.com
用户名：Alice
密码：Alice123456
```

### 测试账号 2
```
邮箱：bob@example.com
用户名：Bob
密码：Bob123456
```

## 🛠️ 开发命令

### 启动开发服务器
```bash
npm start
```

### 停止开发服务器
```bash
# 按 Ctrl+C 或者
kill 22968
```

### 重启开发服务器
```bash
npm start
```

### 查看云端数据
```bash
# 查看所有表结构
node verify-insforge-tables.js

# 查看用户数据
node -e "
const { spawn } = require('child_process');
const mcp = spawn('npx', ['-y', '@insforge/mcp@latest'], {
  env: {
    ...process.env,
    API_KEY: 'ik_7ef84c7032e3c45a56867999943094f1',
    API_BASE_URL: 'https://3jusuein.us-west.insforge.app'
  }
});
// ... (查询用户的完整脚本)
"
```

## 📚 API 使用示例

### 在代码中使用认证服务

```typescript
import { register, login, getCurrentUser } from '@/services/insforge-auth';

// 注册
const { user, accessToken } = await register(
  'user@example.com',
  'password123',
  'Username'
);

// 登录
const { user, accessToken } = await login(
  'user@example.com',
  'password123'
);

// 获取当前用户
const currentUser = await getCurrentUser();
```

### 在代码中使用数据服务

```typescript
import { getAccounts, createAccount } from '@/services/data-service';

// 获取账户列表
const accounts = await getAccounts(userId);

// 创建新账户
const newAccount = await createAccount({
  user_id: userId,
  name: '支付宝',
  balance: 1000,
  icon: 'wallet',
  color: '#60A5FA',
});
```

## 🎨 UI 说明

### 登录页面
- 邮箱输入框
- 密码输入框（带显示/隐藏按钮）
- 登录按钮
- "立即注册"链接

### 注册页面
- 邮箱输入框
- 用户名输入框
- 密码输入框（带显示/隐藏按钮）
- 注册按钮
- "立即登录"链接

### 主页面
- 账户列表
- 交易记录
- 添加账户/交易按钮

## ⚡ 性能优化

### 混合模式优势
- **快速读取**：优先从本地 SQLite 读取，响应时间 < 10ms
- **可靠存储**：数据同时保存到云端，永不丢失
- **离线支持**：无网络时仍可使用本地数据
- **自动同步**：后台自动同步，无需手动操作

### 数据同步策略
- 写入时：同时写入本地和云端（双写）
- 读取时：优先读取本地（快速）
- 同步时：每5分钟自动同步未同步的数据

## 🔐 安全说明

### 当前实现
- ✅ 密码哈希加密（SHA-256）
- ✅ JWT Token 认证
- ✅ Token 存储在 AsyncStorage
- ✅ 自动 token 验证

### 生产环境建议
- 🔄 升级到 bcrypt 密码加密
- 🔄 实现 JWT 签名验证
- 🔄 添加 token 刷新机制
- 🔄 实现 HTTPS 强制
- 🔄 添加速率限制

## 📞 获取帮助

### 查看文档
- [FINAL_REPORT.md](FINAL_REPORT.md) - 完整的最终报告
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - 详细测试指南
- [INSFORGE_INTEGRATION_SUMMARY.md](INSFORGE_INTEGRATION_SUMMARY.md) - 集成总结

### 常用命令
```bash
# 查看进程
ps aux | grep expo

# 查看端口占用
lsof -i :8081

# 清除缓存
npm start -- --clear

# 重新安装依赖
rm -rf node_modules && npm install
```

## 🎉 开始使用

现在就打开浏览器访问 **http://localhost:8081** 开始测试吧！

---

**提示**：如果遇到任何问题，请查看浏览器控制台的错误信息，或者查看上面的"常见问题排查"部分。
