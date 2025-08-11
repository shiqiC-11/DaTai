/**
 * 测试不同的用户名格式 - OIDC 登录测试
 * 
 * 这个脚本用于测试 Authing OIDC 登录时不同的用户名格式。
 * 当用户不确定应该使用哪种用户名格式登录时，可以运行此脚本
 * 来找到正确的用户名格式。
 * 
 * 使用方法：
 * 1. 确保已安装 dotenv: npm install dotenv
 * 2. 创建 .env 文件（参考 .env.example）
 * 3. 运行: node test-username-formats.mjs
 * 
 * 测试流程：
 * 1. 尝试不同的用户名格式（邮箱、用户名等）
 * 2. 使用相同的密码进行登录
 * 3. 找到第一个成功的用户名格式并退出
 * 
 * 注意：此脚本仅用于开发和测试，生产环境请使用固定的用户名格式
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testUsernameFormats() {
  try {
    console.log('🔍 测试不同的用户名格式...\n');

    // 从环境变量读取 Authing 配置
    const config = {
      domain: process.env.AUTHING_DOMAIN,
      clientId: process.env.AUTHING_CLIENT_ID,
      clientSecret: process.env.AUTHING_CLIENT_SECRET,
      password: process.env.TEST_PASSWORD
    };

    // 验证必需配置
    const requiredFields = ['domain', 'clientId', 'clientSecret', 'password'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`缺少必需配置: ${missingFields.join(', ')}`);
    }

    // Authing OIDC 配置
    const tokenUrl = `https://${config.domain}/oidc/token`;
    
    // 测试不同的用户名格式 - 从最可能到最不可能的顺序
    const usernameFormats = [
      'shiqi.chen5411@gmail.com',  // 完整邮箱地址
      'shiqi.chen5411',            // 不带域名部分的用户名
      'shiqi.chen',                // 部分用户名
      'shiqi',                     // 更短的用户名
      'datai-test-user'            // 原始测试用户名（最可能成功）
    ];

    // 逐个测试每种用户名格式
    for (const username of usernameFormats) {
      console.log(`\n🔐 测试用户名: ${username}`);
      
      try {
        // 发送 OIDC password grant 请求
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'password',           // OAuth 2.0 密码授权模式
            client_id: config.clientId,       // 客户端 ID
            client_secret: config.clientSecret, // 客户端密钥
            username: username,               // 要测试的用户名
            password: config.password,        // 用户密码
            scope: 'openid profile email'     // 请求的权限范围
          })
        });

        console.log(`状态码: ${response.status}`);
        
        if (response.ok) {
          // 登录成功，解析响应数据
          const data = await response.json();
          console.log('✅ 登录成功！');
          console.log('Token:', data.access_token ? data.access_token.substring(0, 50) + '...' : '无token');
          
          // 找到正确的用户名格式，退出循环
          console.log(`\n🎯 找到正确的用户名格式: ${username}`);
          console.log('💡 建议在后续测试中使用此用户名格式');
          break;
        } else {
          // 登录失败，显示错误信息
          const errorData = await response.text();
          console.log('❌ 登录失败:', errorData);
        }
      } catch (error) {
        // 网络请求失败
        console.log('❌ 请求失败:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.message.includes('缺少必需配置')) {
      console.log('\n💡 解决方案:');
      console.log('1. 确保 .env 文件存在且包含所有必需配置');
      console.log('2. 检查 AUTHING_DOMAIN, AUTHING_CLIENT_ID, AUTHING_CLIENT_SECRET, TEST_PASSWORD');
      console.log('3. 参考 .env.example 文件格式');
    }
  }
}

// 执行测试
testUsernameFormats(); 