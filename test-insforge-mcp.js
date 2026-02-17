// 测试 InsForge MCP 工具
const https = require('https');

const API_KEY = 'ik_7ef84c7032e3c45a56867999943094f1';
const API_BASE_URL = 'https://3jusuein.us-west.insforge.app';

// 尝试使用 run-raw-sql 创建用户表
async function testCreateTable() {
  const data = JSON.stringify({
    query: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email_verified BOOLEAN DEFAULT FALSE
      )
    `
  });

  const options = {
    hostname: '3jusuein.us-west.insforge.app',
    port: 443,
    path: '/api/v1/sql/execute',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', responseData);
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

testCreateTable().catch(console.error);
