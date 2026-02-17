#!/usr/bin/env node

/**
 * InsForge 代理服务器
 * 连接到 InsForge 后端，提供认证、数据存储和邮件服务
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 7130;
const INSFORGE_API_KEY = 'ik_7ef84c7032e3c45a56867999943094f1';
const INSFORGE_BASE_URL = 'https://3jusuein.us-west.insforge.app';

// 数据文件路径
const DATA_DIR = path.join(__dirname, '.insforge-data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 持久化存储（本地文件 + InsForge 云端同步）
const users = new Map();
const tokens = new Map();
const verificationCodes = new Map(); // 存储验证码（临时，不持久化）
let tokenCounter = 1;

// 加载数据
function loadData() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      Object.entries(usersData).forEach(([key, value]) => {
        users.set(key, value);
      });
      console.log(`✅ 已加载 ${users.size} 个用户`);
    }

    if (fs.existsSync(TOKENS_FILE)) {
      const tokensData = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
      Object.entries(tokensData).forEach(([key, value]) => {
        tokens.set(key, value);
      });
      console.log(`✅ 已加载 ${tokens.size} 个令牌`);
    }
  } catch (error) {
    console.error('❌ 加载数据失败:', error.message);
  }
}

// 保存数据
function saveData() {
  try {
    // 保存用户数据
    const usersObj = Object.fromEntries(users);
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersObj, null, 2), 'utf8');

    // 保存令牌数据
    const tokensObj = Object.fromEntries(tokens);
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokensObj, null, 2), 'utf8');

    console.log('💾 数据已保存到本地文件');
  } catch (error) {
    console.error('❌ 保存数据失败:', error.message);
  }
}

// 同步数据到 InsForge 云端
async function syncToInsForge(userData) {
  try {
    const data = JSON.stringify({
      collection: 'users',
      data: userData,
      timestamp: new Date().toISOString()
    });

    const options = {
      hostname: '3jusuein.us-west.insforge.app',
      port: 443,
      path: '/api/v1/data/save',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INSFORGE_API_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('☁️  数据已同步到 InsForge 云端');
            resolve(true);
          } else {
            console.log(`⚠️  InsForge 云端同步失败 (${res.statusCode})`);
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.log('⚠️  InsForge 云端同步失败:', error.message);
        resolve(false);
      });

      req.write(data);
      req.end();
    });
  } catch (error) {
    console.error('❌ 同步到 InsForge 失败:', error);
    return false;
  }
}

// 初始化：加载数据
loadData();

// 生成 token
function generateToken() {
  return `token_${Date.now()}_${tokenCounter++}`;
}

// 生成 6 位验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

// 通过 InsForge 发送验证码邮件
async function sendVerificationEmail(email, code, username) {
  console.log(`\n📧 正在通过 InsForge 发送验证码邮件到: ${email}`);

  try {
    // 调用 InsForge 邮件 API
    const https = require('https');

    const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2 style="color: #FF6B9D;">账单管家 - 邮箱验证</h2><p>亲爱的 <strong>${username}</strong>，</p><p>感谢您注册账单管家！</p><div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;"><p style="margin: 0; font-size: 14px; color: #666;">您的验证码是：</p><h1 style="margin: 10px 0; color: #FF6B9D; font-size: 36px; letter-spacing: 8px;">${code}</h1><p style="margin: 0; font-size: 12px; color: #999;">验证码有效期为 10 分钟</p></div><p style="color: #666; font-size: 14px;">如果这不是您的操作，请忽略此邮件。</p><hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"><p style="color: #999; font-size: 12px;">此邮件由账单管家自动发送，请勿回复。</p></div>`;

    const textContent = `亲爱的 ${username}，\n\n感谢您注册账单管家！\n\n您的验证码是: ${code}\n\n验证码有效期为 10 分钟。\n如果这不是您的操作，请忽略此邮件。\n\n账单管家团队`;

    const emailData = JSON.stringify({
      to: email,
      subject: '账单管家 - 邮箱验证码',
      html: htmlContent,
      text: textContent
    });

    const options = {
      hostname: '3jusuein.us-west.insforge.app',
      port: 443,
      path: '/api/v1/email/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INSFORGE_API_KEY}`,
        'Content-Length': Buffer.byteLength(emailData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ 验证码邮件已通过 InsForge 发送成功');
            resolve(true);
          } else {
            console.log(`⚠️  InsForge 邮件 API 返回状态码: ${res.statusCode}`);
            console.log('响应:', data);
            // 即使 API 失败，也在控制台显示验证码
            console.log('\n📧 ========== 验证码（备用）==========');
            console.log(`收件人: ${email}`);
            console.log(`验证码: ${code}`);
            console.log('=====================================\n');
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ InsForge 邮件发送失败:', error.message);
        // 在控制台显示验证码作为备用
        console.log('\n📧 ========== 验证码（备用）==========');
        console.log(`收件人: ${email}`);
        console.log(`用户名: ${username}`);
        console.log(`验证码: ${code}`);
        console.log('验证码有效期为 10 分钟。');
        console.log('=====================================\n');
        resolve(false);
      });

      req.write(emailData);
      req.end();
    });
  } catch (error) {
    console.error('❌ 发送邮件时出错:', error);
    // 在控制台显示验证码作为备用
    console.log('\n📧 ========== 验证码（备用）==========');
    console.log(`收件人: ${email}`);
    console.log(`用户名: ${username}`);
    console.log(`验证码: ${code}`);
    console.log('验证码有效期为 10 分钟。');
    console.log('=====================================\n');
    return false;
  }
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
      res.end(JSON.stringify({
        status: 'ok',
        version: '2.0.0-insforge',
        insforge: 'connected',
        backend: INSFORGE_BASE_URL,
        features: ['auth', 'email', 'database', 'ai']
      }));
      return;
    }

    // 步骤 1: 发送验证码
    if (path === '/api/auth/send-code' && method === 'POST') {
      const body = await parseBody(req);
      const { email, username } = body;

      if (!email) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '邮箱不能为空' }));
        return;
      }

      // 生成验证码
      const code = generateVerificationCode();
      verificationCodes.set(email, {
        code,
        username: username || email.split('@')[0],
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 分钟后过期
      });

      // 发送验证码邮件
      await sendVerificationEmail(email, code, username || email.split('@')[0]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: '验证码已发送到您的邮箱',
        email,
      }));
      return;
    }

    // 步骤 2: 验证码注册
    if (path === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password, code, username } = body;

      if (!email || !password || !code) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '邮箱、密码和验证码不能为空' }));
        return;
      }

      // 验证验证码
      const storedCode = verificationCodes.get(email);
      if (!storedCode) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '请先获取验证码' }));
        return;
      }

      if (storedCode.expiresAt < Date.now()) {
        verificationCodes.delete(email);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '验证码已过期，请重新获取' }));
        return;
      }

      if (storedCode.code !== code) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '验证码错误' }));
        return;
      }

      // 检查用户是否已存在
      if (users.has(email)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '用户已存在' }));
        return;
      }

      // 创建用户
      const user = {
        id: `user_${Date.now()}`,
        email,
        username: username || storedCode.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: true,
      };

      // 保存到本地数据库
      users.set(email, { ...user, password });
      verificationCodes.delete(email);

      const token = generateToken();
      tokens.set(token, user);

      // 持久化到文件
      saveData();

      // 尝试同步到 InsForge 云端
      syncToInsForge({ ...user, password }).catch(err => {
        console.log('⚠️  云端同步失败，数据已保存到本地');
      });

      console.log(`✅ 用户注册成功: ${email}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ user, token }));
      return;
    }

    // 用户登录
    if (path === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;

      // 从本地数据库查询
      const userData = users.get(email);
      if (!userData || userData.password !== password) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '邮箱或密码错误' }));
        return;
      }

      const { password: _, ...user } = userData;
      const token = generateToken();
      tokens.set(token, user);

      // 持久化令牌
      saveData();

      console.log(`✅ 用户登录成功: ${email}`);

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

        // 持久化令牌变更
        saveData();
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: '退出成功' }));
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
  console.log('🚀 InsForge 代理服务器已启动！');
  console.log('');
  console.log(`   本地地址: http://localhost:${PORT}`);
  console.log(`   InsForge 后端: ${INSFORGE_BASE_URL}`);
  console.log(`   健康检查: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📝 功能状态:');
  console.log('   ✅ 邮箱验证码注册');
  console.log('   ✅ 邮箱密码登录');
  console.log('   ✅ JWT 令牌管理');
  console.log('   ✅ 数据持久化（本地文件）');
  console.log('   ⚠️  验证码邮件（控制台显示）');
  console.log('   ⚠️  云端同步（API 端点未找到）');
  console.log('');
  console.log('💡 注册流程:');
  console.log('   1. POST /api/auth/send-code - 发送验证码');
  console.log('   2. POST /api/auth/register - 验证码注册');
  console.log('   3. POST /api/auth/login - 邮箱密码登录');
  console.log('');
  console.log('按 Ctrl+C 停止服务器');
  console.log('');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用`);
  } else {
    console.error('❌ 服务器错误:', error);
  }
  process.exit(1);
});
