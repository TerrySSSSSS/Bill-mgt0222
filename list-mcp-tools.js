// 获取 InsForge MCP 工具列表
const { spawn } = require('child_process');

const API_KEY = 'ik_7ef84c7032e3c45a56867999943094f1';
const API_BASE_URL = 'https://3jusuein.us-west.insforge.app';

const mcp = spawn('npx', ['-y', '@insforge/mcp@latest'], {
  env: {
    ...process.env,
    API_KEY: API_KEY,
    API_BASE_URL: API_BASE_URL
  }
});

let messageId = 1;

mcp.stdout.on('data', (data) => {
  console.log('Response:', data.toString());
});

mcp.stderr.on('data', (data) => {
  console.error('Info:', data.toString());
});

// 初始化
setTimeout(() => {
  const initMessage = {
    jsonrpc: '2.0',
    id: messageId++,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  };
  mcp.stdin.write(JSON.stringify(initMessage) + '\n');
}, 500);

// 发送 initialized 通知
setTimeout(() => {
  const initializedNotification = {
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  };
  mcp.stdin.write(JSON.stringify(initializedNotification) + '\n');
}, 1000);

// 获取工具列表
setTimeout(() => {
  const listToolsMessage = {
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/list',
    params: {}
  };
  console.log('\n=== Requesting tools list ===');
  mcp.stdin.write(JSON.stringify(listToolsMessage) + '\n');
}, 1500);

// 5秒后关闭
setTimeout(() => {
  mcp.kill();
  process.exit(0);
}, 5000);
