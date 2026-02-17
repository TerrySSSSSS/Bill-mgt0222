#!/usr/bin/env node

/**
 * 简化版 InsForge 模拟服务器
 * 用于开发和测试，提供基本的 API 端点
 */

const http = require('http');
const url = require('url');
const nodemailer = require('nodemailer');

const PORT = 7130;

// 邮件配置（使用环境变量或默认配置）
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail', // 可以是 'gmail', 'outlook', 'yahoo' 等
  user: process.env.EMAIL_USER || '', // 你的邮箱地址
  pass: process.env.EMAIL_PASS || '', // 你的邮箱密码或应用专用密码
};

// 创建邮件传输器
let transporter = null;
if (EMAIL_CONFIG.user && EMAIL_CONFIG.pass) {
  transporter = nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.pass,
    },
  });
  console.log('✅ 邮件服务已配置');
} else {
  console.log('⚠️  邮件服务未配置，将只在控制台显示邮件内容');
  console.log('   要启用真实邮件发送，请设置环境变量：');
  console.log('   EMAIL_SERVICE=gmail EMAIL_USER=your@email.com EMAIL_PASS=your_password node insforge-mock-server.js');
}

// 模拟数据存储
const users = new Map();
const tokens = new Map();
let tokenCounter = 1;

// 生成简单的 token
function generateToken() {
  return `token_${Date.now()}_${tokenCounter++}`;
}

// 发送欢迎邮件（真实发送或控制台显示）
async function sendWelcomeEmail(user) {
  const emailContent = {
    subject: '欢迎加入账单管家！',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B9D;">欢迎加入账单管家！🎉</h2>
        <p>亲爱的 <strong>${user.username}</strong>，</p>
        <p>您的账户已成功创建。现在您可以：</p>
        <ul>
          <li>✓ 记录日常收支</li>
          <li>✓ 使用 AI 识别发票</li>
          <li>✓ 语音记账</li>
          <li>✓ 查看财务报表</li>
          <li>✓ 数据云端同步</li>
        </ul>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">账户信息</h3>
          <p><strong>邮箱：</strong>${user.email}</p>
          <p><strong>用户 ID：</strong>${user.id}</p>
          <p><strong>注册时间：</strong>${new Date(user.createdAt).toLocaleString('zh-CN')}</p>
        </div>
        <p>如有任何问题，请随时联系我们。</p>
        <p>祝您使用愉快！</p>
        <p style="color: #666;">账单管家团队</p>
      </div>
    `,
    text: `
亲爱的 ${user.username}，

欢迎加入账单管家！🎉

您的账户已成功创建。现在您可以：
  ✓ 记录日常收支
  ✓ 使用 AI 识别发票
  ✓ 语音记账
  ✓ 查看财务报表
  ✓ 数据云端同步

账户信息:
  邮箱: ${user.email}
  用户 ID: ${user.id}
  注册时间: ${new Date(user.createdAt).toLocaleString('zh-CN')}

如有任何问题，请随时联系我们。

祝您使用愉快！
账单管家团队
    `,
  };

  // 如果配置了邮件服务，发送真实邮件
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"账单管家" <${EMAIL_CONFIG.user}>`,
        to: user.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
      console.log('\n📧 ========== 邮件发送成功 ==========');
      console.log(`收件人: ${user.email}`);
      console.log(`邮件 ID: ${info.messageId}`);
      console.log('✅ 邮件已发送到用户邮箱\n');
      return true;
    } catch (error) {
      console.error('\n❌ 邮件发送失败:', error.message);
      console.log('将在控制台显示邮件内容\n');
    }
  }

  // 如果没有配置邮件服务或发送失败，在控制台显示
  console.log('\n📧 ========== 欢迎邮件（控制台模式）==========');
  console.log(`收件人: ${user.email}`);
  console.log(`用户名: ${user.username}`);
  console.log(`主题: ${emailContent.subject}`);
  console.log('\n邮件内容:');
  console.log('─────────────────────────────────');
  console.log(emailContent.text);
  console.log('─────────────────────────────────');
  console.log('💡 提示: 配置邮件服务后可发送真实邮件\n');
  return false;
}

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// 验证 token
function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }
  const token = auth.substring(7);
  return tokens.get(token);
}

// 处理请求
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${method} ${path}`);

  try {
    // 健康检查
    if (path === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', version: '1.0.0-mock' }));
      return;
    }

    // 用户注册
    if (path === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password, username, phone } = body;

      if (!email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '邮箱和密码不能为空' }));
        return;
      }

      if (users.has(email)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '用户已存在' }));
        return;
      }

      const user = {
        id: `user_${Date.now()}`,
        email,
        username: username || email.split('@')[0],
        phone: phone || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      users.set(email, { ...user, password });
      const token = generateToken();
      tokens.set(token, user);

      // 模拟发送欢迎邮件
      sendWelcomeEmail(user);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ user, token }));
      return;
    }

    // 用户登录
    if (path === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;

      const userData = users.get(email);
      if (!userData || userData.password !== password) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '邮箱或密码错误' }));
        return;
      }

      const { password: _, ...user } = userData;
      const token = generateToken();
      tokens.set(token, user);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ user, token }));
      return;
    }

    // 获取当前用户
    if (path === '/api/auth/me' && method === 'GET') {
      const user = verifyToken(req);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '未授权' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
      return;
    }

    // 退出登录
    if (path === '/api/auth/logout' && method === 'POST') {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.substring(7);
        tokens.delete(token);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: '退出成功' }));
      return;
    }

    // AI 发票识别（模拟）
    if (path === '/api/ai/invoice-recognition' && method === 'POST') {
      const user = verifyToken(req);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '未授权' }));
        return;
      }

      // 模拟识别结果
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        amount: 128.50,
        totalAmount: 128.50,
        vendor: '星巴克咖啡',
        date: new Date().toISOString().split('T')[0],
        category: '餐饮',
        confidence: 0.95,
        invoiceNumber: 'INV' + Date.now(),
      }));
      return;
    }

    // AI 语音识别（模拟）
    if (path === '/api/ai/voice-recognition' && method === 'POST') {
      const user = verifyToken(req);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '未授权' }));
        return;
      }

      // 模拟识别结果
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        text: '今天在星巴克买了一杯咖啡，花了三十块钱',
        confidence: 0.92,
        language: 'zh-CN',
        duration: 3.5,
      }));
      return;
    }

    // AI 智能分类（模拟）
    if (path === '/api/ai/categorize' && method === 'POST') {
      const user = verifyToken(req);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '未授权' }));
        return;
      }

      const body = await parseBody(req);
      const { description } = body;

      // 简单的关键词匹配
      let category = '其他';
      let categoryIcon = 'more-horizontal';

      if (description.includes('餐') || description.includes('吃') || description.includes('咖啡')) {
        category = '餐饮';
        categoryIcon = 'utensils';
      } else if (description.includes('车') || description.includes('打车') || description.includes('地铁')) {
        category = '交通';
        categoryIcon = 'car';
      } else if (description.includes('买') || description.includes('购物')) {
        category = '购物';
        categoryIcon = 'shopping-bag';
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        category,
        categoryIcon,
        confidence: 0.88,
      }));
      return;
    }

    // 数据同步 - 上传
    if (path === '/api/sync/upload' && method === 'POST') {
      const user = verifyToken(req);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '未授权' }));
        return;
      }

      await parseBody(req);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: '数据上传成功' }));
      return;
    }

    // 数据同步 - 下载
    if (path === '/api/sync/download' && method === 'GET') {
      const user = verifyToken(req);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '未授权' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        accounts: [],
        transactions: [],
        lastSyncTime: new Date().toISOString(),
      }));
      return;
    }

    // 文件上传（模拟）
    if (path === '/api/storage/upload' && method === 'POST') {
      const user = verifyToken(req);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '未授权' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        fileId: 'file_' + Date.now(),
        url: 'http://localhost:7130/files/mock.jpg',
        filename: 'upload.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
      }));
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not Found' }));

  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: '服务器错误' }));
  }
}

// 创建服务器
const server = http.createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 InsForge Mock Server 已启动！');
  console.log('');
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   健康检查: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📝 可用的 API 端点:');
  console.log('   POST /api/auth/register    - 用户注册');
  console.log('   POST /api/auth/login       - 用户登录');
  console.log('   GET  /api/auth/me          - 获取当前用户');
  console.log('   POST /api/auth/logout      - 退出登录');
  console.log('   POST /api/ai/invoice-recognition - AI 发票识别');
  console.log('   POST /api/ai/voice-recognition   - AI 语音识别');
  console.log('   POST /api/ai/categorize    - AI 智能分类');
  console.log('   POST /api/sync/upload      - 上传数据');
  console.log('   GET  /api/sync/download    - 下载数据');
  console.log('   POST /api/storage/upload   - 文件上传');
  console.log('');
  console.log('💡 提示: 这是一个模拟服务器，数据存储在内存中');
  console.log('   重启服务器后数据会丢失');
  console.log('');
  console.log('按 Ctrl+C 停止服务器');
  console.log('');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用`);
    console.error('   请先停止其他服务或修改端口号');
  } else {
    console.error('❌ 服务器错误:', error);
  }
  process.exit(1);
});
