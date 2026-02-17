// 测试 InsForge 认证功能 - 简化版
const { initInsforgeClient } = require('./services/insforge-client.ts');

async function testConnection() {
  console.log('🧪 测试 InsForge 连接...\n');

  try {
    console.log('1️⃣ 初始化 InsForge 客户端...');
    const client = await initInsforgeClient();
    console.log('✅ 客户端初始化成功！\n');

    console.log('2️⃣ 测试数据库连接...');
    const { data, error } = await client.from('users').select('count').limit(1);

    if (error) {
      console.error('❌ 数据库连接失败:', error.message);
    } else {
      console.log('✅ 数据库连接成功！\n');
    }

    console.log('🎉 连接测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testConnection();
