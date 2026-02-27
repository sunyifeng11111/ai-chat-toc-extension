# AI Chat TOC

一个 Chrome 扩展，为多家 AI 对话网站提供「用户提问目录」侧边栏，支持快速定位、滚动跳转与星标收藏。

## 当前版本

- `v0.1.0`

## 功能

- 自动提取会话中的用户提问并生成目录
- 点击目录项平滑跳转并高亮目标消息
- 支持星标收藏，按会话 URL 隔离存储
- 目录支持折叠、自动高亮当前可视位置
- 支持站点：ChatGPT、Claude、Gemini、Qwen、Kimi、Yuanbao

## 安装（开发者模式）

1. 打开 `chrome://extensions`
2. 启用“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择项目目录：`/Users/sun/Code/ai-chat-toc-extension`

## 项目结构

- `manifest.json`：扩展配置
- `src/content/`：内容脚本（解析、面板、样式、存储）
- `src/background/`：后台 service worker
- `assets/icons/`：扩展图标
- `test/manual-checklist.md`：手动回归清单

## 发布说明（首发）

`v0.1.0` 为初始可用版本，包含核心目录导航与星标能力。
