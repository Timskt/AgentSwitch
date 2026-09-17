<p align="center">
  <img src="docs/images/logo.png" width="96" height="96" alt="AgentSwitch Logo" />
</p>

<h1 align="center">AgentSwitch (灵跃中枢)</h1>

<p align="center">
  <strong>全生态 AI 编码 Agent 会话雷达、记忆中枢与跨平台格式转换工坊</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Electron-39-teal?style=flat-square" alt="Electron" />
  <img src="https://img.shields.io/badge/React-19-cyan?style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-indigo?style=flat-square" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## 🌟 核心特性 (Features)

### 1. 🧭 本地全生态 Agent 雷达 (Local Agent Radar)
- **零配置多源探测**：开箱即用自动侦测本机已安装的 AI Coding Agent 生态：
  - 🔵 **ZCode** (本地 SQLite 历史与会话拓扑)
  - 🟣 **Google Antigravity (反重力)** (`~/.gemini/antigravity/brain/*/`)
  - 🟠 **Claude Code** (`~/.claude/projects/` & `history.jsonl`)
  - 🟢 **OpenAI Codex** (`~/.codex/sessions/` & `session_index.jsonl`)
  - 🔴 **OpenCode**
- **统一生态视图**：一键在「全部生态」或单个 Agent 过滤切换，汇聚所有历史开发会话。

### 2. 🗂️ 交互回合架构与轮次大纲 (Turn-based Architecture)
- **大纲导航目录 (`⌘O`)**：右侧快捷大纲快速定位每个会话交互回合，即时显示工具调用徽标、代码修改标记，支持轮次关键词筛选。
- **轮次卡片模式 (`⌥↑` / `⌥↓`)**：参考 CC-Switch 理念打造，单轮聚焦展现，折叠工具输入输出、Subagent 派生调用与思考链（Thinking），免受无限下拉长列表困扰。
- **连续流式模式**：保留经典沉浸式聊天体验，两种模式随心无缝切换。

### 3. 🔄 跨生态记忆迁移与导出 (Universal Export Engine)
- **跨平台多目标格式**：
  - 导出至 **Claude Code** (格式化会话脚本与上下文 Prompt)
  - 导出至 **OpenAI Codex** (CLI 自动化执行上下文)
  - 导出至 **Antigravity 原生** (`transcript.jsonl` 结构化日志)
  - 导出至 **OpenCode / Pi / 通用 Markdown / 纯文本**
- **智能脱敏与过滤**：支持去除内部工具调试冗余、敏感路径脱敏、保留关键代码差异。

### 4. 🎨 极致打磨的桌面体验
- **4 种精心调色主题**：黑曜石深邃 (Obsidian Dark)、暗夜湛蓝 (Midnight Blue)、暖石原木 (Solar Warm)、凝雪亮白 (Polar Light)。
- **全屏代码查看器**：多语言语法高亮、代码一键复制、行号索引。
- **图片画廊 Lightbox**：会话中交互图片、设计图的原生放大预览。

---

## 📸 界面预览 (Screenshots)

### 🗂️ 轮次卡片模式 (Turn Card Mode)
![Turn Card Mode](docs/images/preview_card_mode.png)

### 📑 轮次大纲与多生态雷达 (Turn Outline & Radar)
![Turn Outline](docs/images/preview_turn_outline.png)

---

## ⌨️ 快捷键速查 (Keyboard Shortcuts)

| 快捷键 | 功能说明 |
|:---|:---|
| `⌘O` / `Ctrl+O` | 打开 / 折叠右侧轮次大纲 (Turn Outline) |
| `⌥↑` / `Alt+↑` | 切换至上一交互轮次 (Previous Turn) |
| `⌥↓` / `Alt+↓` | 切换至下一交互轮次 (Next Turn) |
| `Esc` | 关闭全屏代码弹窗 / 关闭图片预览 |

---

## 🚀 快速开始 (Getting Started)

### 依赖环境
- Node.js >= 20.x
- pnpm >= 9.x

### 安装与本地运行

```bash
# 1. 克隆代码仓库
git clone https://github.com/Timskt/AgentSwitch.git
cd AgentSwitch

# 2. 安装项目依赖
pnpm install

# 3. 启动开发模式
pnpm run dev
```

### 本地打包构建

```bash
# 检查 TypeScript 类型并编译产物
pnpm run build

# 打包 macOS 桌面应用 (.app / .dmg / .zip)
pnpm run build:mac

# 打包 Windows 安装程序 (.exe)
pnpm run build:win

# 打包 Linux 应用 (.AppImage / .deb)
pnpm run build:linux
```

---

## 📦 自动化发布 (CI/CD Release)

本项目配置了 GitHub Actions 全自动化跨平台构建工作流（`.github/workflows/release.yml`）：
- **触发机制**：仅在推送符合版本规范的 Tag（如 `v1.0.0`、`v2.5.0` 等）时触发，**普通代码提交不会触发打包**。
- **构建矩阵**：并发在 `macos-latest`、`windows-latest`、`ubuntu-latest` 运行，打包全平台安装程序并自动发布至 GitHub Releases。

```bash
# 发布新版本示例
git tag v1.0.0
git push origin v1.0.0
```

---

## 📄 开源许可 (License)

[MIT License](LICENSE) © 2026 AgentSwitch Team
