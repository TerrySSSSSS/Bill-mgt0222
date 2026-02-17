# 邮件发送配置指南

## 📧 如何配置真实邮件发送

InsForge 服务器现在支持发送真实邮件到用户邮箱。按照以下步骤配置：

## 方法 1: 使用 Gmail（推荐）

### 步骤 1: 启用两步验证
1. 访问 [Google 账户安全设置](https://myaccount.google.com/security)
2. 启用"两步验证"

### 步骤 2: 生成应用专用密码
1. 访问 [应用专用密码](https://myaccount.google.com/apppasswords)
2. 选择"邮件"和"其他（自定义名称）"
3. 输入名称：`账单管家 InsForge`
4. 点击"生成"
5. 复制生成的 16 位密码（格式：xxxx xxxx xxxx xxxx）

### 步骤 3: 配置环境变量
创建 `.env` 文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # 应用专用密码
```

### 步骤 4: 启动服务器
```bash
# 方法 1: 使用 npm 脚本
npm run insforge

# 方法 2: 直接运行（会自动读取 .env）
EMAIL_SERVICE=gmail EMAIL_USER=your@gmail.com EMAIL_PASS=your-app-password node insforge-mock-server.js
```

## 方法 2: 使用 Outlook/Hotmail

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

## 方法 3: 使用 QQ 邮箱

```env
EMAIL_SERVICE=qq
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-authorization-code  # QQ 邮箱授权码
```

获取 QQ 邮箱授权码：
1. 登录 QQ 邮箱
2. 设置 → 账户 → POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务
3. 开启 SMTP 服务
4. 生成授权码

## 方法 4: 使用 163 邮箱

```env
EMAIL_SERVICE=163
EMAIL_USER=your-email@163.com
EMAIL_PASS=your-authorization-code  # 163 邮箱授权码
```

## 测试邮件发送

### 1. 启动服务器
```bash
EMAIL_SERVICE=gmail EMAIL_USER=your@gmail.com EMAIL_PASS=your-app-password node insforge-mock-server.js
```

### 2. 注册测试用户
在浏览器中访问 http://localhost:8081，注册一个新用户，使用你的真实邮箱。

### 3. 检查邮箱
- 查看收件箱
- 如果没收到，检查垃圾邮件文件夹
- 查看服务器控制台的日志

## 常见问题

### Q: Gmail 提示"不够安全的应用"
A: 必须使用"应用专用密码"，不能使用普通密码。

### Q: 邮件发送失败
A: 检查：
1. 邮箱地址和密码是否正确
2. 是否启用了两步验证（Gmail）
3. 是否使用了应用专用密码
4. 网络连接是否正常

### Q: 没有收到邮件
A:
1. 检查垃圾邮件文件夹
2. 查看服务器控制台日志
3. 确认邮件服务配置正确

### Q: 不想配置邮件服务
A: 可以不配置，服务器会在控制台显示邮件内容（开发模式）。

## 支持的邮件服务

- Gmail
- Outlook / Hotmail
- Yahoo Mail
- QQ 邮箱
- 163 邮箱
- 126 邮箱
- Sina 邮箱
- 其他支持 SMTP 的邮箱服务

## 安全提示

⚠️ **重要**：
- 不要将 `.env` 文件提交到 Git
- 不要分享你的邮箱密码或应用专用密码
- 使用应用专用密码而不是账户密码
- 定期更换密码

## 生产环境建议

在生产环境中，建议使用专业的邮件服务：
- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [Amazon SES](https://aws.amazon.com/ses/)
- [阿里云邮件推送](https://www.aliyun.com/product/directmail)

这些服务提供更好的送达率、统计分析和大规模发送能力。
