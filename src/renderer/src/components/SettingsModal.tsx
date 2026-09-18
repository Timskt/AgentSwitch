import React, { useState } from 'react'
import { 
  X, Palette, Database, Sparkles, RefreshCw, Check, 
  ExternalLink, Download, FolderOpen, Shield, Bell, CheckCircle2, Info
} from 'lucide-react'
import clsx from 'clsx'

export type AppTheme = 'obsidian' | 'midnight' | 'solar' | 'light'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  currentTheme: AppTheme
  onThemeChange: (theme: AppTheme) => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  dbPath?: string
  onSelectCustomDb: () => void
  onRefreshDb: () => void
}

export function SettingsModal({
  open,
  onClose,
  currentTheme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  dbPath,
  onSelectCustomDb,
  onRefreshDb
}: SettingsModalProps) {
  const [tab, setTab] = useState<'appearance' | 'database' | 'update' | 'about'>('appearance')
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateResult, setUpdateResult] = useState<any>(null)
  const [autoCheckUpdate, setAutoCheckUpdate] = useState(true)

  if (!open) return null

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true)
    // @ts-ignore
    const res = await window.api.checkForUpdates()
    setTimeout(() => {
      setUpdateResult(res)
      setCheckingUpdate(false)
    }, 600)
  }

  const themes: { id: AppTheme, name: string, desc: string, bg: string, border: string }[] = [
    {
      id: 'obsidian',
      name: '黑曜石 (Obsidian Dark)',
      desc: '默认高阶极客深色，深邃护眼且层次分明',
      bg: 'bg-[#09090b]',
      border: 'border-zinc-700'
    },
    {
      id: 'midnight',
      name: '午夜极客 (Midnight Cyber)',
      desc: '冷萃灰与石墨底色，对标 Linear / Zed 美学',
      bg: 'bg-[#0f1117]',
      border: 'border-slate-700'
    },
    {
      id: 'solar',
      name: '暖灰木炭 (Solar Charcoal)',
      desc: '温暖柔和的暗炭灰阶，极大缓解视觉疲劳',
      bg: 'bg-[#181615]',
      border: 'border-amber-900/40'
    },
    {
      id: 'light',
      name: '纸白极简 (Clean Light)',
      desc: 'macOS 雅致高对比度浅色模式，白天阅读清晰自然',
      bg: 'bg-[#f8fafc]',
      border: 'border-slate-300'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#18181b]">
          <div className="flex items-center space-x-2.5">
            <Palette className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-zinc-100">系统偏好设置 (Settings)</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="flex border-b border-zinc-800 bg-zinc-900 px-6 space-x-6 text-xs font-medium">
          <button
            onClick={() => setTab('appearance')}
            className={clsx("py-2.5 border-b-2 transition-colors flex items-center gap-1.5", tab === 'appearance' ? "border-indigo-500 text-zinc-100" : "border-transparent text-zinc-400 hover:text-zinc-200")}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>外观与主题</span>
          </button>
          <button
            onClick={() => setTab('database')}
            className={clsx("py-2.5 border-b-2 transition-colors flex items-center gap-1.5", tab === 'database' ? "border-indigo-500 text-zinc-100" : "border-transparent text-zinc-400 hover:text-zinc-200")}
          >
            <Database className="w-3.5 h-3.5" />
            <span>本地数据库</span>
          </button>
          <button
            onClick={() => setTab('update')}
            className={clsx("py-2.5 border-b-2 transition-colors flex items-center gap-1.5", tab === 'update' ? "border-indigo-500 text-zinc-100" : "border-transparent text-zinc-400 hover:text-zinc-200")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>自动更新</span>
          </button>
          <button
            onClick={() => setTab('about')}
            className={clsx("py-2.5 border-b-2 transition-colors flex items-center gap-1.5", tab === 'about' ? "border-indigo-500 text-zinc-100" : "border-transparent text-zinc-400 hover:text-zinc-200")}
          >
            <Info className="w-3.5 h-3.5" />
            <span>关于</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs custom-scrollbar">
          {/* Tab 1: Appearance */}
          {tab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-zinc-200 block mb-2">多皮肤主题选择</label>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map(t => {
                    const isSelected = currentTheme === t.id
                    return (
                      <div
                        key={t.id}
                        onClick={() => onThemeChange(t.id)}
                        className={clsx(
                          "p-3 rounded-xl cursor-pointer border transition-all text-left relative",
                          isSelected ? "border-indigo-500 bg-zinc-800/80 shadow-sm" : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-zinc-200 text-xs">{t.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{t.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <label className="text-xs font-semibold text-zinc-200 block mb-2">字号大小设定</label>
                <div className="flex items-center space-x-3">
                  {[12, 13, 14, 15].map(sz => (
                    <button
                      key={sz}
                      onClick={() => onFontSizeChange(sz)}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                        fontSize === sz ? "bg-indigo-600 border-indigo-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      )}
                    >
                      {sz}px {sz === 13 ? '(默认推荐)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Database */}
          {tab === 'database' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-200 block mb-1.5">ZCode SQLite 存储位置</label>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-[11px] text-zinc-300 break-all leading-relaxed">
                  {dbPath || '~/.zcode/cli/db/db.sqlite'}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={onSelectCustomDb}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 border border-zinc-700"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>指定自定义 SQLite 备份文件...</span>
                </button>
                <button
                  onClick={onRefreshDb}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 border border-zinc-700"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>重新扫描数据库</span>
                </button>
              </div>

              <div className="p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-[11px] text-zinc-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span><strong>说明</strong>：系统默认只读连接当前用户的 ZCode 存储。如果您将旧电脑、外接硬盘或团队历史备份迁移到了其它文件夹，可以直接指定该路径进行分析与导出。</span>
              </div>
            </div>
          )}

          {/* Tab 3: Update */}
          {tab === 'update' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-100 text-xs">当前版本：v2.2.0 (Build 2026.09.17)</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">跨平台 Electron + React + SQLite 生产就绪发行版</p>
                </div>
                <button
                  onClick={handleCheckUpdate}
                  disabled={checkingUpdate}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  {checkingUpdate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>{checkingUpdate ? '检查中...' : '检查最新版本'}</span>
                </button>
              </div>

              {updateResult && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>您已在使用最新版本 (v{updateResult.latestVersion})</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">
                    {updateResult.releaseNotes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                <div>
                  <span className="font-medium text-zinc-200 block text-xs">自动检测版本更新</span>
                  <span className="text-[11px] text-zinc-500">启动软件时自动检查 GitHub Release 通道</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoCheckUpdate}
                  onChange={e => setAutoCheckUpdate(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
          )}

          {/* Tab 4: About */}
          {tab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
                <h3 className="font-bold text-zinc-100 text-sm">OmniRelay v2.5 (灵跃中枢)</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  专为 AI Agent 研发者构建的全生态会话记忆中继与跨平台互转工作台。自动嗅探探测本机 ZCode、Antigravity、OpenCode、Claude Code、Codex 等主流 Agent，支持全平台格式无损双向互转与 AI 接力提示词生成。
                </p>
              </div>

              <div className="text-[11px] text-zinc-500 space-y-1">
                <div>引擎内核：Electron 39.8 + React 19 + TypeScript + Better-SQLite3</div>
                <div>界面框架：TailwindCSS v3.4 + Lucide Icons</div>
                <div>开源许可证：MIT License</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
