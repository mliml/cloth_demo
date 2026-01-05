# 虚拟试衣 Demo

一个基于 Vue 3 的虚拟试衣 Web 应用，支持上传衣服图片并叠加到模特身上，可调整位置、大小、旋转角度，还支持智能抠图功能。

## 功能特性

- 上传多张衣服图片，管理衣服列表
- 拖拽调整衣服图层顺序
- 在画布上直接拖拽移动衣服位置
- 滑块调整衣服大小、旋转角度
- 显示/隐藏单件衣服
- 更换模特图片
- **智能抠图**：上传时自动移除衣服背景（本地 AI 模型，无需联网）

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/mliml/cloth_demo.git
cd cloth_demo

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

浏览器访问 http://localhost:5173 即可使用。

### 构建部署

```bash
# 构建生产版本
npm run build

# 启动后端服务（抠图功能需要）
npm start
```

服务器将运行在 http://localhost:3000。

### 生产环境部署

生产环境建议将前端静态文件和后端服务分开部署。

#### 1. 目录结构

```
/usr/local/ai-image/
├── cloth_demo_front/       # 前端静态文件
│   └── dist/               # npm run build 产出
└── cloth_demo_backend/     # 后端服务
    ├── server.js
    ├── package.json
    ├── node_modules/
    └── ...
```

#### 2. 部署前端

```bash
# 本地构建
npm run build

# 上传 dist 目录到服务器
scp -r dist root@your-server:/usr/local/ai-image/cloth_demo_front/
```

#### 3. 部署后端

```bash
# 上传后端代码到服务器
scp server.js package.json package-lock.json root@your-server:/usr/local/ai-image/cloth_demo_backend/

# 在服务器上安装依赖
cd /usr/local/ai-image/cloth_demo_backend
npm install --production
```

#### 4. 使用 PM2 管理服务（推荐）

使用 PM2 可以保持服务稳定运行，自动重启崩溃的进程，并支持开机自启。

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd /usr/local/ai-image/cloth_demo_backend
pm2 start server.js --name cloth-demo

# 设置开机自启
pm2 startup
pm2 save

# 常用命令
pm2 list              # 查看所有进程
pm2 logs cloth-demo   # 查看日志
pm2 restart cloth-demo # 重启服务
pm2 stop cloth-demo   # 停止服务
```

#### 5. Nginx 反向代理配置

编辑 `/etc/nginx/sites-enabled/default`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /usr/local/ai-image/cloth_demo_front/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
        proxy_read_timeout 120s;  # 抠图可能需要较长时间
    }
}
```

重新加载 Nginx 配置：

```bash
sudo systemctl reload nginx
```

#### 6. 故障排查

如果遇到 502 错误，按以下步骤排查：

```bash
# 1. 检查后端服务是否运行
pm2 list
# 或
ps aux | grep "node server" | grep -v grep

# 2. 测试后端是否响应
curl http://127.0.0.1:3000/api/health

# 3. 查看服务日志
pm2 logs cloth-demo
# 或
cat /usr/local/ai-image/cloth_demo_backend/server.log

# 4. 如果服务未运行，重新启动
pm2 restart cloth-demo
```

## 项目结构

```
cloth_demo/
├── public/
├── src/
│   ├── components/
│   │   ├── LeftPanel.vue       # 左侧衣服列表面板
│   │   ├── RightPanel.vue      # 右侧预览面板
│   │   ├── ModelCanvas.vue     # 模特画布
│   │   ├── ClothItem.vue       # 衣服列表项
│   │   └── ControlSliders.vue  # 变换控制滑块
│   ├── App.vue
│   └── main.js
├── server.js               # Express 后端服务（抠图 API）
├── model.png               # 默认模特图片
├── index.html
├── package.json
└── vite.config.js
```

## 使用说明

### 基本操作

1. **上传衣服**：点击左侧「上传衣服」按钮选择图片
2. **智能抠图**：点击「上传并抠图」自动移除图片背景
3. **调整位置**：在画布上直接拖拽选中的衣服
4. **调整大小/角度**：使用底部滑块精确调整
5. **图层顺序**：在左侧列表拖拽调整（上方 = 最上层）
6. **显示/隐藏**：点击列表项的眼睛图标
7. **更换模特**：点击右上角「更换模特」按钮

### 关于抠图功能

抠图功能在服务器端运行，使用 AI 模型自动移除背景并清理边缘碎屑。

- **服务器端处理**：无需下载模型到浏览器，解决带宽问题
- **智能后处理**：自动移除抠图后的小碎片，只保留主体
- 处理一张图片约需 5-15 秒（取决于图片大小和服务器性能）

## 技术栈

- **Vue 3** - 前端框架
- **Vite** - 构建工具
- **Express** - 后端服务框架
- **vuedraggable** - 拖拽排序
- **@imgly/background-removal-node** - 服务器端 AI 背景移除
- **Sharp** - 图像后处理（移除碎片）

## 注意事项

1. 抠图功能需要启动后端服务（`npm start`）
2. 服务器需要足够的内存（建议 2GB 以上）用于 AI 模型运行
3. 建议使用 Chrome/Edge 等现代浏览器以获得最佳体验

## License

MIT
