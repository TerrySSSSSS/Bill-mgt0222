# 📚 文档索引 - InsForge 集成项目

## 🎯 快速导航

### 🚀 立即开始
- **[README_COMPLETION.md](README_COMPLETION.md)** ⭐ **推荐首先阅读** - 工作完成总结
- **[QUICK_START.md](QUICK_START.md)** ⭐ **快速开始指南** - 如何测试应用

### 📖 技术文档
- **[FINAL_REPORT.md](FINAL_REPORT.md)** - 完整的技术实现报告
- **[INSFORGE_INTEGRATION_SUMMARY.md](INSFORGE_INTEGRATION_SUMMARY.md)** - InsForge 集成详细说明
- **[COMPLETION_REPORT.md](COMPLETION_REPORT.md)** - MVP 完成报告

### 🧪 测试相关
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - 详细的测试指南
- **[LOGIN_GUIDE.md](LOGIN_GUIDE.md)** - 登录功能说明

### 🔧 配置和部署
- **[migrate-to-insforge.md](migrate-to-insforge.md)** - 数据库迁移指南
- **[INSFORGE_DEPLOYMENT.md](INSFORGE_DEPLOYMENT.md)** - 部署说明
- **[INSFORGE_CONNECTION_TEST.md](INSFORGE_CONNECTION_TEST.md)** - 连接测试

### 📧 其他
- **[EMAIL_SETUP.md](EMAIL_SETUP.md)** - 邮件服务配置（可选）
- **[INSFORGE_INTEGRATION.md](INSFORGE_INTEGRATION.md)** - 集成过程记录

---

## 🎉 当前状态

### ✅ 已完成
- [x] 云端数据库创建（users, accounts, transactions）
- [x] 5个核心服务文件实现
- [x] 前端认证集成
- [x] SQLite API 升级
- [x] 开发服务器运行中

### 🚀 可以立即使用
应用地址：**http://localhost:8081**

---

## 📊 核心功能

### 用户认证
```typescript
// 注册
await register('user@example.com', 'password123', 'Username');

// 登录
await login('user@example.com', 'password123');
```

### 数据管理
```typescript
// 创建账户
await createAccount({
  user_id: userId,
  name: '支付宝',
  balance: 1000,
});

// 创建交易
await createTransaction({
  user_id: userId,
  account_id: accountId,
  type: 'expense',
  amount: 50,
  category: '餐饮',
  date: '2026-02-15',
});
```

### 数据同步
```typescript
// 完整同步
await fullSync(userId);

// 自动同步（每5分钟）
startAutoSync(userId);
```

---

## 🏗️ 项目结构

```
services/
├── insforge-client.ts      # InsForge SDK 客户端
├── insforge-auth.ts         # 用户认证服务
├── data-service.ts          # 账户数据服务
├── transaction-service.ts   # 交易数据服务
└── sync-service.ts          # 数据同步服务

store/
└── auth.ts                  # 认证状态管理

app/
└── auth.tsx                 # 登录/注册页面

db/sqlite/
├── database.ts              # SQLite 数据库
└── schema.ts                # 数据库表结构
```

---

## 🔍 快速查找

### 我想...

**测试应用**
→ 阅读 [QUICK_START.md](QUICK_START.md)

**了解技术实现**
→ 阅读 [FINAL_REPORT.md](FINAL_REPORT.md)

**查看 API 使用方法**
→ 阅读 [INSFORGE_INTEGRATION_SUMMARY.md](INSFORGE_INTEGRATION_SUMMARY.md)

**配置邮件服务**
→ 阅读 [EMAIL_SETUP.md](EMAIL_SETUP.md)

**部署到生产环境**
→ 阅读 [INSFORGE_DEPLOYMENT.md](INSFORGE_DEPLOYMENT.md)

**排查问题**
→ 阅读 [TESTING_GUIDE.md](TESTING_GUIDE.md) 的"常见问题"部分

---

## 💡 重要提示

### 验证码功能
当前版本已移除验证码功能（InsForge 不提供内置邮件服务）。如需邮件验证，请参考 [EMAIL_SETUP.md](EMAIL_SETUP.md) 集成第三方邮件服务。

### 密码安全
当前使用 SHA-256 加密。生产环境建议升级到 bcrypt。

### 数据同步
默认使用混合模式（hybrid）：
- 读取：优先本地 SQLite
- 写入：同时写入本地和云端
- 同步：自动后台同步（每5分钟）

---

## 🛠️ 常用命令

```bash
# 启动开发服务器
npm start

# 查看云端数据
node verify-insforge-tables.js

# 清除缓存
npm start -- --clear

# 重新安装依赖
rm -rf node_modules && npm install
```

---

## 📞 获取帮助

### 查看日志
浏览器开发者工具（F12）→ Console

### 查看存储数据
浏览器开发者工具（F12）→ Application → Local Storage

### 查看云端数据
```bash
node verify-insforge-tables.js
```

---

## ✨ 下一步

1. **立即测试** - 打开 http://localhost:8081
2. **注册账号** - 使用测试邮箱注册
3. **测试功能** - 创建账户和交易
4. **查看数据** - 验证本地和云端数据

---

**最后更新**: 2026-02-15
**状态**: ✅ 完成并可用
**开发服务器**: 运行中
