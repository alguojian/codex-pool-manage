# 部署指南

## Railway 部署（推荐）

### 1. 准备工作
- 注册 [Railway](https://railway.app/) 账号
- 安装 Railway CLI（可选）

### 2. 部署步骤

1. 在 Railway 创建新项目
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
6. 部署完成

### 注意事项
- Railway 会自动运行 `npm install`，Codex CLI 会自动安装
- 如果 Codex CLI 安装失败，可以使用"扫描"功能手动导入 auth 文件
- 数据库会自动初始化
- 前端文件需要单独构建并托管，或使用 Express 静态服务

---

## Render 部署

### 1. 准备工作
- 注册 [Render](https://render.com/) 账号

### 2. 部署步骤

1. 创建 Web Service
2. 连接 GitHub 仓库
3. 配置：
   - Build Command: `npm install`
   - Start Command: `npm start`
4. 添加 MySQL 数据库（需付费）或使用外部数据库
5. 配置环境变量（同 Railway）

---

## Docker 部署

### 1. 构建镜像

```bash
docker build -t codex-pool-manager .
```

### 2. 运行容器

```bash
docker run -d \
  -p 3001:3001 \
  -e DB_HOST=your-mysql-host \
  -e DB_USER=root \
  -e DB_PASSWORD=your-password \
  -e DB_NAME=codex_pool_manager \
  codex-pool-manager
```

---

## VPS 部署（阿里云/腾讯云）

### 1. 安装依赖

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MySQL
sudo apt-get install mysql-server
```

### 2. 部署应用

```bash
git clone https://github.com/your-repo/CodexPool.git
cd CodexPool
npm install
cp .env.example .env
# 编辑 .env 配置
npm start
```

### 3. 使用 PM2 守护进程

```bash
npm install -g pm2
pm2 start server/index.js --name codex-pool
pm2 startup
pm2 save
```

### 4. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 注意事项

1. **数据库**：确保 MySQL 可访问且已创建数据库
2. **环境变量**：根据实际情况配置 `.env`
3. **端口**：某些平台会自动分配端口，使用 `process.env.PORT`
4. **文件存储**：auth 文件需要持久化存储
5. **前端构建**：生产环境建议构建前端并用 Express 托管

## 前端单独部署（可选）

如果想把前端部署到 Vercel/Netlify：

1. 构建前端：`npm run build`
2. 将 `dist` 目录部署到 Vercel
3. 配置 `VITE_API_BASE_URL` 指向后端地址
