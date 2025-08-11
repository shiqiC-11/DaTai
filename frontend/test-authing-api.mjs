/**
 * 测试 Authing API 连通性
 * 
 * 这个脚本用于测试 Authing 服务的 API 端点是否正常工作。
 * 在开始集成测试之前，建议先运行此脚本来确认 Authing 服务状态。
 * 
 * 测试内容：
 * 1. JWKS (JSON Web Key Set) 端点 - 获取公钥信息
 * 2. OpenID Connect 配置端点 - 获取 OIDC 配置信息
 * 
 * 使用方法：
 * 1. 确保已安装 dotenv: npm install dotenv
 * 2. 创建 .env 文件（参考 .env.example）
 * 3. 运行: node test-authing-api.mjs
 * 
 * 预期结果：
 * - 两个端点都应该返回 200 状态码
 * - JWKS 应该包含有效的 RSA 公钥
 * - OIDC 配置应该包含完整的端点信息
 * 
 * 如果测试失败，请检查：
 * 1. 网络连接是否正常
 * 2. Authing 域名是否正确
 * 3. Authing 服务是否正常运行
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testAuthingAPI() {
  try {
    console.log('🔍 测试 Authing API 连通性...\n');

    // 从环境变量读取 Authing 域名
    const domain = process.env.AUTHING_DOMAIN;
    if (!domain) {
      throw new Error('缺少 AUTHING_DOMAIN 环境变量，请在 .env 文件中设置');
    }

    console.log(`🌐 使用 Authing 域名: ${domain}\n`);

    // 测试 1: JWKS (JSON Web Key Set) 端点
    // 这个端点提供用于验证 JWT 签名的公钥信息
    const jwksUrl = `https://${domain}/oidc/.well-known/jwks.json`;
    console.log('1. 测试 JWKS 端点:', jwksUrl);
    
    const jwksResponse = await fetch(jwksUrl);
    console.log('JWKS 响应状态:', jwksResponse.status);
    
    if (jwksResponse.ok) {
      const jwksData = await jwksResponse.json();
      console.log('✅ JWKS 端点正常');
      console.log('JWKS 数据:', JSON.stringify(jwksData, null, 2));
      
      // 验证 JWKS 数据结构
      if (jwksData.keys && jwksData.keys.length > 0) {
        console.log(`📊 发现 ${jwksData.keys.length} 个公钥`);
        jwksData.keys.forEach((key, index) => {
          console.log(`  密钥 ${index + 1}: ${key.kty} (${key.alg}) - ${key.kid}`);
        });
      }
    } else {
      console.log('❌ JWKS 端点异常');
      console.log('可能的原因：域名错误、服务不可用、网络问题');
    }

    // 测试 2: OpenID Connect 配置端点
    // 这个端点提供 OIDC 服务的完整配置信息
    const oidcUrl = `https://${domain}/oidc/.well-known/openid-configuration`;
    console.log('\n2. 测试 OpenID Connect 配置:', oidcUrl);
    
    const oidcResponse = await fetch(oidcUrl);
    console.log('OIDC 响应状态:', oidcResponse.status);
    
    if (oidcResponse.ok) {
      const oidcData = await oidcResponse.json();
      console.log('✅ OpenID Connect 配置正常');
      console.log('OIDC 数据:', JSON.stringify(oidcData, null, 2));
      
      // 验证关键配置项
      console.log('\n🔧 关键配置验证:');
      console.log(`  Issuer: ${oidcData.issuer || '未设置'}`);
      console.log(`  Authorization Endpoint: ${oidcData.authorization_endpoint || '未设置'}`);
      console.log(`  Token Endpoint: ${oidcData.token_endpoint || '未设置'}`);
      console.log(`  JWKS URI: ${oidcData.jwks_uri || '未设置'}`);
      console.log(`  Userinfo Endpoint: ${oidcData.userinfo_endpoint || '未设置'}`);
      
      // 检查支持的授权类型
      if (oidcData.grant_types_supported) {
        console.log(`  Supported Grant Types: ${oidcData.grant_types_supported.join(', ')}`);
      }
    } else {
      console.log('❌ OpenID Connect 配置异常');
      console.log('可能的原因：OIDC 服务未启用、配置错误');
    }

    console.log('\n🎯 API 连通性测试完成！');
    console.log('如果所有测试都通过，说明 Authing 服务运行正常，可以继续进行集成测试。');

  } catch (error) {
    console.error('❌ API 测试失败:', error.message);
    
    if (error.message.includes('缺少 AUTHING_DOMAIN')) {
      console.log('\n💡 解决方案:');
      console.log('1. 在 .env 文件中设置 AUTHING_DOMAIN');
      console.log('2. 格式: AUTHING_DOMAIN=qiyu-datai.authing.cn');
      console.log('3. 不要包含 https:// 前缀');
    } else {
      console.log('请检查网络连接和 Authing 服务状态');
    }
  }
}

// 执行测试
testAuthingAPI(); 