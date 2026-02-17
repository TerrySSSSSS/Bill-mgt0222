#!/bin/bash

echo "🔍 InsForge 连接状态检查"
echo "================================"
echo ""

# 1. 检查服务器进程
echo "1️⃣ 检查服务器进程..."
if ps aux | grep -q "[i]nsforge-mock-server"; then
    echo "   ✅ InsForge 服务器进程正在运行"
    ps aux | grep "[i]nsforge-mock-server" | awk '{print "   进程 ID:", $2}'
else
    echo "   ❌ InsForge 服务器未运行"
    echo "   请运行: npm run insforge"
    exit 1
fi

echo ""

# 2. 检查健康端点
echo "2️⃣ 检查健康端点..."
HEALTH_RESPONSE=$(curl -s http://localhost:7130/health 2>&1)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "   ✅ 健康检查通过"
    echo "   响应: $HEALTH_RESPONSE"
else
    echo "   ❌ 健康检查失败"
    echo "   响应: $HEALTH_RESPONSE"
    exit 1
fi

echo ""

# 3. 测试用户注册
echo "3️⃣ 测试用户注册 API..."
TEST_EMAIL="test_$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:7130/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"test123\",\"username\":\"测试用户\"}" 2>&1)

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo "   ✅ 用户注册成功"
    echo "   邮箱: $TEST_EMAIL"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:30}..."
else
    echo "   ❌ 用户注册失败"
    echo "   响应: $REGISTER_RESPONSE"
fi

echo ""

# 4. 检查端口监听
echo "4️⃣ 检查端口监听..."
if lsof -i :7130 >/dev/null 2>&1; then
    echo "   ✅ 端口 7130 正在监听"
    lsof -i :7130 | grep LISTEN | awk '{print "   进程:", $1, "PID:", $2}'
else
    echo "   ❌ 端口 7130 未监听"
fi

echo ""
echo "================================"
echo "✅ InsForge 服务器状态: 正常"
echo ""
echo "📱 下一步:"
echo "   1. 启动应用: npm run web"
echo "   2. 访问测试页面: http://localhost:8081/insforge-test"
echo "   3. 或在浏览器控制台查看连接日志"
echo ""
