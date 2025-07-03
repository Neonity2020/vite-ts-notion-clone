# Notion Clone with SQLite Database

一个基于 React + TypeScript + Electron 的 Notion 克隆应用，使用 SQLite 数据库进行数据持久化。

## 功能特性

- 📝 富文本编辑器，支持多种块类型（标题、段落、列表、引用、代码等）
- 📄 多页面管理
- 🔄 拖拽重新排序块
- 💾 SQLite 数据库持久化存储
- 🖥️ 桌面应用支持（Electron）
- 🌐 浏览器支持（localStorage 回退）
- ⚡ 实时保存
- 🎨 现代化 UI 设计

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS
- **桌面应用**: Electron
- **数据库**: Better SQLite3
- **构建工具**: Vite
- **图标**: Lucide React

## 安装和运行

### 开发模式

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 在另一个终端启动 Electron 应用：
```bash
npm run electron-dev
```

### 生产构建

1. 构建应用：
```bash
npm run electron-build
```

2. 构建完成后，可执行文件将在 `dist-electron` 目录中。

## 数据库

### SQLite 数据库（Electron 模式）

在 Electron 模式下，应用使用 SQLite 数据库进行数据存储：

- **数据库文件位置**: `%APPDATA%/notion-clone/notion-clone.db` (Windows)
- **表结构**:
  - `pages`: 存储页面信息
  - `blocks`: 存储块内容，通过外键关联到页面

### localStorage 回退（浏览器模式）

在浏览器模式下，应用自动回退到 localStorage 存储。

## 项目结构

```
src/
├── components/          # React 组件
│   ├── BlockEditor.tsx  # 块编辑器
│   ├── BlockTypeSelector.tsx # 块类型选择器
│   ├── Editor.tsx       # 主编辑器
│   └── Sidebar.tsx      # 侧边栏
├── context/             # React Context
│   ├── NotionContext.tsx # 主状态管理
│   └── useNotion.ts     # 自定义 Hook
├── services/            # 服务层
│   └── database.ts      # 数据库服务
└── types/               # TypeScript 类型定义
    ├── index.ts         # 主要类型
    └── database.ts      # 数据库类型

electron/
├── main.js              # Electron 主进程
└── preload.js           # 预加载脚本
```

## 使用说明

1. **创建页面**: 点击侧边栏的 "+" 按钮或使用输入框创建新页面
2. **编辑内容**: 点击页面标题或块内容进行编辑
3. **添加块**: 按 Enter 键创建新块，或使用 "/" 命令选择块类型
4. **删除块**: 清空块内容后按 Backspace 键删除
5. **重新排序**: 拖拽块左侧的拖拽手柄重新排序
6. **删除页面**: 点击页面右侧的菜单按钮选择删除

## 开发说明

### 数据库操作

所有数据库操作都通过 `src/services/database.ts` 中的服务进行：

- `pageService`: 页面相关操作
- `blockService`: 块相关操作

### 状态管理

使用 React Context + useReducer 进行状态管理，所有状态变更都会自动同步到数据库。

### 异步操作

所有数据库操作都是异步的，确保在 Electron 和浏览器环境中都能正常工作。

## 许可证

MIT License 