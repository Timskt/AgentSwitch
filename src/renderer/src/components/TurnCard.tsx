import React, { useState } from 'react'
import { 
  User, Bot, FileCode, Check, Copy, ChevronDown, ChevronRight, 
  Clock, FolderOpen, Terminal, Brain, Sliders, FileText
} from 'lucide-react'
import clsx from 'clsx'
import { MarkdownRenderer } from './MarkdownRenderer'
import { AppTheme, THEME_STYLES } from '../theme'
import { ConversationTurn } from './TurnOutline'
import { sanitizePrompt } from '../utils/promptSanitizer'

interface TurnCardProps {
  turn: ConversationTurn
  totalTurns: number
  theme: AppTheme
  onOpenInFolder: (path: string) => void
  onFullScreenCode: (code: string, language: string) => void
  onImageClick: (src: string) => void
  onNextTurn?: () => void
  onPrevTurn?: () => void
  isFocused?: boolean
}

export const TurnCard: React.FC<TurnCardProps> = ({
  turn,
  totalTurns,
  theme,
  onOpenInFolder,
  onFullScreenCode,
  onImageClick,
  onNextTurn,
  onPrevTurn,
  isFocused = false
}) => {
  const t = THEME_STYLES[theme]
  const tools = turn?.tools || []
  const modifiedFiles = turn?.modifiedFiles || []
  const subagents = turn?.subagents || []

  const sanitized = sanitizePrompt(turn?.userText || '')
  const [toolsExpanded, setToolsExpanded] = useState(false)
  const [thinkingExpanded, setThinkingExpanded] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedResponse, setCopiedResponse] = useState(false)

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(sanitized.cleanText || turn.userText)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 1800)
  }

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(turn.assistantText)
    setCopiedResponse(true)
    setTimeout(() => setCopiedResponse(false), 1800)
  }

  return (
    <div 
      id={`turn-card-${turn.turnIndex}`}
      className={clsx(
        "rounded-xl border transition-all duration-150 mb-6 overflow-hidden shadow-xs",
        isFocused ? "border-zinc-700/80 shadow-sm" : t.border,
        t.cardNormal
      )}
    >
      {/* Turn Top Toolbar */}
      <div className={clsx(
        "px-4 py-2 border-b flex items-center justify-between text-xs",
        t.border,
        "bg-zinc-500/[0.03]"
      )}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/70 text-zinc-300 font-mono font-medium text-[11px]">
            第 {turn.turnIndex} / {totalTurns} 轮
          </span>
          <span className={clsx("text-[11px] flex items-center gap-1 font-mono", t.textMuted)}>
            <Clock className="w-3 h-3 text-zinc-500" />
            {new Date(turn.timestamp).toLocaleString([], { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {tools.length > 0 && (
            <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
              <Terminal className="w-3 h-3 text-zinc-500" />
              {tools.length} 次工具
            </span>
          )}
          {modifiedFiles.length > 0 && (
            <span className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1">
              <FileCode className="w-3 h-3" />
              {modifiedFiles.length} 修改
            </span>
          )}
          {subagents.length > 0 && (
            <span className="text-[11px] text-purple-400/90 font-mono flex items-center gap-1">
              <Bot className="w-3 h-3" />
              {subagents.length} Agent
            </span>
          )}
        </div>
      </div>

      {/* 1. User Prompt Section */}
      <div className="p-4 border-b border-zinc-800/40">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/40">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 flex items-center gap-1.5">
              <User className="w-3 h-3 text-zinc-400" />
              User
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Turn #{turn.turnIndex}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {sanitized.hasEnvelopes && (
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="text-[10px] px-2 py-0.5 rounded border border-zinc-700/60 bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 font-mono"
                title="展开/收起包装的系统环境上下文"
              >
                <Sliders className="w-3 h-3 text-zinc-400" />
                <span>{showMetadata ? '隐藏环境元数据' : '环境元数据'}</span>
                <ChevronDown className={clsx("w-3 h-3 transition-transform", showMetadata && "rotate-180")} />
              </button>
            )}

            <button
              onClick={handleCopyPrompt}
              className="text-[11px] px-2 py-0.5 rounded border border-zinc-700/60 bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
              title="复制该轮用户指令"
            >
              {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPrompt ? '已复制' : '复制指令'}</span>
            </button>
          </div>
        </div>

        <div className={clsx("text-sm leading-relaxed", t.textPrimary)}>
          <MarkdownRenderer 
            content={sanitized.cleanText || '(空用户指令)'} 
            theme={theme}
            onOpenInFolder={onOpenInFolder}
            onFullScreenCode={onFullScreenCode}
            onImageClick={onImageClick}
          />
        </div>

        {/* Collapsible System Envelopes & Context Metadata */}
        {showMetadata && (sanitized.contextSummary || sanitized.metadata || sanitized.systemMessage) && (
          <div className="mt-3 p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs space-y-2.5 font-sans">
            {sanitized.contextSummary && (
              <div>
                <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span>上下文摘要 (Context Summary)</span>
                </div>
                <div className="text-zinc-300 text-xs leading-relaxed bg-zinc-900/70 p-2.5 rounded border border-zinc-800 whitespace-pre-wrap font-sans">
                  {sanitized.contextSummary}
                </div>
              </div>
            )}
            {sanitized.metadata && (
              <div>
                <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-amber-400" />
                  <span>运行时元数据 (Runtime Metadata)</span>
                </div>
                <pre className="text-zinc-400 font-mono text-[11px] leading-relaxed bg-zinc-900/70 p-2.5 rounded border border-zinc-800 whitespace-pre-wrap overflow-x-auto">
                  {sanitized.metadata}
                </pre>
              </div>
            )}
            {sanitized.systemMessage && (
              <div>
                <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Bot className="w-3 h-3 text-emerald-400" />
                  <span>附带系统消息 (System Message)</span>
                </div>
                <pre className="text-zinc-400 font-mono text-[11px] leading-relaxed bg-zinc-900/70 p-2.5 rounded border border-zinc-800 whitespace-pre-wrap overflow-x-auto">
                  {sanitized.systemMessage}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Execution Traces (Tools, Subagents, Thinking) */}
      {(tools.length > 0 || turn.thinking || subagents.length > 0) && (
        <div className={clsx("px-4 py-2.5 border-b bg-zinc-500/[0.03] space-y-2", t.border)}>
          {/* Thinking Accordion if exists */}
          {turn.thinking && (
            <div className={clsx("rounded-lg border overflow-hidden", t.border)}>
              <button
                onClick={() => setThinkingExpanded(!thinkingExpanded)}
                className={clsx(
                  "w-full px-3 py-2 text-xs flex items-center justify-between font-medium transition-colors text-left",
                  t.buttonGhost
                )}
              >
                <div className="flex items-center gap-2 text-zinc-300">
                  <Brain className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-mono text-xs">思考过程 (Thinking Process)</span>
                </div>
                {thinkingExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
              </button>
              {thinkingExpanded && (
                <div className={clsx("p-3 text-xs leading-relaxed border-t font-mono bg-zinc-950/50", t.border, t.textSecondary)}>
                  <pre className="whitespace-pre-wrap font-sans text-xs">{turn.thinking}</pre>
                </div>
              )}
            </div>
          )}

          {/* Tools & Subagents Summary Bar */}
          {(tools.length > 0 || subagents.length > 0) && (
            <div className={clsx("rounded-lg border overflow-hidden", t.border)}>
              <button
                onClick={() => setToolsExpanded(!toolsExpanded)}
                className={clsx(
                  "w-full px-3 py-2 text-xs flex items-center justify-between font-medium transition-colors text-left",
                  t.buttonGhost
                )}
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  <span className={clsx(t.textSecondary)}>
                    工具调用 <strong className="text-zinc-200 font-mono font-medium">{tools.length}</strong>
                    {modifiedFiles.length > 0 && (
                      <> · 修改文件 <strong className="text-emerald-400 font-mono font-medium">{modifiedFiles.length}</strong></>
                    )}
                    {subagents.length > 0 && (
                      <> · 子任务 Agent <strong className="text-purple-400 font-mono font-medium">{subagents.length}</strong></>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                  <span>{toolsExpanded ? '收起' : '展开'}</span>
                  {toolsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </div>
              </button>

              {/* Tools Detail Accordion */}
              {toolsExpanded && (
                <div className={clsx("p-3 border-t space-y-2.5 bg-zinc-950/50", t.border)}>
                  {/* Modified Files Chips */}
                  {modifiedFiles.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-emerald-400/90 flex items-center gap-1">
                        <FileCode className="w-3 h-3" />
                        <span>本轮变更文件：</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {modifiedFiles.map((fp, i) => (
                          <div 
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono"
                          >
                            <span className="truncate max-w-[280px]">{fp}</span>
                            <button
                              onClick={() => onOpenInFolder(fp)}
                              className="text-emerald-400 hover:text-emerald-200 transition-colors p-0.5"
                              title="在 Finder 中显示"
                            >
                              <FolderOpen className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool Call Log Items */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                      <Terminal className="w-3 h-3" />
                      <span>工具执行细节：</span>
                    </div>
                    {tools.slice(0, 15).map((tool, idx) => (
                      <div 
                        key={idx}
                        className={clsx("p-2 rounded border text-xs font-mono bg-zinc-900/60", t.border)}
                      >
                        <div className="flex items-center justify-between text-zinc-200 mb-1">
                          <span className="font-semibold text-sky-400">{tool.name}</span>
                          <span className="text-[10px] text-zinc-500">#{idx + 1}</span>
                        </div>
                        {tool.args && (
                          <pre className="text-[11px] text-zinc-400 overflow-x-auto p-1.5 rounded bg-black/40">
                            {typeof tool.args === 'string' ? tool.args : JSON.stringify(tool.args, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                    {tools.length > 15 && (
                      <div className="text-center text-[11px] text-zinc-500 py-1">
                        已省略剩余 {tools.length - 15} 项细分工具调用
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Assistant Output Section */}
      <div className="p-4">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/40">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 flex items-center gap-1.5">
              <Bot className="w-3 h-3 text-zinc-400" />
              Assistant
            </span>
          </div>

          <button
            onClick={handleCopyResponse}
            className="text-[11px] px-2 py-0.5 rounded border border-zinc-700/60 bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
            title="复制回复内容"
          >
            {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedResponse ? '已复制' : '复制回复'}</span>
          </button>
        </div>

        <div className={clsx("text-sm leading-relaxed", t.textPrimary)}>
          <MarkdownRenderer 
            content={turn.assistantText || '(本轮无额外文本交付，主要为底层工具执行)'} 
            theme={theme}
            onOpenInFolder={onOpenInFolder}
            onFullScreenCode={onFullScreenCode}
            onImageClick={onImageClick}
          />
        </div>
      </div>

      {/* 4. Bottom Quick Nav (If more turns ahead) */}
      {onNextTurn && turn.turnIndex < totalTurns && (
        <div className="px-4 py-2.5 border-t border-zinc-800/40 bg-zinc-500/[0.02] flex items-center justify-between text-xs">
          <span className="text-[11px] text-zinc-500 font-mono">
            {turn.turnIndex} / {totalTurns} 轮
          </span>
          <button
            onClick={onNextTurn}
            className="px-3 py-1 rounded-lg border border-zinc-700/60 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <span>进入下一轮</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 font-mono text-zinc-400">⌥↓</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
