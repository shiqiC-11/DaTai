# DaTai - cursor practice

一个基于 Go + GraphQL + PostgreSQL + React 的现代化全栈项目，集成 Authing 身份认证。

## 🏗️ 项目结构

```
DaTai/
├── backend/                    # Go后端服务
│   ├── main.go                # 应用入口
│   ├── go.mod                 # Go模块配置
│   ├── internal/              # 内部包
│   │   ├── middleware/        # 中间件（Authing等）
│   │   └── user/             # 用户业务逻辑
│   ├── gql/                  # GraphQL相关
│   │   ├── generated/        # 生成的GraphQL代码
│   │   ├── resolver/         # GraphQL解析器
│   │   └── schema/           # GraphQL模式定义
│   ├── db/                   # 数据库相关
│   ├── sql/                  # SQL查询文件
│   ├── migrations/           # 数据库迁移文件
│   ├── docker-compose.yml    # 数据库容器配置
│   ├── sqlc.yaml            # SQL代码生成配置
│   └── gqlgen.yml           # GraphQL代码生成配置
├── frontend/                  # React前端应用
│   ├── test-username-formats.mjs    # OIDC登录测试
│   ├── test-authing-api.mjs         # API连通性测试
│   ├── test-user-info.mjs           # 前后端集成测试
│   ├── test-with-env.mjs            # 环境变量示例
│   ├── .env                         # 敏感配置（不提交到Git）
│   └── .env.example                 # 配置模板
└── docs/                      # 项目文档
```

## 🚀 快速开始

### 前置条件

- **Go 1.23+**
- **Node.js 18+**
- **Docker & Docker Compose**
- **Git**

### 1. 克隆项目

```bash
git clone https://github.com/your-username/datai.git
cd datai
```

### 2. 后端设置

```bash
# 进入后端目录
cd backend

# 安装Go依赖
go mod tidy

# 启动数据库
docker-compose up -d

# 运行数据库迁移
go run main.go

# 启动后端服务
go run main.go
```

后端服务将在 `http://localhost:8080` 启动。

### 3. 前端设置

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 Authing 配置

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

## 🔧 开发指南

### 后端开发

```bash
cd backend

# 代码生成
sqlc generate          # 生成数据库代码
gqlgen generate        # 生成GraphQL代码

# 运行测试
go test ./...

# 构建
go build

# 运行
go run main.go
```

### 前端开发

```bash
cd frontend

# 安装新依赖
npm install package-name

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm run test
```

### 数据库操作

```bash
cd backend

# 启动数据库
docker-compose up -d

# 停止数据库
docker-compose down

# 查看数据库状态
docker-compose ps
```

## 🔐 Authing 集成

### 1. 配置 Authing

1. 登录 [Authing 控制台](https://console.authing.cn/)
2. 创建应用或使用现有应用
3. 获取以下信息：
   - **域名**: `your-domain.authing.cn`
   - **应用ID**: `your-app-id`
   - **应用密钥**: `your-app-secret`

### 2. 环境变量配置

```bash
cd frontend
cp .env.example .env
```

编辑 `.env` 文件：
```env
# Authing配置
AUTHING_DOMAIN=your-domain.authing.cn
AUTHING_CLIENT_ID=your-app-id
AUTHING_CLIENT_SECRET=your-app-secret

# 测试用户配置
TEST_USERNAME=your-test-username
TEST_PASSWORD=your-test-password

# 后端API配置
BACKEND_URL=http://localhost:8080
```

### 3. 测试 Authing 集成

```bash
# 进入前端目录
cd frontend

# 测试用户名格式（找到正确的登录方式）
node test-username-formats.mjs

# 测试 Authing API 连通性
node test-authing-api.mjs

# 测试完整的前后端集成
node test-user-info.mjs

# 测试环境变量配置
node test-with-env.mjs
```

## 📚 API 文档

### GraphQL 端点

- **开发环境**: `http://localhost:8080/query`
- **GraphQL Playground**: `http://localhost:8080/`

### 主要查询

```graphql
# 获取当前用户信息
query {
  me {
    id
    uid
    nickname
    avatar
    createdAt
  }
}

# 更新用户信息
mutation {
  upsertUser(input: {
    nickname: "新昵称"
    avatar: "头像URL"
  }) {
    id
    uid
    nickname
    avatar
    createdAt
  }
}
```

## 🛠️ 技术栈

### 后端
- **语言**: Go 1.23+
- **框架**: 标准库 HTTP
- **GraphQL**: gqlgen
- **数据库**: PostgreSQL
- **ORM**: sqlc (代码生成)
- **认证**: Authing JWT
- **容器**: Docker & Docker Compose

### 前端
- **框架**: React 18+
- **构建工具**: Next.js / Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand / Redux Toolkit
- **认证**: Authing SDK
- **GraphQL客户端**: Apollo Client

## 📁 项目结构详解

### Backend (`backend/`)

```
backend/
├── main.go                 # 应用入口点
├── go.mod                  # Go模块定义
├── internal/               # 内部包
│   ├── middleware/         # HTTP中间件
│   │   └── authing.go     # Authing JWT验证
│   └── user/              # 用户模块
│       ├── service.go      # 业务逻辑
│       └── repo.go         # 数据访问
├── gql/                   # GraphQL
│   ├── generated/         # 生成的代码
│   ├── resolver/          # 解析器实现
│   └── schema/            # GraphQL模式
├── db/                    # 数据库代码
│   └── user/              # 用户数据库操作
├── sql/                   # SQL查询
├── migrations/            # 数据库迁移
└── docker-compose.yml     # 数据库容器
```

### Frontend (`frontend/`)

```
frontend/
├── package.json           # 项目配置
├── src/                   # 源代码
│   ├── components/        # React组件
│   ├── pages/            # 页面组件
│   ├── hooks/            # 自定义Hooks
│   ├── utils/            # 工具函数
│   └── App.js            # 主应用组件
├── public/               # 静态资源
├── tests/                # 测试文件
├── .env                  # 环境变量配置
└── .env.example          # 配置模板
```

## 🧪 测试

### 后端测试

```bash
cd backend
go test ./...
go test -v ./internal/user
```

### 前端测试

```bash
cd frontend
npm run test
npm run test:watch
```

### 集成测试

```bash
# 进入前端目录
cd frontend

# 测试 Authing 集成
node test-user-info.mjs

# 测试 API 连通性
node test-authing-api.mjs

# 测试用户名格式
node test-username-formats.mjs
```

### 测试文件说明

- **`test-username-formats.mjs`** - 测试不同的用户名格式，找到正确的登录方式
- **`test-authing-api.mjs`** - 测试 Authing API 连通性，确认服务状态
- **`test-user-info.mjs`** - 完整的前后端集成测试，验证整个流程
- **`test-with-env.mjs`** - 环境变量配置示例和验证

## 🚀 部署

### 开发环境

```bash
# 后端
cd backend
go run main.go

# 前端
cd frontend
npm run dev

# 数据库
cd backend
docker-compose up -d
```

### 生产环境

```bash
# 构建后端
cd backend
go build -o datai-server

# 构建前端
cd frontend
npm run build

# 使用 Docker 部署
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- **项目维护者**: 11
- **邮箱**: ...

## Main Contributor
- kiki-11
- Cursor and chatGPT :>

## 🙏 致谢

- [Authing](https://authing.cn/) - 身份认证服务
- [gqlgen](https://gqlgen.com/) - GraphQL代码生成
- [sqlc](https://sqlc.dev/) - SQL代码生成
- [PostgreSQL](https://www.postgresql.org/) - 数据库
- [React](https://reactjs.org/) - 前端框架

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！ 
