# Web Review Pack

一个用于 Web 项目在线预览、编辑和打包下载的管理平台。支持深色/浅色主题切换，界面简洁大气。

## ✨ 功能特性

- 📁 **项目管理** - 上传 ZIP 压缩包自动解压，支持在线预览项目列表
- 👀 **在线预览** - 直接在浏览器中预览 Web 项目，支持目录浏览
- ✏️ **在线编辑** - 集成 VS Code Server，支持在线代码编辑
- 📦 **打包下载** - 一键将项目打包为 ZIP 文件下载
- 🔍 **快速搜索** - 支持关键字实时过滤项目列表
- 🌓 **主题切换** - 支持深色/浅色主题，默认跟随系统设置
- 📱 **响应式设计** - 适配桌面端和移动端

## 🚀 快速开始

### Docker 部署（推荐）

```bash
# 复制配置文件
cp docker-compose.yml.demo docker-compose.yml

# 根据需要修改 docker-compose.yml 中的端口和密码配置

# 构建并启动服务
docker-compose up -d --build
```

启动后访问：
- **预览平台**: http://localhost:8080
- **代码编辑器**: http://localhost:8443

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（支持热重载）
npm run dev

# 生产模式
npm run start:prod
```

## 📁 项目结构

```
web-review-pack/
├── public/
│   ├── review/          # Web 项目存放目录
│   ├── zip/             # 临时打包文件目录
│   ├── js/              # 前端脚本
│   └── stylesheets/     # 样式文件
├── src/
│   ├── app.js           # Express 应用配置
│   ├── router/          # 路由配置
│   └── views/           # EJS 模板
├── docker-compose.yml   # Docker 编排配置
├── Dockerfile           # Docker 镜像配置
└── package.json
```

## ⚙️ 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `HOST` | 服务监听地址 | `127.0.0.1` |
| `PORT` | 服务监听端口 | `3000` |
| `EDITOR_HOST` | 编辑器主机地址 | 自动获取 |
| `EDITOR_PORT` | 编辑器端口 | `8443` |

## 🔧 使用说明

### 上传项目

1. 将 Web 项目打包为 ZIP 文件
2. 点击页面右上角的「上传文件包」按钮
3. 选择 ZIP 文件，自动上传并解压
4. 文件名中的空格会被自动移除

### 预览项目

- 点击「预览」按钮在新窗口中打开项目
- 如果项目根目录没有 `index.html`，会显示文件列表
- 支持目录浏览和子目录导航

### 编辑项目

- 点击「编辑」按钮打开 VS Code Server
- 需要配合 code-server 容器使用

### 下载项目

- 点击「下载」按钮将项目打包为 ZIP 下载
- 打包文件会在 60 秒后自动清理

## 🐳 Docker Compose 配置说明

```yaml
services:
  code-server:           # VS Code 在线编辑器
    ports:
      - 8443:8443        # 编辑器访问端口
    environment:
      - PASSWORD=password  # 编辑器登录密码
      
  review:                # 预览平台服务
    ports:
      - 8080:8080        # 平台访问端口
```

## 📄 License

MIT License

## 👤 Author

Powered by [liubaicai](https://github.com/liubaicai)