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

# 预览构建结果
npm run preview
```

构建产物在 `dist/` 目录，可部署到任意静态服务器。

## 项目结构

```
cloth_demo/
├── public/
│   └── bg-removal-data/    # 抠图 AI 模型文件（约 200MB）
├── src/
│   ├── components/
│   │   ├── LeftPanel.vue       # 左侧衣服列表面板
│   │   ├── RightPanel.vue      # 右侧预览面板
│   │   ├── ModelCanvas.vue     # 模特画布
│   │   ├── ClothItem.vue       # 衣服列表项
│   │   └── ControlSliders.vue  # 变换控制滑块
│   ├── App.vue
│   └── main.js
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

抠图功能使用本地 AI 模型，首次加载需要读取约 40MB 模型文件。

- 模型文件已包含在 `public/bg-removal-data/` 目录
- 完全本地运行，无需联网，保护隐私
- 处理一张图片约需 3-10 秒（取决于图片大小和设备性能）

## 技术栈

- **Vue 3** - 前端框架
- **Vite** - 构建工具
- **vuedraggable** - 拖拽排序
- **@imgly/background-removal** - AI 背景移除

## 注意事项

1. `public/bg-removal-data/` 目录包含约 200MB 的 AI 模型文件，Git 克隆时请耐心等待
2. 如果不需要抠图功能，可删除该目录以减小项目体积
3. 建议使用 Chrome/Edge 等现代浏览器以获得最佳体验

## License

MIT
