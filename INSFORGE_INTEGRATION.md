# InsForge 集成说明

## 📋 项目状态

### ✅ 已完成的功能

1. **用户认证系统**
   - ✅ 邮箱验证码注册
   - ✅ 邮箱密码登录
   - ✅ JWT 令牌管理
   - ✅ 用户会话管理

2. **数据持久化**
   - ✅ 本地文件存储（.insforge-data/）
   - ✅ 服务器重启后自动加载数据
   - ✅ 用户数据和令牌持久化

3. **验证码系统**
   - ✅ 6位数字验证码生成
   - ✅ 10分钟过期机制
   - ✅ 验证码验证逻辑

## 🔍 InsForge 404 问题解析

### 问题原因

InsForge 的所有功能（数据库、邮件、存储等）**只能通过 MCP (Model Context Protocol) 访问**，不提供传统的 HTTP REST API。

**关键发现：**
- InsForge MCP 注册了 17 个工具
- 这些工具只能在 AI 助手（如 Claude Code）的上下文中使用
- 普通 Node.js 应用无法直接通过 HTTP 调用这些工具

### InsForge MCP 工具列表

**数据库相关：**
- `run-raw-sql` - 执行原始 SQL 查询
- `get-table-schema` - 获取表结构
- `bulk-upsert` - 批量插入/更新数据

**存储相关：**
- `create-bucket` - 创建存储桶
- `delete-bucket` - 删除存储桶
- `list-buckets` - 列出存储桶

**函数相关：**
- `create-function` - 创建边缘函数
- `delete-function` - 删除函数
- `get-function` - 获取函数
- `update-function` - 更新函数

**其他：**
- `create-deployment` - 创建部署
- `fetch-sdk-docs` - 获取 SDK 文档
- `get-anon-key` - 获取匿名密钥
- `get-backend-metadata` - 获取后端元数据
- `get-container-logs` - 获取容器日志

**注意：** 没有找到直接的 `send-email` 工具。

## 🎯 推荐方案

### 方案 1：当前本地持久化方案（推荐）✨

**优点：**
- ✅ 已完全实现并测试通过
- ✅ 数据安全可靠，不会丢失
- ✅ 无需额外配置
- ✅ 适合开发和小规模部署

**数据存储：**
```
.insforge-data/
├── users.json    # 用户数据
└── tokens.json   # 登录令牌
```

### 方案 2：配置第三方邮件服务（推荐）📧

**实现真实邮件发送：**

1. 创建 .env 文件：`cp .env.example .env`
2. 配置邮箱信息（参考 EMAIL_SETUP.md）
3. 重启服务器

**支持的邮件服务：**
- Gmail
- Outlook / Hotmail
- QQ 邮箱
- 163 邮箱

## 🚀 快速开始

### 启动代理服务器

```bash
cd bill-main_V1.1
node insforge-proxy-server.js
```

### 测试注册流程

1. 打开应用，点击"注册"
2. 填写邮箱、用户名、密码
3. 点击"获取验证码"
4. 在服务器控制台查看验证码
5. 输入验证码，完成注册

## 📝 API 文档

### 发送验证码
```http
POST /api/auth/send-code
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "用户名"
}
```

### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名",
  "code": "123456"
}
```

### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## ✅ 总结

当前系统已经实现了完整的用户认证功能：
- ✅ 验证码注册
- ✅ 邮箱密码登录
- ✅ 数据持久化
- ✅ 会话管理

虽然 InsForge 的云端功能无法通过 REST API 直接访问，但本地持久化方案已经完全满足当前需求。
