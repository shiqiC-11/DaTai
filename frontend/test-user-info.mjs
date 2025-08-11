/**
 * 前后端集成测试 - 用户信息获取和 GraphQL API 测试
 * 
 * 这是主要的集成测试脚本，用于测试完整的前后端联动流程：
 * 1. 通过 Authing OIDC 获取用户访问令牌
 * 2. 使用令牌从 Authing 获取用户信息
 * 3. 使用令牌调用后端 GraphQL API
 * 
 * 测试流程：
 * 1. 登录 Authing 获取 access_token
 * 2. 验证令牌有效性（从 Authing 获取用户信息）
 * 3. 测试后端 GraphQL API（需要后端服务运行）
 * 
 * 使用方法：
 * 1. 确保已安装 dotenv: npm install dotenv
 * 2. 创建 .env 文件（参考 .env.example）
 * 3. 确保后端服务正在运行（http://localhost:8080）
 * 4. 运行: node test-user-info.mjs
 * 
 * 预期结果：
 * - ✅ Authing 登录成功
 * - ✅ 获取到有效的 access_token
 * - ✅ 从 Authing 获取用户信息成功
 * - ✅ 后端 GraphQL API 验证 JWT 成功
 * - ✅ 返回用户数据或创建新用户
 * 
 * 故障排除：
 * - 如果后端返回 401，检查 JWT 验证中间件配置
 * - 如果后端返回 500，检查数据库连接和 GraphQL 解析器
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testUserInfo() {
  try {
    console.log('🔍 测试获取用户信息...\n');

    // 从环境变量读取配置
    const config = {
      domain: process.env.AUTHING_DOMAIN,
      clientId: process.env.AUTHING_CLIENT_ID,
      clientSecret: process.env.AUTHING_CLIENT_SECRET,
      username: process.env.TEST_USERNAME,
      password: process.env.TEST_PASSWORD,
      backendUrl: process.env.BACKEND_URL || 'http://localhost:8080'
    };

    // 验证必需配置
    const requiredFields = ['domain', 'clientId', 'clientSecret', 'username', 'password'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`缺少必需配置: ${missingFields.join(', ')}`);
    }

    console.log('📋 配置验证完成');
    console.log(`  Authing 域名: ${config.domain}`);
    console.log(`  后端 URL: ${config.backendUrl}\n`);

    // ===== 第一步：获取 Authing 访问令牌 =====
    console.log('1. 获取 Authing 令牌...');
    
    // 构建 OIDC 端点
    const tokenUrl = `https://${config.domain}/oidc/token`;
    
    // 发送 OIDC password grant 请求
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',           // OAuth 2.0 密码授权模式
        client_id: config.clientId,       // 客户端 ID
        client_secret: config.clientSecret, // 客户端密钥
        username: config.username,        // 用户名
        password: config.password,        // 密码
        scope: 'openid profile email'     // 请求的权限范围
      })
    });

    // 检查令牌获取是否成功
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`获取 token 失败: ${errorData}`);
    }

    // 解析响应数据，提取两种令牌
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;  // 用于调用 Authing API
    const idToken = tokenData.id_token;          // JWT 格式，用于后端验证
    
    if (!accessToken) {
      throw new Error('响应中没有 access_token');
    }
    
    if (!idToken) {
      throw new Error('响应中没有 id_token');
    }
    
    console.log('✅ 获取到 access_token');
    console.log('Access Token:', accessToken.substring(0, 50) + '...');
    console.log('✅ 获取到 id_token (JWT 格式)');
    console.log('ID Token:', idToken.substring(0, 50) + '...\n');

    // ===== 第二步：验证令牌有效性 =====
    console.log('2. 获取用户信息...');
    
    // 使用 access_token 从 Authing 获取用户信息
    const userInfoResponse = await fetch(`https://${config.domain}/oidc/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`  // 使用 access_token
      }
    });

    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      console.log('✅ 用户信息获取成功！');
      console.log('用户信息:', JSON.stringify(userInfo, null, 2));
      
      // 验证关键用户信息
      console.log('\n👤 用户信息摘要:');
      console.log(`  用户ID (sub): ${userInfo.sub || '未设置'}`);
      console.log(`  邮箱: ${userInfo.email || '未设置'}`);
      console.log(`  昵称: ${userInfo.nickname || '未设置'}`);
      console.log(`  头像: ${userInfo.picture || '未设置'}`);
    } else {
      console.log('❌ 用户信息获取失败:', userInfoResponse.status);
      const errorData = await userInfoResponse.text();
      console.log('错误详情:', errorData);
    }

    // ===== 第三步：测试后端 GraphQL API =====
    console.log('\n3. 测试后端 GraphQL API...');
    
    // 使用 id_token (JWT 格式) 调用我们的后端 GraphQL API
    const graphqlResponse = await fetch(`${config.backendUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`  // 传递 JWT 令牌
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

    console.log('GraphQL 响应状态:', graphqlResponse.status);
    
    if (graphqlResponse.ok) {
      // GraphQL 查询成功
      const graphqlData = await graphqlResponse.json();
      console.log('✅ GraphQL 查询成功！');
      console.log('响应数据:', JSON.stringify(graphqlData, null, 2));
      
      // 分析响应数据
      if (graphqlData.data && graphqlData.data.me) {
        console.log('\n🎯 GraphQL 数据解析成功:');
        console.log(`  用户ID: ${graphqlData.data.me.id || '未设置'}`);
        console.log(`  用户UID: ${graphqlData.data.me.uid || '未设置'}`);
        console.log(`  昵称: ${graphqlData.data.me.nickname || '未设置'}`);
        console.log(`  头像: ${graphqlData.data.me.avatar || '未设置'}`);
        console.log(`  创建时间: ${graphqlData.data.me.createdAt || '未设置'}`);
      }
      
      console.log('\n🎉 前后端集成测试成功！');
      console.log('✅ Authing 认证 ✅ 后端 API 调用 ✅ 数据返回');
      
    } else {
      // GraphQL 查询失败
      const errorData = await graphqlResponse.text();
      console.log('❌ GraphQL 查询失败');
      console.log('错误信息:', errorData);
      
      // 提供故障排除建议
      console.log('\n🔧 故障排除建议:');
      if (graphqlResponse.status === 401) {
        console.log('  - 401 错误：JWT 验证失败，检查后端中间件配置');
        console.log('  - 检查 Authing JWKS URL 和 Issuer 配置');
        console.log('  - 确认 JWT 令牌格式正确');
      } else if (graphqlResponse.status === 500) {
        console.log('  - 500 错误：后端内部错误，检查服务器日志');
        console.log('  - 检查数据库连接和 GraphQL 解析器');
      } else {
        console.log(`  - ${graphqlResponse.status} 错误：检查后端服务状态`);
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.message.includes('缺少必需配置')) {
      console.log('\n💡 配置问题解决方案:');
      console.log('1. 确保 .env 文件存在且包含所有必需配置');
      console.log('2. 检查以下环境变量:');
      console.log('   - AUTHING_DOMAIN');
      console.log('   - AUTHING_CLIENT_ID');
      console.log('   - AUTHING_CLIENT_SECRET');
      console.log('   - TEST_USERNAME');
      console.log('   - TEST_PASSWORD');
      console.log('3. 参考 .env.example 文件格式');
    } else if (error.message.includes('fetch')) {
      console.error('网络请求失败，请检查：');
      console.error('  1. 网络连接是否正常');
      console.error('  2. Authing 服务是否可访问');
      console.error('  3. 后端服务是否正在运行');
    } else if (error.message.includes('token')) {
      console.error('令牌相关错误，请检查：');
      console.error('  1. Authing 应用配置是否正确');
      console.error('  2. 用户名和密码是否有效');
      console.error('  3. 应用权限是否配置正确');
    }
  }
}

// 执行集成测试
testUserInfo(); 