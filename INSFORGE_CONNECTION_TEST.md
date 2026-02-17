# InsForge 连接验证指南

## 🔍 快速验证

### 1. 检查 InsForge 服务器是否运行

```bash
# 方法 1: 使用 curl
curl http://localhost:7130/health

# 应该返回:
# {"status":"ok","version":"1.0.0-mock"}

# 方法 2: 在浏览器中打开
# http://localhost:7130/health
```

### 2. 检查服务器进程

```bash
ps aux | grep insforge-mock-server | grep -v grep

# 应该看到类似:
# boyu.sun  26080  0.0  0.3  node insforge-mock-server.js
```

### 3. 测试 API 端点

```bash
# 测试用户注册
curl -X POST http://localhost:7130/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","username":"测试"}'

# 应该返回用户信息和 token
```

## 📱 在应用中验证

### 方法 1: 使用测试页面

1. 启动应用:
   ```bash
   npm run web
   ```

2. 在浏览器中访问:
   ```
   http://localhost:8081/insforge-test
   ```

3. 点击"测试连接"按钮

4. 查看测试结果:
   - ✅ 如果显示"已连接"和"注册成功" = 连接正常
   - ❌ 如果显示错误 = 需要排查问题

### 方法 2: 查看浏览器控制台

1. 打开应用
2. 按 F12 打开开发者工具
3. 切换到 Console 标签
4. 查找以下日志:

```
Auto-configuring InsForge...
InsForge server is available
InsForge configured successfully: http://localhost:7130
```

如果看到这些日志 = ✅ 连接成功

如果看到:
```
InsForge server is not available
No InsForge server available, running in offline mode
```
= ❌ 未连接

## 🐛 常见问题排查

### 问题 1: 服务器未运行

**症状:**
```bash
curl http://localhost:7130/health
# curl: (7) Failed to connect to localhost port 7130: Connection refused
```

**解决:**
```bash
# 启动服务器
node insforge-mock-server.js

# 或使用 npm 命令
npm run insforge
```

### 问题 2: 端口被占用

**症状:**
```
Error: listen EADDRINUSE: address already in use :::7130
```

**解决:**
```bash
# 查找占用端口的进程
lsof -i :7130

# 杀死进程
kill -9 <PID>

# 重新启动
npm run insforge
```

### 问题 3: 应用无法连接

**症状:**
- 服务器运行正常
- curl 测试成功
- 但应用显示"离线"

**可能原因:**
1. **CORS 问题** (Web 平台)
2. **网络策略限制**
3. **应用缓存**

**解决步骤:**

1. **清除浏览器缓存**
   - Chrome: Ctrl+Shift+Delete
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

2. **硬刷新页面**
   - Windows: Ctrl+Shift+R
   - Mac: Cmd+Shift+R

3. **检查网络请求**
   - F12 打开开发者工具
   - 切换到 Network 标签
   - 刷新页面
   - 查找对 `localhost:7130` 的请求
   - 检查请求状态和响应

4. **查看错误信息**
   - 在 Console 标签查看错误
   - 搜索 "InsForge" 或 "localhost:7130"

### 问题 4: 跨域 (CORS) 错误

**症状:**
```
Access to fetch at 'http://localhost:7130/...' from origin 'http://localhost:8081'
has been blocked by CORS policy
```

**解决:**
InsForge 模拟服务器已经配置了 CORS，应该不会有这个问题。
如果仍然出现，检查 `insforge-mock-server.js` 中的 CORS 设置。

## ✅ 验证清单

完成以下检查，确认 InsForge 已正确连接:

- [ ] 1. InsForge 服务器进程正在运行
  ```bash
  ps aux | grep insforge-mock-server
  ```

- [ ] 2. 健康检查端点响应正常
  ```bash
  curl http://localhost:7130/health
  ```

- [ ] 3. 可以成功注册用户
  ```bash
  curl -X POST http://localhost:7130/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"123456"}'
  ```

- [ ] 4. 应用启动时显示连接成功
  - 查看浏览器控制台
  - 应该看到 "InsForge configured successfully"

- [ ] 5. 可以在应用中注册/登录
  - 打开应用
  - 尝试注册新用户
  - 应该成功

- [ ] 6. InsForgeStatus 组件显示"在线"
  - 如果你添加了这个组件
  - 应该显示绿色状态

## 🎯 当前状态总结

根据之前的测试:

✅ **InsForge 服务器状态:**
- 进程 ID: 26080
- 端口: 7130
- 状态: 运行中
- 健康检查: 正常

✅ **API 测试:**
- 用户注册: 成功
- 返回数据: 正常

❓ **应用连接状态:**
- 需要你在应用中验证
- 使用上述方法检查

## 📝 下一步

1. **启动应用** (如果还没启动):
   ```bash
   npm run web
   ```

2. **访问测试页面**:
   ```
   http://localhost:8081/insforge-test
   ```

3. **点击"测试连接"**

4. **查看结果并告诉我**:
   - 显示什么状态?
   - 有什么错误信息?
   - 测试日志显示什么?

## 💡 提示

如果一切正常，你应该能够:
- ✅ 注册新用户
- ✅ 登录
- ✅ 使用 AI 功能 (返回模拟数据)
- ✅ 数据同步

如果还是不行，请:
1. 截图浏览器控制台的错误
2. 截图 Network 标签的请求
3. 告诉我具体的错误信息

我会帮你进一步排查！
