// Authing 前后端联动测试脚本
// 使用方法：
// 1. 安装 Authing SDK: npm install authing-js-sdk
// 2. 配置你的 Authing 应用信息
// 3. 运行: node test-authing.js

const { AuthingFactory } = require('authing-js-sdk');

// 配置你的 Authing 应用信息
const authing = new AuthingFactory({
  domain: 'https://qiyu-datai.authing.cn', // 替换为你的域名
  appId: '688f667fecadfe990e2f3c9b', // 替换为你的应用ID
});

async function testAuthingIntegration() {
  try {
    console.log('🔐 开始 Authing 集成测试...\n');

    // 1. 模拟用户登录（实际使用时应该在前端进行）
    console.log('1. 模拟用户登录...');
    const user = await authing.loginByPassword({
      username: 'test@example.com', // 替换为测试用户
      password: 'password123'
    });
    
    console.log('✅ 登录成功');
    console.log('用户ID:', user.id);
    console.log('Token:', user.token.substring(0, 50) + '...\n');

    // 2. 测试 GraphQL 查询
    console.log('2. 测试 GraphQL 查询...');
    const response = await fetch('http://localhost:8080/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        query: `
          query {
            me {
              id
              uid
              nickname
              avatar
              createdAt
            }
          }
        `
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ GraphQL 查询成功');
      console.log('响应数据:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ GraphQL 查询失败');
      console.log('错误信息:', result);
    }

    // 3. 测试 GraphQL 变更
    console.log('\n3. 测试 GraphQL 变更...');
    const mutationResponse = await fetch('http://localhost:8080/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        query: `
          mutation {
            upsertUser(input: {
              nickname: "测试用户"
              avatar: "https://example.com/avatar.jpg"
            }) {
              id
              uid
              nickname
              avatar
              createdAt
            }
          }
        `
      })
    });

    const mutationResult = await mutationResponse.json();
    
    if (mutationResponse.ok) {
      console.log('✅ GraphQL 变更成功');
      console.log('响应数据:', JSON.stringify(mutationResult, null, 2));
    } else {
      console.log('❌ GraphQL 变更失败');
      console.log('错误信息:', mutationResult);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 如果没有安装 fetch，可以使用 node-fetch
if (typeof fetch === 'undefined') {
  const fetch = require('node-fetch');
}

testAuthingIntegration(); 