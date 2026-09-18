import React, { useState, useMemo } from 'react'
import { 
  Layers, Search, X, CheckCircle2, Wrench, FileCode, Bot, 
  ChevronRight, ArrowRight, CornerDownRight, Zap, Hash
} from 'lucide-react'
import clsx from 'clsx'
import { AppTheme, THEME_STYLES } from '../theme'
import { sanitizePrompt } from '../utils/promptSanitizer'

export interface ConversationTurn {
  turnIndex: number
  turnId: string
  userText: string
  assistantText: string
  thinking?: string
  tools: any[]
  subagents: any[]
  modifiedFiles: string[]
  readFiles: string[]
  timestamp: number
  summary: string
  messages: any[]
}

interface TurnOutlineProps {
  turns: ConversationTurn[]
  currentTurnIndex: number
  theme: AppTheme
  onSelectTurn: (turnIndex: number) => void
  onClose: () => void
  viewMode: 'stream' | 'card'
  onToggleViewMode: () => void
}

export const TurnOutline: React.FC<TurnOutlineProps> = ({
  turns,
  currentTurnIndex,
  theme,
  onSelectTurn,
  onClose,
  viewMode,
  onToggleViewMode
}) => {
  const t = THEME_STYLES[theme]
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'has_tools' | 'has_files'>('all')

  const turnsList = turns || []
  const filteredTurns = useMemo(() => {
    return turnsList.filter(turn => {
      const tools = turn.tools || []
      const files = turn.modifiedFiles || []
      if (filterType === 'has_tools' && tools.length === 0) return false
      if (filterType === 'has_files' && files.length === 0) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        (turn.summary || '').toLowerCase().includes(q) ||
        (turn.userText || '').toLowerCase().includes(q) ||
        files.some(f => f.toLowerCase().includes(q)) ||
        tools.some(tool => (tool?.name || '').toLowerCase().includes(q))
      )
    })
  }, [turnsList, searchQuery, filterType])

  return (
    <div className={clsx(
      "w-80 flex-shrink-0 flex flex-col border-l transition-all duration-200 select-none",
      t.bgSidebar,
      t.border
    )}>
      {/* Header */}
      <div className={clsx("p-3.5 border-b flex items-center justify-between", t.border)}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className={clsx("text-xs font-semibold tracking-wide flex items-center gap-1.5", t.textPrimary)}>
              会话轮次大纲
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono">
                {turns.length} 轮
              </span>
            </h3>
            <p className={clsx("text-[10px]", t.textMuted)}>
              CC-Switch 敏捷导航与索引
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={clsx("p-1.5 rounded-lg transition-colors", t.buttonGhost)}
          title="关闭大纲"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switch & Fast Filter */}
      <div className={clsx("p-2.5 border-b space-y-2", t.border)}>
        {/* Search input */}
        <div className="relative">
          <Search className={clsx("w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2", t.textMuted)} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="检索提问、工具或修改文件..."
            className={clsx(
              "w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border outline-none transition-all placeholder:text-zinc-500",
              t.inputBg,
              t.border
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={clsx(
              "flex-1 py-1 text-[11px] rounded-md transition-all font-medium text-center",
              filterType === 'all' ? t.badgeActive : t.badgeInactive
            )}
          >
            全部 ({turns.length})
          </button>
          <button
            onClick={() => setFilterType('has_tools')}
            className={clsx(
              "flex-1 py-1 text-[11px] rounded-md transition-all font-medium text-center",
              filterType === 'has_tools' ? t.badgeActive : t.badgeInactive
            )}
          >
            含工具
          </button>
          <button
            onClick={() => setFilterType('has_files')}
            className={clsx(
              "flex-1 py-1 text-[11px] rounded-md transition-all font-medium text-center",
              filterType === 'has_files' ? t.badgeActive : t.badgeInactive
            )}
          >
            改代码
          </button>
        </div>
      </div>

      {/* Turn list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {filteredTurns.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-500">
            无匹配的交互轮次
          </div>
        ) : (
          filteredTurns.map((turn) => {
            const isActive = turn.turnIndex === currentTurnIndex
            return (
              <div
                key={turn.turnId}
                onClick={() => onSelectTurn(turn.turnIndex)}
                className={clsx(
                  "p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 group relative",
                  isActive ? t.cardActive : t.cardNormal
                )}
              >
                {/* Active Indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full shadow-sm shadow-indigo-500/50" />
                )}

                <div className="flex items-center justify-between gap-1.5 mb-1 pl-1">
                  <div className="flex items-center gap-1.5">
                    <span className={clsx(
                      "text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded",
                      isActive ? "bg-indigo-500 text-white" : "bg-zinc-800/60 text-zinc-400 group-hover:text-zinc-200"
                    )}>
                      #{turn.turnIndex}
                    </span>
                    <span className={clsx("text-[10px]", t.textMuted)}>
                      {turn.messages.length} 消息
                    </span>
                  </div>
                  {turn.timestamp && (
                    <span className={clsx("text-[9px] font-mono", t.textMuted)}>
                      {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {/* Prompt Summary */}
                <p className={clsx(
                  "text-xs leading-snug line-clamp-2 pl-1 mb-2 font-medium",
                  isActive ? t.textPrimary : t.textSecondary
                )}>
                  {sanitizePrompt(turn.summary || turn.userText || '').cleanText.slice(0, 80) || turn.summary}
                </p>

                {/* Badges footer */}
                <div className="flex items-center flex-wrap gap-1 pl-1">
                  {turn.tools.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                      <Wrench className="w-2.5 h-2.5" />
                      {turn.tools.length} 工具
                    </span>
                  )}
                  {turn.modifiedFiles.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                      <FileCode className="w-2.5 h-2.5" />
                      {turn.modifiedFiles.length} 文件
                    </span>
                  )}
                  {turn.subagents.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">
                      <Bot className="w-2.5 h-2.5" />
                      {turn.subagents.length} Agent
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer Mode info */}
      <div className={clsx("p-2.5 border-t flex items-center justify-between text-[11px]", t.border)}>
        <span className={clsx(t.textMuted)}>视图模式:</span>
        <button
          onClick={onToggleViewMode}
          className={clsx(
            "px-2.5 py-1 rounded-lg border font-medium transition-all text-xs flex items-center gap-1.5",
            viewMode === 'card' ? "bg-indigo-600 text-white border-indigo-500" : t.buttonSecondary
          )}
        >
          {viewMode === 'card' ? '轮次卡片模式' : '连续流式模式'}
        </button>
      </div>
    </div>
  )
}
