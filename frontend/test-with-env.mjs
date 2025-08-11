/**
 * 使用环境变量的测试示例
 * 
 * 这个文件展示了如何在测试中使用 .env 文件来管理配置。
 * 在实际项目中，你应该将敏感信息存储在 .env 文件中。
 * 
 * 使用方法：
 * 1. 创建 .env 文件（参考 .env.example）
 * 2. 安装 dotenv: npm install dotenv
 * 3. 运行: node test-with-env.mjs
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

async function testWithEnv() {
  try {
    console.log('🔍 使用环境变量的测试...\n');

    // 从环境变量读取配置
    const config = {
      domain: process.env.AUTHING_DOMAIN,
      clientId: process.env.AUTHING_CLIENT_ID,
      clientSecret: process.env.AUTHING_CLIENT_SECRET,
      username: process.env.TEST_USERNAME,
      password: process.env.TEST_PASSWORD,
      backendUrl: process.env.BACKEND_URL
    };

    // 验证配置完整性
    console.log('📋 配置验证:');
    Object.entries(config).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${value || '未设置'}`);
    });

    // 检查必需配置
    const requiredFields = ['domain', 'clientId', 'clientSecret', 'username', 'password'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`缺少必需配置: ${missingFields.join(', ')}`);
    }

    console.log('\n🚀 开始测试...');

    // 构建 OIDC 端点
    const tokenUrl = `https://${config.domain}/oidc/token`;
    
    // 发送登录请求
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        username: config.username,
        password: config.password,
        scope: 'openid profile email'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 登录成功！');
      console.log('Token:', data.access_token ? data.access_token.substring(0, 50) + '...' : '无token');
      
      // 测试后端 API
      if (config.backendUrl) {
        console.log('\n🔗 测试后端 API...');
        const graphqlResponse = await fetch(`${config.backendUrl}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.access_token}`
          },
          body: JSON.stringify({
            query: `query { me { id uid nickname } }`
          })
        });
        
        console.log('后端响应状态:', graphqlResponse.status);
      }
    } else {
      const errorData = await response.text();
      console.log('❌ 登录失败:', errorData);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.message.includes('缺少必需配置')) {
      console.log('\n💡 解决方案:');
      console.log('1. 复制 .env.example 为 .env');
      console.log('2. 在 .env 中填入你的实际配置');
      console.log('3. 确保 .env 文件在 frontend/ 目录下');
    }
  }
}

// 执行测试
testWithEnv(); 