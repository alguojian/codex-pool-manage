# Codex 账号池管理器

<div align="center">

**多账号 Codex 管理仪表板**

实时监控用量 · 自动轮换 · 一键登录 · 智能管理

[功能特性](#-功能特性) · [快速开始](#-快速开始) · [部署指南](#-部署指南) · [使用说明](#-使用说明)

</div>

---

## ✨ 功能特性

- 🎯 **多平台支持** - 统一管理 OpenAI GPT、Google Gemini、Anthropic Claude 等多个平台账号
- 📊 **实时监控** - 可视化展示账号用量、配额、状态等关键指标
- 🔄 **智能轮换** - 自动检测账号状态，智能切换可用账号
- 🚀 **一键登录** - 内置终端支持，浏览器 OAuth 授权后自动保存
- 📁 **批量导入** - 支持扫描文件夹批量导入 auth.json 文件
- 🎨 **现代界面** - 基于 React + Tailwind CSS + shadcn/ui 构建的精美 UI
- 🌙 **主题切换** - 支持亮色/暗色主题自由切换
- 🌍 **国际化** - 内置中英文双语支持
- 📝 **日志记录** - 完整的操作日志和账号使用历史
- 🔒 **安全可靠** - 本地数据库存储，数据完全掌控



## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- MySQL 5.7+ 或 8.0+
- npm 或 yarn 或 bun

### 1. 安装依赖

```bash
npm install
```

> 💡 Codex CLI 会在安装依赖时自动安装。如果自动安装失败，可以手动安装：
> ```bash
> npm install -g @openai/codex --registry=https://registry.npmjs.org
> ```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接信息：

```env
# 服务端口
PORT=3001

# 前端地址（用于 CORS）
FRONTEND_ORIGIN=http://localhost:8080

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_SOCKET=/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock  # macOS XAMPP
DB_USER=root
DB_PASSWORD=
DB_NAME=codex_pool_manager

# API 地址（前端调用）
VITE_API_BASE_URL=http://localhost:3001
```

### 3. 启动 MySQL

使用 XAMPP、MAMP 或其他方式启动 MySQL，创建数据库：

```sql
CREATE DATABASE codex_pool_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> 💡 数据表会在首次运行时自动创建，无需手动建表

### 4. 运行项目

```bash
# 终端 1 - 启动后端服务
npm run server

# 终端 2 - 启动前端开发服务器
npm run dev
```

打开浏览器访问 [http://localhost:8080](http://localhost:8080)

---

## 📦 部署指南

### Railway 部署（推荐）

1. 在 [Railway](https://railway.app/) 创建新项目
2. 添加 MySQL 数据库服务
3. 从 GitHub 导入此仓库
4. 配置环境变量：

```env
PORT=3001
FRONTEND_ORIGIN=https://your-app.railway.app
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
VITE_API_BASE_URL=
```

5. 设置启动命令：`npm start`
6. 部署完成 ✅

详细部署教程请查看 [DEPLOY.md](DEPLOY.md)

### Docker 部署

```bash
# 构建镜像
docker build -t codex-pool-manager .

# 运行容器
docker run -d \
  -p 3001:3001 \
  -e DB_HOST=your-mysql-host \
  -e DB_USER=root \
  -e DB_PASSWORD=your-password \
  -e DB_NAME=codex_pool_manager \
  codex-pool-manager
```

### VPS 部署

```bash
# 克隆项目
git clone https://github.com/your-repo/CodexPool.git
cd CodexPool

# 安装依赖
npm install

# 配置环境
cp .env.example .env
# 编辑 .env 配置数据库信息

# 使用 PM2 守护进程
npm install -g pm2
pm2 start server/index.js --name codex-pool
pm2 startup
pm2 save
```

---

## 📖 使用说明

### ➕ 添加账号

#### 方式一：一键登录（推荐）

1. 点击右上角 **+ 添加账号** 按钮
2. 选择 **一键登录新账号**
3. 在弹出的终端中完成浏览器 OAuth 授权
4. 授权成功后账号自动保存到数据库 ✅

#### 方式二：手动导入

1. 在终端执行 `codex login`，完成浏览器授权
2. 复制 auth 文件到指定位置：
   ```bash
   cp ~/.codex/auth.json ~/Desktop/openai-accounts/acc1.json
   ```
3. 在界面点击 **+ 添加账号 → 扫描文件夹**
4. 选择存放 auth 文件的文件夹路径
5. 系统自动扫描并导入所有账号

#### 方式三：批量扫描

如果你有多个账号的 auth.json 文件：

```
openai-accounts/
├── account1.json
├── account2.json
└── account3.json
```

直接在界面选择 **扫描文件夹**，选择 `openai-accounts` 目录即可批量导入。

### 🔄 账号管理

- **查看详情** - 点击账号卡片查看用量、配额、状态等详细信息
- **刷新状态** - 点击刷新按钮更新账号最新状态
- **删除账号** - 点击删除按钮移除不需要的账号
- **筛选排序** - 使用顶部筛选栏按平台、状态筛选账号

### 📊 监控面板

- **总览统计** - 查看总账号数、可用账号数、今日用量等
- **用量图表** - 可视化展示各账号用量趋势
- **状态监控** - 实时显示账号在线状态和健康度

### 📝 日志查看

访问 **日志** 页面查看：
- 账号登录记录
- 使用历史
- 错误日志
- 操作审计

---

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Vite - 构建工具
- React Router - 路由管理
- TanStack Query - 数据请求
- Tailwind CSS - 样式框架
- shadcn/ui - UI 组件库
- Framer Motion - 动画库
- Recharts - 图表库

### 后端
- Node.js + Express
- MySQL 2 - 数据库驱动
- Codex CLI - 账号管理

---

## 📂 项目结构

```
CodexPool/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   │   ├── ui/            # shadcn/ui 组件
│   │   ├── AccountCard.tsx
│   │   ├── AddAccountDialog.tsx
│   │   └── ...
│   ├── pages/             # 页面组件
│   ├── lib/               # 工具函数
│   ├── hooks/             # 自定义 Hooks
│   └── types/             # TypeScript 类型
├── server/                # 后端服务
│   ├── index.js           # Express 服务器
│   ├── db.js              # 数据库连接
│   ├── config.js          # 配置文件
│   └── platforms.json     # 平台配置
├── accounts/              # 账号数据存储
├── public/                # 静态资源
├── .env                   # 环境变量
└── package.json           # 项目配置
```

---

## 🔧 可用脚本

```bash
# 开发
npm run dev              # 启动前端开发服务器
npm run server           # 启动后端服务

# 构建
npm run build            # 构建生产版本
npm run build:dev        # 构建开发版本

# 测试
npm run test             # 运行测试
npm run test:watch       # 监听模式运行测试

# 数据库
npm run db:init          # 初始化数据库

# 生产
npm start                # 启动生产服务器

# 代码质量
npm run lint             # 运行 ESLint 检查
```

---

## ❓ 常见问题

### 1. Codex CLI 安装失败？

手动安装：
```bash
npm install -g @openai/codex --registry=https://registry.npmjs.org
```

### 2. 数据库连接失败？

检查 `.env` 配置：
- 确认 MySQL 服务已启动
- 验证数据库用户名密码正确
- 确认数据库已创建

### 3. 前端无法连接后端？

检查：
- 后端服务是否正常运行（默认 3001 端口）
- `.env` 中的 `VITE_API_BASE_URL` 是否正确
- 浏览器控制台是否有 CORS 错误

### 4. 一键登录无响应？

确保：
- Codex CLI 已正确安装
- 系统可以打开默认浏览器
- 网络连接正常

---