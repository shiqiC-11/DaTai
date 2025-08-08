# Authing 前后端联动设置指南

## 🎯 目标
实现前端 Authing 登录 → 后端 JWT 验证 → GraphQL API 调用的完整流程。

## 📋 前置条件

### 1. Authing 应用配置
1. 登录 [Authing 控制台](https://console.authing.cn/)
2. 创建应用或使用现有应用
3. 获取以下信息：
   - **域名**: `your-domain.authing.cn`
   - **应用ID**: `your-app-id`
   - **API Identifier**: `your-api-identifier`

### 2. 环境准备
```bash
# 启动数据库
docker-compose up -d

# 安装依赖
go mod tidy
```

## 🔧 配置步骤

### 1. 环境变量配置
复制 `env.example` 为 `.env` 并填入你的 Authing 配置：

```bash
cp env.example .env
```

编辑 `.env` 文件：
```env
# Authing配置
AUTHING_JWKS_URL=https://your-domain.authing.cn/.well-known/jwks.json
AUTHING_AUDIENCE=your-api-identifier
AUTHING_ISSUER=https://your-domain.authing.cn/

# 数据库配置
DB_USER=dataiuser
DB_PASSWORD=dataipass
DB_HOST=localhost
DB_PORT=5432

# 服务器配置
PORT=8080
```

### 2. 启动后端服务
```bash
go run main.go
```

服务器将在 `http://localhost:8080` 启动。

## 🧪 测试方法

### 方法1: 使用 Node.js 测试脚本
```bash
# 安装依赖
npm install authing-js-sdk node-fetch

# 编辑 test-authing.js，填入你的 Authing 配置
# 运行测试
node test-authing.js
```

### 方法2: 使用 curl 测试
```bash
# 1. 从 Authing 获取 JWT token
# 2. 编辑 test-curl.sh，替换 YOUR_AUTHING_TOKEN
# 3. 运行测试
chmod +x test-curl.sh
./test-curl.sh
```

### 方法3: 手动测试
```bash
# 无token访问（应该失败）
curl -X POST http://localhost:8080/query \
  -H "Content-Type: application/json" \
  -d '{"query":"query { me { id } }"}'

# 有token访问（应该成功）
curl -X POST http://localhost:8080/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"query { me { id uid nickname } }"}'
```

## 🔍 测试预期结果

### ✅ 成功情况
- 携带有效 JWT token 的请求应该返回用户数据
- 用户信息正确注入到 GraphQL context
- 数据库操作正常执行

### ❌ 失败情况
- 无 token 的请求返回 401 Unauthorized
- 无效 token 的请求返回 401 Unauthorized
- 过期 token 的请求返回 401 Unauthorized

## 🐛 常见问题

### 1. JWKS 获取失败
- 检查 `AUTHING_JWKS_URL` 是否正确
- 确认 Authing 应用配置正确

### 2. Token 验证失败
- 检查 `AUTHING_AUDIENCE` 和 `AUTHING_ISSUER` 是否与 token 中的值匹配
- 确认 token 未过期

### 3. 数据库连接失败
- 确认 Docker 容器正在运行
- 检查数据库连接参数

## 📚 相关文件

- `internal/middleware/authing.go` - JWT 验证中间件
- `main.go` - 服务器启动配置
- `test-authing.js` - Node.js 测试脚本
- `test-curl.sh` - curl 测试脚本
- `env.example` - 环境变量示例

## 🚀 下一步

1. 配置你的 Authing 应用信息
2. 运行测试脚本验证集成
3. 在前端应用中集成 Authing SDK
4. 实现完整的用户认证流程 