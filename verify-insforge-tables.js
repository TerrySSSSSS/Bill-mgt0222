// 验证 InsForge 云端数据库表
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
const tables = ['users', 'accounts', 'transactions'];
let currentTableIndex = 0;

mcp.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());

  lines.forEach(line => {
    try {
      const response = JSON.parse(line);

      if (response.id === 1 && response.result) {
        console.log('✅ MCP 服务器初始化成功\n');
        setTimeout(() => {
          const initializedNotification = {
            jsonrpc: '2.0',
            method: 'notifications/initialized'
          };
          mcp.stdin.write(JSON.stringify(initializedNotification) + '\n');
          setTimeout(() => checkNextTable(), 500);
        }, 500);
      }

      if (response.id > 1 && response.result) {
        console.log(`\n📊 ${tables[currentTableIndex - 1]} 表结构：`);
        console.log(response.result.content[0].text);

        if (currentTableIndex < tables.length) {
          setTimeout(() => checkNextTable(), 500);
        } else {
          console.log('\n✅ 所有表验证完成！');
          setTimeout(() => {
            mcp.kill();
            process.exit(0);
          }, 1000);
        }
      }

      if (response.error) {
        console.error(`\n❌ 错误:`, response.error);
        mcp.kill();
        process.exit(1);
      }
    } catch (e) {
      // 忽略非 JSON 行
    }
  });
});

mcp.stderr.on('data', (data) => {
  // 忽略 stderr 输出
});

function checkNextTable() {
  if (currentTableIndex >= tables.length) {
    return;
  }

  const tableName = tables[currentTableIndex];
  console.log(`\n🔍 检查 ${tableName} 表...`);

  const callToolMessage = {
    jsonrpc: '2.0',
    id: messageId++,
    method: 'tools/call',
    params: {
      name: 'get-table-schema',
      arguments: {
        tableName: tableName
      }
    }
  };

  mcp.stdin.write(JSON.stringify(callToolMessage) + '\n');
  currentTableIndex++;
}

setTimeout(() => {
  const initMessage = {
    jsonrpc: '2.0',
    id: messageId++,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'verify-tables', version: '1.0.0' }
    }
  };
  mcp.stdin.write(JSON.stringify(initMessage) + '\n');
}, 500);

setTimeout(() => {
  console.error('\n⏱️  超时');
  mcp.kill();
  process.exit(1);
}, 30000);
