# 登录功能使用指南

## 功能概述

账单管家现在支持完整的用户认证系统，包括：
- ✅ 用户注册（邮箱 + 密码）
- ✅ 用户登录
- ✅ JWT 令牌管理
- ✅ 注册确认邮件
- ✅ 密码可见性切换
- ✅ 离线模式支持

## 如何访问登录页面

### 方法 1: 直接访问
在浏览器中打开：
```
http://localhost:8081/auth
```

### 方法 2: 从应用内跳转
如果用户未登录，应用会自动引导到登录页面。

## 注册新用户

1. 在登录页面点击 "Sign Up Now"
2. 填写信息：
   - **Username**: 用户名（必填）
   - **Email**: 邮箱地址（必填）
   - **Password**: 密码（必填）
3. 点击 "Sign Up" 按钮
4. 注册成功后：
   - 自动登录
   - 跳转到主页面
   - **InsForge 服务器会发送欢迎邮件**（在服务器控制台查看）

## 登录

1. 在登录页面填写：
   - **Email**: 注册时使用的邮箱
   - **Password**: 密码
2. 点击眼睛图标可以显示/隐藏密码
3. 点击 "Sign In" 按钮
4. 登录成功后自动跳转到主页面

## 查看注册邮件

由于这是本地开发环境，邮件不会真的发送到你的邮箱，而是显示在 **InsForge 服务器的控制台**中。

### 查看方法：

1. 打开运行 `node insforge-mock-server.js` 的终端窗口
2. 当用户注册时，你会看到类似这样的输出：

```
📧 ========== 发送欢迎邮件 ==========
收件人: user@example.com
用户名: testuser
主题: 欢迎加入账单管家！

邮件内容:
─────────────────────────────────
亲爱的 testuser，

欢迎加入账单管家！🎉

您的账户已成功创建。现在您可以：
  ✓ 记录日常收支
  ✓ 使用 AI 识别发票
  ✓ 语音记账
  ✓ 查看财务报表
  ✓ 数据云端同步

账户信息:
  邮箱: user@example.com
  用户 ID: user_1234567890
  注册时间: 2026-02-11 22:30:00

如有任何问题，请随时联系我们。

祝您使用愉快！
账单管家团队
─────────────────────────────────
✅ 邮件已发送
```

## JWT 令牌管理

### 令牌存储
- 登录成功后，JWT 令牌自动保存在 AsyncStorage 中
- 应用重启后会自动加载令牌，保持登录状态

### 令牌使用
所有需要认证的 API 请求都会自动携带令牌：
```javascript
Authorization: Bearer <token>
```

### 需要认证的功能
- AI 发票识别
- AI 语音识别
- AI 智能分类
- 数据云端同步
- 文件上传

## 测试登录功能

### 快速测试步骤：

1. **启动 InsForge 服务器**（如果还没启动）：
   ```bash
   npm run insforge
   ```

2. **启动应用**：
   ```bash
   npm run web
   ```

3. **访问登录页面**：
   ```
   http://localhost:8081/auth
   ```

4. **注册测试用户**：
   - Username: testuser
   - Email: test@example.com
   - Password: password123

5. **查看服务器控制台**，确认看到欢迎邮件输出

6. **退出登录**（如果需要）：
   - 在应用中找到退出按钮
   - 或清除浏览器存储

7. **重新登录**：
   - Email: test@example.com
   - Password: password123

## 离线模式

如果 InsForge 服务器未运行：
- 应用会自动切换到离线模式
- 可以点击 "Skip for now" 跳过登录
- 本地功能（SQLite 数据库）仍然可用
- AI 功能和云同步将不可用

## 技术实现

### 认证流程
```
用户注册/登录
    ↓
InsForge API 验证
    ↓
返回 JWT 令牌
    ↓
存储到 AsyncStorage
    ↓
后续请求自动携带令牌
```

### 数据存储架构
```
本地层 (SQLite/IndexedDB)
    ↕ 双向同步
云端层 (InsForge)
```

### 文件结构
- `app/auth.tsx` - 登录/注册页面
- `store/auth.ts` - 认证状态管理（Zustand）
- `services/insforge.ts` - InsForge API 客户端
- `config/insforge.ts` - InsForge 配置
- `insforge-mock-server.js` - 本地模拟服务器

## 常见问题

### Q: 为什么看不到邮件？
A: 邮件显示在 InsForge 服务器的控制台中，不是真实发送。查看运行 `node insforge-mock-server.js` 的终端窗口。

### Q: 登录后数据会同步吗？
A: 是的，登录后应用会自动：
1. 从云端下载数据
2. 合并到本地数据库
3. 每 30 分钟自动同步一次

### Q: 可以使用真实的邮件服务吗？
A: 可以！在生产环境中，你需要：
1. 配置真实的 SMTP 服务（如 SendGrid、AWS SES）
2. 修改 `insforge-mock-server.js` 中的 `sendWelcomeEmail` 函数
3. 使用 nodemailer 等库发送真实邮件

### Q: 密码安全吗？
A: 当前是开发环境，密码以明文存储在内存中。生产环境需要：
1. 使用 bcrypt 加密密码
2. 使用 HTTPS
3. 实现密码强度验证
4. 添加密码重置功能

## 下一步

### 建议的改进：
1. ✅ 添加"忘记密码"功能
2. ✅ 实现邮箱验证
3. ✅ 添加 OAuth 登录（Google、Apple）
4. ✅ 密码强度检查
5. ✅ 两步验证
6. ✅ 用户资料编辑
7. ✅ 头像上传

## 支持

如有问题，请查看：
- `INSFORGE_CONNECTION_TEST.md` - 连接测试指南
- `INSFORGE_DEPLOYMENT.md` - 部署指南
- InsForge 服务器控制台日志
