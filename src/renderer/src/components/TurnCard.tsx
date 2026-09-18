import React, { useState } from 'react'
import { 
  User, Bot, FileCode, Check, Copy, ChevronDown, ChevronRight, 
  Clock, FolderOpen, Terminal, Brain, Sliders, FileText, ExternalLink
} from 'lucide-react'
import clsx from 'clsx'
import { MarkdownRenderer } from './MarkdownRenderer'
import { AppTheme, THEME_STYLES } from '../theme'
import { ConversationTurn } from './TurnOutline'
import { sanitizePrompt } from '../utils/promptSanitizer'
import { translations, Locale } from '../i18n'

interface TurnCardProps {
  turn: ConversationTurn
  totalTurns: number
  theme: AppTheme
  locale?: Locale
  workspacePath?: string
  onOpenInFolder: (path: string) => void
  onFullScreenCode: (code: string, language: string) => void
  onPreviewFile?: (path: string) => void
  onImageClick: (src: string, alt?: string) => void
  onNextTurn?: () => void
  onPrevTurn?: () => void
  isFocused?: boolean
}

export const TurnCard: React.FC<TurnCardProps> = ({
  turn,
  totalTurns,
  theme,
  locale = 'zh-CN',
  workspacePath,
  onOpenInFolder,
  onFullScreenCode,
  onPreviewFile,
  onImageClick,
  onNextTurn,
  onPrevTurn,
  isFocused = false
}) => {
  const t = THEME_STYLES[theme] || THEME_STYLES.obsidian
  const i18n = translations[locale] || translations['zh-CN']
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

  const handleFileClick = (fp: string) => {
    if (onPreviewFile) {
      onPreviewFile(fp)
    } else {
      onOpenInFolder(fp)
    }
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
        t.isDark ? "bg-zinc-500/[0.03]" : "bg-slate-50/60"
      )}>
        <div className="flex items-center gap-2">
          <span className={clsx("px-2 py-0.5 rounded font-mono font-medium text-[11px] border", t.kbdBg)}>
            {i18n.view.turnDisplay.replace('{current}', String(turn.turnIndex)).replace('{total}', String(totalTurns))}
          </span>
          <span className={clsx("text-[11px] flex items-center gap-1 font-mono", t.textMuted)}>
            <Clock className={clsx("w-3 h-3", t.textMuted)} />
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
            <span className={clsx("text-[11px] font-mono flex items-center gap-1", t.textSecondary)}>
              <Terminal className={clsx("w-3 h-3", t.textMuted)} />
              {i18n.turn.toolsCalled.replace('{count}', String(tools.length))}
            </span>
          )}
          {modifiedFiles.length > 0 && (
            <span className={clsx("text-[11px] font-mono flex items-center gap-1", t.isDark ? "text-emerald-400/90" : "text-emerald-600")}>
              <FileCode className="w-3 h-3" />
              {i18n.turn.filesModified.replace('{count}', String(modifiedFiles.length))}
            </span>
          )}
        </div>
      </div>

      {/* 1. User Input Section */}
      <div className={clsx("p-4 border-b", t.border)}>
        <div className={clsx("flex items-center justify-between pb-2 mb-3 border-b", t.border)}>
          <div className="flex items-center gap-2">
            <span className={clsx("text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1.5", t.roleUserBadge)}>
              <User className="w-3 h-3 opacity-80" />
              {i18n.view.userRole}
            </span>
            <span className={clsx("text-[11px] font-mono", t.textMuted)}>Turn #{turn.turnIndex}</span>
          </div>

          <div className="flex items-center gap-2">
            {sanitized.hasEnvelopes && (
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className={clsx(
                  "text-[11px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1",
                  showMetadata 
                    ? (t.isDark ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300" : "bg-indigo-50 border-indigo-300 text-indigo-700") 
                    : t.buttonSecondary
                )}
                title={i18n.turn.envContext}
              >
                <Sliders className="w-3 h-3 opacity-80" />
                <span>{locale === 'en-US' ? 'Env' : '环境元数'}</span>
              </button>
            )}

            <button
              onClick={handleCopyPrompt}
              className={clsx("text-[11px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1", t.buttonSecondary)}
              title={locale === 'en-US' ? 'Copy prompt' : '复制真实用户指令'}
            >
              {copiedPrompt ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPrompt ? i18n.preview.copied : (locale === 'en-US' ? 'Copy Prompt' : '复制指令')}</span>
            </button>
          </div>
        </div>

        <div className={clsx("text-sm leading-relaxed", t.textPrimary)}>
          <MarkdownRenderer 
            content={sanitized.cleanText || i18n.view.emptyUserPrompt} 
            theme={theme}
            locale={locale}
            workspacePath={workspacePath}
            onOpenInFolder={onOpenInFolder}
            onFullScreenCode={onFullScreenCode}
            onPreviewFile={onPreviewFile}
            onImageClick={onImageClick}
          />
        </div>

        {/* Collapsible System Envelopes & Context Metadata */}
        {showMetadata && (sanitized.contextSummary || sanitized.metadata || sanitized.systemMessage) && (
          <div className={clsx("mt-3 p-3 rounded-lg border text-xs space-y-2.5 font-sans", t.subtleBoxBg, t.border)}>
            {sanitized.contextSummary && (
              <div>
                <div className={clsx("text-[10px] font-mono font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5", t.textMuted)}>
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span>{i18n.turn.contextSummary}</span>
                </div>
                <div className={clsx("text-xs leading-relaxed p-2.5 rounded border whitespace-pre-wrap font-sans", t.isDark ? "bg-zinc-900/70 border-zinc-800 text-zinc-300" : "bg-white border-slate-200 text-slate-700 shadow-2xs")}>
                  {sanitized.contextSummary}
                </div>
              </div>
            )}
            {sanitized.metadata && (
              <div>
                <div className={clsx("text-[10px] font-mono font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5", t.textMuted)}>
                  <Terminal className="w-3 h-3 text-amber-500" />
                  <span>{i18n.turn.runtimeMetadata}</span>
                </div>
                <pre className={clsx("font-mono text-[11px] leading-relaxed p-2.5 rounded border whitespace-pre-wrap overflow-x-auto", t.codeBlockBg, t.border, t.textSecondary)}>
                  {sanitized.metadata}
                </pre>
              </div>
            )}
            {sanitized.systemMessage && (
              <div>
                <div className={clsx("text-[10px] font-mono font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5", t.textMuted)}>
                  <Bot className="w-3 h-3 text-emerald-500" />
                  <span>{i18n.turn.systemMessage}</span>
                </div>
                <pre className={clsx("font-mono text-[11px] leading-relaxed p-2.5 rounded border whitespace-pre-wrap overflow-x-auto", t.codeBlockBg, t.border, t.textSecondary)}>
                  {sanitized.systemMessage}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Execution Traces (Tools, Subagents, Thinking) */}
      {(tools.length > 0 || turn.thinking || subagents.length > 0) && (
        <div className={clsx("px-4 py-2.5 border-b space-y-2", t.border, t.isDark ? "bg-zinc-500/[0.03]" : "bg-slate-50/50")}>
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
                <div className={clsx("flex items-center gap-2", t.textPrimary)}>
                  <Brain className={clsx("w-3.5 h-3.5", t.textMuted)} />
                  <span className="font-mono text-xs">{i18n.turn.thinkingProcess}</span>
                </div>
                {thinkingExpanded ? <ChevronDown className={clsx("w-3.5 h-3.5", t.textMuted)} /> : <ChevronRight className={clsx("w-3.5 h-3.5", t.textMuted)} />}
              </button>
              {thinkingExpanded && (
                <div className={clsx("p-3 text-xs leading-relaxed border-t font-mono", t.border, t.isDark ? "bg-zinc-950/50 text-zinc-300" : "bg-slate-50 text-slate-700")}>
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
                  <Terminal className={clsx("w-3.5 h-3.5", t.textMuted)} />
                  <span className={clsx(t.textSecondary)}>
                    {i18n.turn.toolsAccordion
                      .replace('{tools}', String(tools.length))
                      .replace('{files}', String(modifiedFiles.length))
                      .replace('{subagents}', String(subagents.length))}
                  </span>
                </div>
                <div className={clsx("flex items-center gap-1 font-mono text-[11px]", t.textMuted)}>
                  <span>{toolsExpanded ? (locale === 'en-US' ? 'Collapse' : '收起') : (locale === 'en-US' ? 'Expand' : '展开')}</span>
                  {toolsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Tools Detail Accordion */}
              {toolsExpanded && (
                <div className={clsx("p-3 border-t space-y-2.5", t.border, t.accordionBg)}>
                  {/* Modified Files Chips */}
                  {modifiedFiles.length > 0 && (
                    <div className="space-y-1">
                      <div className={clsx("text-[11px] font-medium flex items-center gap-1", t.isDark ? "text-emerald-400/90" : "text-emerald-700")}>
                        <FileCode className="w-3 h-3" />
                        <span>{locale === 'en-US' ? 'Modified Files in this turn:' : '本轮变更文件：'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {modifiedFiles.map((fp, i) => (
                          <div 
                            key={i}
                            className={clsx(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono group border",
                              t.isDark 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                                : "bg-emerald-50 border-emerald-200 text-emerald-800"
                            )}
                          >
                            <span 
                              onClick={() => handleFileClick(fp)}
                              className="truncate max-w-[280px] cursor-pointer hover:underline" 
                              title={locale === 'en-US' ? `Preview: ${fp}` : `预览文件: ${fp}`}
                            >
                              {fp}
                            </span>
                            <button
                              onClick={() => onOpenInFolder(fp)}
                              className={clsx("transition-colors p-0.5", t.isDark ? "text-emerald-400 hover:text-emerald-200" : "text-emerald-600 hover:text-emerald-900")}
                              title={locale === 'en-US' ? 'Reveal in Finder' : '在访达中显示'}
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
                    <div className={clsx("text-[11px] font-medium flex items-center gap-1", t.textMuted)}>
                      <Terminal className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Tool Execution Details:' : '工具执行细节：'}</span>
                    </div>
                    {tools.slice(0, 15).map((tool, idx) => (
                      <div 
                        key={idx}
                        className={clsx("p-2 rounded border text-xs font-mono", t.border, t.isDark ? "bg-zinc-900/60" : "bg-white shadow-2xs")}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={clsx("font-semibold", t.isDark ? "text-sky-400" : "text-indigo-600")}>{tool.name}</span>
                          <span className={clsx("text-[10px]", t.textMuted)}>#{idx + 1}</span>
                        </div>
                        {tool.args && (
                          <pre className={clsx("text-[11px] overflow-x-auto p-1.5 rounded border", t.codeBlockBg, t.border, t.textSecondary)}>
                            {typeof tool.args === 'string' ? tool.args : JSON.stringify(tool.args, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                    {tools.length > 15 && (
                      <div className={clsx("text-center text-[11px] py-1", t.textMuted)}>
                        {locale === 'en-US' ? `Omitted ${tools.length - 15} additional tool calls` : `已省略剩余 ${tools.length - 15} 项细分工具调用`}
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
        <div className={clsx("flex items-center justify-between pb-2 mb-3 border-b", t.border)}>
          <div className="flex items-center gap-2">
            <span className={clsx("text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1.5", t.roleAssistantBadge)}>
              <Bot className="w-3 h-3 opacity-80" />
              {i18n.view.assistantRole}
            </span>
          </div>

          <button
            onClick={handleCopyResponse}
            className={clsx("text-[11px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1", t.buttonSecondary)}
            title={locale === 'en-US' ? 'Copy Reply' : '复制回复内容'}
          >
            {copiedResponse ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copiedResponse ? i18n.preview.copied : (locale === 'en-US' ? 'Copy Reply' : '复制回复')}</span>
          </button>
        </div>

        <div className={clsx("text-sm leading-relaxed", t.textPrimary)}>
          <MarkdownRenderer 
            content={turn.assistantText || (locale === 'en-US' ? '(No text content in this turn, primarily tool execution)' : '(本轮无额外文本交付，主要为底层工具执行)')} 
            theme={theme}
            locale={locale}
            workspacePath={workspacePath}
            onOpenInFolder={onOpenInFolder}
            onFullScreenCode={onFullScreenCode}
            onPreviewFile={onPreviewFile}
            onImageClick={onImageClick}
          />
        </div>
      </div>

      {/* 4. Bottom Quick Nav (If more turns ahead) */}
      {onNextTurn && turn.turnIndex < totalTurns && (
        <div className={clsx("px-4 py-2.5 border-t flex items-center justify-between text-xs", t.border, t.isDark ? "bg-zinc-500/[0.02]" : "bg-slate-50/50")}>
          <span className={clsx("text-[11px] font-mono", t.textMuted)}>
            {turn.turnIndex} / {totalTurns} {locale === 'en-US' ? 'Turns' : '轮'}
          </span>
          <button
            onClick={onNextTurn}
            className={clsx("px-3 py-1 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5", t.buttonSecondary)}
          >
            <span>{i18n.view.jumpNextTurn}</span>
            <ChevronRight className={clsx("w-3.5 h-3.5", t.textMuted)} />
            <kbd className={clsx("text-[10px] px-1.5 py-0.5 rounded border font-mono", t.kbdBg)}>⌥↓</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
