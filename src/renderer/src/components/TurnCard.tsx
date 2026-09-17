import React, { useState } from 'react'
import { 
  User, Bot, Wrench, FileCode, Check, Copy, ChevronDown, ChevronRight, 
  Sparkles, Clock, ArrowUpRight, FolderOpen, Terminal, Code2, Brain
} from 'lucide-react'
import clsx from 'clsx'
import { MarkdownRenderer } from './MarkdownRenderer'
import { AppTheme, THEME_STYLES } from '../theme'
import { ConversationTurn } from './TurnOutline'

interface TurnCardProps {
  turn: ConversationTurn
  totalTurns: number
  theme: AppTheme
  onOpenInFolder: (path: string) => void
  onFullScreenCode: (code: string, language: string) => void
  onImageClick: (src: string) => void
  isFocused?: boolean
}

export const TurnCard: React.FC<TurnCardProps> = ({
  turn,
  totalTurns,
  theme,
  onOpenInFolder,
  onFullScreenCode,
  onImageClick,
  isFocused = false
}) => {
  const t = THEME_STYLES[theme]
  const tools = turn?.tools || []
  const modifiedFiles = turn?.modifiedFiles || []
  const subagents = turn?.subagents || []

  const [toolsExpanded, setToolsExpanded] = useState(false)
  const [thinkingExpanded, setThinkingExpanded] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedResponse, setCopiedResponse] = useState(false)

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(turn.userText)
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
        "rounded-2xl border transition-all duration-200 mb-6 overflow-hidden shadow-sm",
        isFocused ? "ring-2 ring-indigo-500/50 " + t.borderHover : t.border,
        t.cardNormal
      )}
    >
      {/* Turn Top Toolbar */}
      <div className={clsx(
        "px-4 py-2.5 border-b flex items-center justify-between text-xs",
        t.border,
        "bg-zinc-500/5"
      )}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono font-bold text-[11px] border border-indigo-500/20">
            回合 #{turn.turnIndex} / {totalTurns}
          </span>
          <span className={clsx("text-[11px] flex items-center gap-1", t.textMuted)}>
            <Clock className="w-3 h-3" />
            {new Date(turn.timestamp).toLocaleString([], { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {tools.length > 0 && (
            <span className="text-[11px] text-blue-400 font-mono flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              {tools.length} 次工具
            </span>
          )}
          {modifiedFiles.length > 0 && (
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <FileCode className="w-3 h-3" />
              {modifiedFiles.length} 修改
            </span>
          )}
          <button
            onClick={handleCopyPrompt}
            className={clsx(
              "px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all",
              t.buttonGhost
            )}
            title="复制该轮提问"
          >
            {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedPrompt ? '已复制' : '复制诉求'}</span>
          </button>
        </div>
      </div>

      {/* 1. User Prompt Section */}
      <div className="p-4 border-b border-zinc-800/40 bg-zinc-500/[0.02]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5 shadow-sm">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className={clsx("text-xs font-semibold tracking-wide", t.textPrimary)}>
                用户指令 (User Prompt)
              </span>
            </div>
            <div className={clsx("text-sm leading-relaxed", t.textPrimary)}>
              <MarkdownRenderer 
                content={turn.userText} 
                theme={theme}
                onOpenInFolder={onOpenInFolder}
                onFullScreenCode={onFullScreenCode}
                onImageClick={onImageClick}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Execution Traces (Tools, Subagents, Thinking) */}
      {(tools.length > 0 || turn.thinking || subagents.length > 0) && (
        <div className={clsx("px-4 py-2 border-b bg-zinc-500/[0.04] space-y-2", t.border)}>
          {/* Thinking Accordion if exists */}
          {turn.thinking && (
            <div className={clsx("rounded-xl border overflow-hidden", t.border)}>
              <button
                onClick={() => setThinkingExpanded(!thinkingExpanded)}
                className={clsx(
                  "w-full px-3 py-2 text-xs flex items-center justify-between font-medium transition-colors text-left",
                  t.buttonGhost
                )}
              >
                <div className="flex items-center gap-2 text-purple-400">
                  <Brain className="w-3.5 h-3.5" />
                  <span>深度思维链 (Thinking Process)</span>
                </div>
                {thinkingExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
              </button>
              {thinkingExpanded && (
                <div className={clsx("p-3 text-xs leading-relaxed border-t font-mono bg-zinc-950/40", t.border, t.textSecondary)}>
                  <pre className="whitespace-pre-wrap font-sans text-xs">{turn.thinking}</pre>
                </div>
              )}
            </div>
          )}

          {/* Tools & Subagents Summary Bar */}
          {(tools.length > 0 || subagents.length > 0) && (
            <div className={clsx("rounded-xl border overflow-hidden", t.border)}>
              <button
                onClick={() => setToolsExpanded(!toolsExpanded)}
                className={clsx(
                  "w-full px-3 py-2 text-xs flex items-center justify-between font-medium transition-colors text-left",
                  t.buttonGhost
                )}
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-blue-400" />
                  <span className={clsx(t.textSecondary)}>
                    执行了 <strong className="text-blue-400">{tools.length}</strong> 次工具调用
                    {modifiedFiles.length > 0 && (
                      <> · 修改了 <strong className="text-emerald-400">{modifiedFiles.length}</strong> 个文件</>
                    )}
                    {subagents.length > 0 && (
                      <> · 派发了 <strong className="text-purple-400">{subagents.length}</strong> 个子任务 Agent</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-[11px]">{toolsExpanded ? '收起详情' : '展开执行链'}</span>
                  {toolsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Tools Detail Accordion */}
              {toolsExpanded && (
                <div className={clsx("p-3 border-t space-y-2.5 bg-zinc-950/40", t.border)}>
                  {/* Modified Files Chips */}
                  {modifiedFiles.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                        <FileCode className="w-3 h-3" />
                        <span>本回合变更的文件：</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {modifiedFiles.map((fp, i) => (
                          <div 
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono"
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
                        className={clsx("p-2 rounded-lg border text-xs font-mono bg-zinc-900/60", t.border)}
                      >
                        <div className="flex items-center justify-between text-blue-300 mb-1">
                          <span className="font-semibold">{tool.name}</span>
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
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5 shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className={clsx("text-xs font-semibold tracking-wide flex items-center gap-1.5", t.textPrimary)}>
                <span>模型交付结果</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 font-mono">
                  Assistant
                </span>
              </span>
              <button
                onClick={handleCopyResponse}
                className={clsx(
                  "px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all",
                  t.buttonGhost
                )}
                title="复制模型答复"
              >
                {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedResponse ? '已复制' : '复制答复'}</span>
              </button>
            </div>

            <div className={clsx("text-sm leading-relaxed", t.textPrimary)}>
              <MarkdownRenderer 
                content={turn.assistantText || '(该回合模型无额外文本交付，主要为底层工具执行)'} 
                theme={theme}
                onOpenInFolder={onOpenInFolder}
                onFullScreenCode={onFullScreenCode}
                onImageClick={onImageClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
