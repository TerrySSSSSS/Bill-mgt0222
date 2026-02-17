# InsForge 本地部署指南

由于云端 InsForge 服务器 `https://3jusuein.us-west.insforge.app` 无法访问，本指南将帮助你在本地部署 InsForge 后端服务。

## 📋 前提条件

- Node.js 18+
- PostgreSQL 14+ 或 Docker
- Git

## 🚀 方式一：使用 Docker（推荐）

### 1. 安装 Docker

如果还没有安装 Docker，请访问 [Docker 官网](https://www.docker.com/get-started) 下载安装。

### 2. 创建 docker-compose.yml

在项目根目录创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: insforge
      POSTGRES_USER: insforge
      POSTGRES_PASSWORD: insforge_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  insforge:
    image: insforge/insforge:latest
    environment:
      DATABASE_URL: postgresql://insforge:insforge_password@postgres:5432/insforge
      API_KEY: ik_7ef84c7032e3c45a56867999943094f1
      PORT: 7130
    ports:
      - "7130:7130"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 验证服务

```bash
curl http://localhost:7130/health
```

如果返回 `{"status":"ok"}`，说明服务启动成功！

## 🔧 方式二：手动安装

### 1. 安装 PostgreSQL

**macOS (使用 Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-14
sudo systemctl start postgresql
```

**Windows:**
下载并安装 [PostgreSQL](https://www.postgresql.org/download/windows/)

### 2. 创建数据库

```bash
# 连接到 PostgreSQL
psql postgres

# 创建数据库和用户
CREATE DATABASE insforge;
CREATE USER insforge WITH PASSWORD 'insforge_password';
GRANT ALL PRIVILEGES ON DATABASE insforge TO insforge;
\q
```

### 3. 克隆 InsForge 仓库

```bash
# 如果网络可以访问 GitHub
git clone https://github.com/InsForge/insforge.git
cd insforge

# 或者从其他源下载
# 访问 https://github.com/InsForge/insforge 下载 ZIP
```

### 4. 安装依赖

```bash
npm install
```

### 5. 配置环境变量

创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL=postgresql://insforge:insforge_password@localhost:5432/insforge

# API 密钥
API_KEY=ik_7ef84c7032e3c45a56867999943094f1

# 服务器端口
PORT=7130

# JWT 密钥（随机生成）
JWT_SECRET=your-super-secret-jwt-key-change-this

# 环境
NODE_ENV=development
```

### 6. 运行数据库迁移

```bash
npm run migrate
```

### 7. 启动服务器

```bash
npm run dev
```

### 8. 验证服务

打开浏览器访问 `http://localhost:7130/health`

## 📱 配置应用连接本地服务器

应用已经配置为自动检测可用的 InsForge 服务器。启动顺序：

1. 先尝试连接本地服务器 (`http://localhost:7130`)
2. 如果本地不可用，尝试云端服务器
3. 如果都不可用，应用将以离线模式运行

### 手动配置（可选）

如果需要手动指定服务器，可以在应用中添加配置界面，或直接修改 `config/insforge.ts`：

```typescript
// 使用本地服务器
import { useLocalServer } from '@/config/insforge';
useLocalServer();

// 使用云端服务器
import { useCloudServer } from '@/config/insforge';
useCloudServer();
```

## 🔍 故障排除

### 问题 1: PostgreSQL 连接失败

**错误信息:** `ECONNREFUSED` 或 `connection refused`

**解决方案:**
```bash
# 检查 PostgreSQL 是否运行
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# 启动 PostgreSQL
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql
```

### 问题 2: 端口 7130 已被占用

**解决方案:**
```bash
# 查找占用端口的进程
lsof -i :7130

# 杀死进程
kill -9 <PID>

# 或者修改 .env 中的 PORT
PORT=7131
```

### 问题 3: Docker 容器无法启动

**解决方案:**
```bash
# 查看日志
docker-compose logs insforge

# 重启容器
docker-compose restart

# 完全重建
docker-compose down
docker-compose up -d --build
```

### 问题 4: 应用无法连接到本地服务器

**检查清单:**
1. InsForge 服务器是否运行？
   ```bash
   curl http://localhost:7130/health
   ```

2. 防火墙是否阻止了连接？
   - macOS: 系统偏好设置 > 安全性与隐私 > 防火墙
   - Windows: 控制面板 > Windows Defender 防火墙

3. 检查应用日志：
   - 打开浏览器开发者工具（F12）
   - 查看 Console 标签页
   - 搜索 "InsForge" 相关日志

## 📊 验证 InsForge 功能

### 1. 测试用户注册

```bash
curl -X POST http://localhost:7130/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ik_7ef84c7032e3c45a56867999943094f1" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "测试用户"
  }'
```

### 2. 测试用户登录

```bash
curl -X POST http://localhost:7130/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ik_7ef84c7032e3c45a56867999943094f1" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. 测试健康检查

```bash
curl http://localhost:7130/health
```

## 🎯 生产环境部署

### 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "insforge" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs insforge

# 重启应用
pm2 restart insforge
```

### 使用 Nginx 反向代理

创建 `/etc/nginx/sites-available/insforge`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:7130;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/insforge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 安全建议

1. **更改默认密钥**
   - 修改 `.env` 中的 `API_KEY` 和 `JWT_SECRET`
   - 使用强密码

2. **启用 HTTPS**
   - 使用 Let's Encrypt 获取免费 SSL 证书
   - 配置 Nginx 使用 HTTPS

3. **限制访问**
   - 配置防火墙规则
   - 使用 IP 白名单

4. **定期备份**
   ```bash
   # 备份 PostgreSQL 数据库
   pg_dump insforge > backup_$(date +%Y%m%d).sql
   ```

## 📚 相关资源

- [InsForge 官方文档](https://docs.insforge.dev)
- [InsForge GitHub](https://github.com/InsForge/insforge)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Docker 文档](https://docs.docker.com/)

## 💡 快速命令参考

```bash
# Docker 方式
docker-compose up -d          # 启动服务
docker-compose down           # 停止服务
docker-compose logs -f        # 查看日志
docker-compose restart        # 重启服务

# 手动方式
npm run dev                   # 开发模式
npm run build                 # 构建生产版本
npm start                     # 生产模式
npm run migrate              # 运行数据库迁移

# PostgreSQL
psql -U insforge -d insforge  # 连接数据库
\dt                          # 列出所有表
\q                           # 退出
```

## 🎉 完成！

现在你的 InsForge 后端服务应该已经在本地运行了。应用会自动检测并连接到本地服务器。

如果遇到问题，请检查：
1. InsForge 服务器日志
2. PostgreSQL 日志
3. 应用浏览器控制台日志

祝你使用愉快！🚀
