// 测试 InsForge MCP 服务器连接
const { spawn } = require('child_process');

const API_KEY = 'ik_7ef84c7032e3c45a56867999943094f1';
const API_BASE_URL = 'https://3jusuein.us-west.insforge.app';

// 启动 MCP 服务器
const mcp = spawn('npx', ['-y', '@insforge/mcp@latest'], {
  env: {
    ...process.env,
    API_KEY: API_KEY,
    API_BASE_URL: API_BASE_URL
  }
});

let output = '';

mcp.stdout.on('data', (data) => {
  output += data.toString();
  console.log('STDOUT:', data.toString());
});

mcp.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

mcp.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
  console.log('Total output:', output);
});

// 发送初始化消息
setTimeout(() => {
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  console.log('Sending initialize message:', JSON.stringify(initMessage));
  mcp.stdin.write(JSON.stringify(initMessage) + '\n');
}, 1000);

// 5秒后关闭
setTimeout(() => {
  console.log('Closing MCP server...');
  mcp.kill();
}, 5000);
