// 测试 InsForge 认证功能
import { register, login, getCurrentUser } from './services/insforge-auth';

async function testAuth() {
  console.log('🧪 开始测试 InsForge 认证功能...\n');

  try {
    // 1. 测试注册
    console.log('1️⃣ 测试用户注册...');
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'Test123456';
    const testUsername = 'TestUser';

    const registerResult = await register(testEmail, testPassword, testUsername);
    console.log('✅ 注册成功！');
    console.log('用户信息:', registerResult.user);
    console.log('Token:', registerResult.accessToken.substring(0, 50) + '...\n');

    // 2. 测试获取当前用户
    console.log('2️⃣ 测试获取当前用户...');
    const currentUser = await getCurrentUser();
    console.log('✅ 获取成功！');
    console.log('当前用户:', currentUser, '\n');

    // 3. 测试登录
    console.log('3️⃣ 测试用户登录...');
    const loginResult = await login(testEmail, testPassword);
    console.log('✅ 登录成功！');
    console.log('用户信息:', loginResult.user);
    console.log('Token:', loginResult.accessToken.substring(0, 50) + '...\n');

    console.log('🎉 所有测试通过！');
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testAuth();
