#!/bin/bash

# Authing 前后端联动测试脚本 (curl版本)
# 使用方法：
# 1. 将 YOUR_AUTHING_TOKEN 替换为实际的 JWT token
# 2. 运行: ./test-curl.sh

TOKEN="YOUR_AUTHING_TOKEN"  # 替换为你的 Authing JWT token
SERVER_URL="http://localhost:8080"

echo "🔐 开始 Authing 集成测试...\n"

# 测试1: 无token访问（应该失败）
echo "1. 测试无token访问（应该失败）..."
curl -X POST $SERVER_URL/query \
  -H "Content-Type: application/json" \
  -d '{"query":"query { me { id } }"}' \
  -w "\nHTTP状态码: %{http_code}\n\n"

# 测试2: 有token访问（应该成功）
echo "2. 测试有token访问（应该成功）..."
curl -X POST $SERVER_URL/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"query { me { id uid nickname } }"}' \
  -w "\nHTTP状态码: %{http_code}\n\n"

# 测试3: 用户更新操作
echo "3. 测试用户更新操作..."
curl -X POST $SERVER_URL/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation { upsertUser(input: { nickname: \"测试用户\", avatar: \"https://example.com/avatar.jpg\" }) { id uid nickname avatar createdAt } }"
  }' \
  -w "\nHTTP状态码: %{http_code}\n\n"

echo "✅ 测试完成！" 