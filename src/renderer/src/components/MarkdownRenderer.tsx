import React, { useState } from 'react'
import { 
  Copy, Check, Maximize2, ChevronDown, ChevronUp, 
  FileCode, ExternalLink, FolderOpen, Image as ImageIcon,
  X, FileText, Info, Lightbulb, AlertCircle, AlertTriangle, 
  OctagonAlert, CheckSquare, Square
} from 'lucide-react'
import clsx from 'clsx'
import { Locale } from '../i18n'

interface MarkdownRendererProps {
  content: string
  onOpenFullscreen?: (code: string, lang: string) => void
  maxCollapseLines?: number
  theme?: any
  workspacePath?: string
  onOpenInFolder?: (path: string) => void
  onFullScreenCode?: (code: string, language: string) => void
  onPreviewFile?: (targetPath: string) => void
  onImageClick?: (src: string, alt?: string) => void
  locale?: Locale
}

export function MarkdownRenderer({ 
  content, 
  onOpenFullscreen, 
  maxCollapseLines = 25, 
  onFullScreenCode,
  workspacePath,
  onOpenInFolder,
  onPreviewFile,
  onImageClick,
  theme = 'obsidian',
  locale = 'zh-CN'
}: MarkdownRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<{ src: string, alt: string } | null>(null)
  const isDark = theme !== 'light'

  if (!content) return null

  const handleShowImage = (src: string, alt: string) => {
    if (onImageClick) {
      onImageClick(src, alt)
    } else {
      setLightboxImage({ src, alt })
    }
  }

  // Split code blocks from prose
  const blocks = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-3 leading-relaxed text-xs">
      {/* Fallback In-component Lightbox Modal if not intercepted by parent */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full pb-2 text-zinc-300">
              <span className="text-xs truncate font-medium">{lightboxImage.alt || '图片预览'}</span>
              <button 
                onClick={() => setLightboxImage(null)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={lightboxImage.src} 
              alt={lightboxImage.alt}
              className="max-h-[80vh] max-w-full object-contain rounded-xl border border-zinc-800 shadow-2xl" 
            />
          </div>
        </div>
      )}

      {blocks.map((block, bIdx) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          return (
            <CodeBlock 
              key={bIdx} 
              rawBlock={block} 
              maxCollapseLines={maxCollapseLines}
              onOpenFullscreen={onOpenFullscreen || onFullScreenCode}
              isDark={isDark}
              locale={locale}
            />
          )
        }

        // Render Markdown prose & rich media
        return (
          <ProseBlock 
            key={bIdx} 
            text={block} 
            workspacePath={workspacePath}
            onOpenImage={handleShowImage}
            onPreviewFile={onPreviewFile}
            onOpenInFolder={onOpenInFolder}
            isDark={isDark}
          />
        )
      })}
    </div>
  )
}

function CodeBlock({ 
  rawBlock, 
  maxCollapseLines, 
  onOpenFullscreen,
  isDark = true,
  locale = 'zh-CN'
}: { 
  rawBlock: string, 
  maxCollapseLines: number, 
  onOpenFullscreen?: (code: string, lang: string) => void,
  isDark?: boolean,
  locale?: Locale
}) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const lines = rawBlock.slice(3, -3).trim().split('\n')
  const firstLine = lines[0].trim()
  const langMatch = firstLine.match(/^[a-zA-Z0-9_#-]+$/)
  const lang = (langMatch ? firstLine : '').toLowerCase()
  const codeLines = lang ? lines.slice(1) : lines
  const code = codeLines.join('\n')
  const totalLines = codeLines.length

  const isDiff = lang === 'diff' || codeLines.some(l => l.startsWith('+++') || l.startsWith('---'))
  const shouldCollapse = totalLines > maxCollapseLines
  const displayLines = shouldCollapse && !expanded 
    ? codeLines.slice(0, maxCollapseLines)
    : codeLines

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={clsx(
      "my-2.5 rounded-xl border overflow-hidden font-mono text-[11px] shadow-xs",
      isDark ? "border-zinc-700/60 bg-[#09090b]" : "border-slate-200 bg-[#f8fafc]"
    )}>
      {/* Code Header Bar */}
      <div className={clsx(
        "px-3.5 py-1.5 border-b flex items-center justify-between text-[10px]",
        isDark ? "bg-zinc-900/90 border-zinc-800/80 text-zinc-400" : "bg-slate-100/90 border-slate-200 text-slate-600"
      )}>
        <div className="flex items-center space-x-2">
          <FileCode className={clsx("w-3.5 h-3.5", isDark ? "text-zinc-400" : "text-slate-500")} />
          <span className={clsx("font-semibold uppercase", isDark ? "text-zinc-300" : "text-slate-800")}>{lang || 'text'}</span>
          <span className={isDark ? "text-zinc-500" : "text-slate-400"}>• {totalLines} {locale === 'en-US' ? 'lines' : '行'}</span>
        </div>
        <div className="flex items-center space-x-2">
          {onOpenFullscreen && (
            <button
              onClick={() => onOpenFullscreen(code, lang)}
              className={clsx(
                "p-1 rounded transition-colors",
                isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
              )}
              title={locale === 'en-US' ? 'Fullscreen Code Inspector' : '全屏大文本检视器'}
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className={clsx(
              "flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors",
              isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
            )}
            title={locale === 'en-US' ? 'Copy Code' : '复制代码'}
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? (locale === 'en-US' ? 'Copied' : '已复制') : (locale === 'en-US' ? 'Copy' : '复制')}</span>
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="relative">
        <pre className={clsx("p-3.5 overflow-x-auto custom-scrollbar leading-relaxed font-mono", isDark ? "text-zinc-300" : "text-slate-800")}>
          <code>
            {displayLines.map((line, idx) => {
              if (isDiff) {
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  return (
                    <div key={idx} className={clsx("px-1 -mx-1 rounded-xs", isDark ? "bg-emerald-950/40 text-emerald-300" : "bg-emerald-50 text-emerald-700 font-medium")}>
                      {line}
                    </div>
                  )
                }
                if (line.startsWith('-') && !line.startsWith('---')) {
                  return (
                    <div key={idx} className={clsx("px-1 -mx-1 rounded-xs", isDark ? "bg-rose-950/40 text-rose-300" : "bg-rose-50 text-rose-700 font-medium")}>
                      {line}
                    </div>
                  )
                }
                if (line.startsWith('@@')) {
                  return (
                    <div key={idx} className={clsx("font-semibold", isDark ? "text-cyan-400 opacity-90" : "text-cyan-700")}>
                      {line}
                    </div>
                  )
                }
              }
              return <div key={idx}>{line || ' '}</div>
            })}
          </code>
        </pre>
        {shouldCollapse && !expanded && (
          <div className={clsx(
            "absolute inset-x-0 bottom-0 h-16 pointer-events-none bg-gradient-to-t",
            isDark ? "from-[#09090b] via-[#09090b]/80 to-transparent" : "from-[#f8fafc] via-[#f8fafc]/80 to-transparent"
          )} />
        )}
      </div>

      {/* Expand / Collapse Control */}
      {shouldCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            "w-full py-1.5 text-[11px] font-sans font-medium flex items-center justify-center space-x-1 border-t transition-colors",
            isDark 
              ? "bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-400 hover:text-zinc-200 border-zinc-800/80" 
              : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200"
          )}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>{locale === 'en-US' ? `Collapse Code (${totalLines} lines)` : `收起代码 (${totalLines} 行)`}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>{locale === 'en-US' ? `Expand Code (${totalLines} lines total, showing first ${maxCollapseLines})` : `展开超长代码 (共 ${totalLines} 行，已截断显示前 ${maxCollapseLines} 行)`}</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

function ProseBlock({ 
  text, 
  workspacePath,
  onOpenImage,
  onPreviewFile,
  onOpenInFolder,
  isDark = true
}: { 
  text: string, 
  workspacePath?: string, 
  onOpenImage: (src: string, alt: string) => void,
  onPreviewFile?: (targetPath: string) => void,
  onOpenInFolder?: (path: string) => void,
  isDark?: boolean
}) {
  if (!text.trim()) return null
  const paragraphs = text.split('\n\n')

  return (
    <div className="space-y-2.5">
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim()
        if (!trimmed) return null

        // 1. Image Check: ![alt](url)
        const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
        if (imgMatch) {
          const alt = imgMatch[1]
          let src = imgMatch[2].trim()
          if (src.startsWith('/') && !src.startsWith('//')) {
            src = 'file://' + src
          }
          return (
            <div key={pIdx} className="my-2.5 max-w-md">
              <div 
                onClick={() => onOpenImage(src, alt)}
                className={clsx(
                  "group relative rounded-xl overflow-hidden border cursor-pointer shadow-md hover:border-indigo-500/60 transition-all",
                  isDark ? "border-zinc-700/60 bg-zinc-900" : "border-slate-200 bg-white"
                )}
              >
                <img 
                  src={src} 
                  alt={alt}
                  className="w-full max-h-64 object-cover object-top group-hover:scale-[1.02] transition-transform duration-200"
                  onError={(e: any) => {
                    e.target.style.display = 'none'
                  }}
                />
                <div className={clsx(
                  "p-2 flex items-center justify-between text-[11px]",
                  isDark ? "bg-zinc-950/80 text-zinc-300" : "bg-slate-50/90 text-slate-700 border-t border-slate-200"
                )}>
                  <span className="truncate flex items-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{alt || '点击查看图片'}</span>
                  </span>
                  <span className={clsx("text-[10px] group-hover:text-indigo-500", isDark ? "text-zinc-500" : "text-slate-400")}>点击放大</span>
                </div>
              </div>
            </div>
          )
        }

        // 2. Headings
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={pIdx} className={clsx(
              "text-base font-bold mt-2 mb-1 border-b pb-1",
              isDark ? "text-zinc-100 border-zinc-800" : "text-slate-900 border-slate-200"
            )}>
              {trimmed.slice(2)}
            </h1>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={pIdx} className={clsx(
              "text-sm font-bold mt-2 mb-1 border-b pb-0.5",
              isDark ? "text-zinc-200 border-zinc-800" : "text-slate-900 border-slate-200"
            )}>
              {trimmed.slice(3)}
            </h2>
          )
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={pIdx} className={clsx(
              "text-xs font-bold mt-1.5 mb-0.5",
              isDark ? "text-zinc-300" : "text-slate-800"
            )}>
              {trimmed.slice(4)}
            </h3>
          )
        }

        // 3. GitHub Alerts Check: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
        const alertMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n)?([\s\S]*)$/i)
        if (alertMatch) {
          const alertType = alertMatch[1].toUpperCase()
          const alertContent = alertMatch[2].trim().replace(/^>\s?/gm, '')
          return (
            <AlertBlock 
              key={pIdx} 
              type={alertType} 
              content={alertContent} 
              workspacePath={workspacePath} 
              onPreviewFile={onPreviewFile} 
              isDark={isDark} 
            />
          )
        }

        // 4. Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <div key={pIdx} className={clsx(
              "pl-3 border-l-2 italic text-[11px] my-1 py-1.5 rounded-r",
              isDark ? "border-indigo-500/60 text-zinc-300 bg-zinc-900/30" : "border-indigo-500 text-slate-700 bg-indigo-50/50"
            )}>
              <InlineMarkdown text={trimmed.replace(/^>\s?/gm, '')} workspacePath={workspacePath} onPreviewFile={onPreviewFile} isDark={isDark} />
            </div>
          )
        }

        // 5. Markdown Tables (| a | b |) including line-numbered tables (51: | ... |)
        const rawLines = trimmed.split('\n').map(l => l.trim())
        const cleanedLines = rawLines.map(l => l.replace(/^\s*\d+:\s*\|/, '|').replace(/^x\s*\|/, '|'))
        if (cleanedLines.length >= 2 && cleanedLines.filter(l => l.startsWith('|') && l.endsWith('|')).length >= 2) {
          return (
            <TableBlock 
              key={pIdx} 
              rawTable={trimmed} 
              workspacePath={workspacePath} 
              onPreviewFile={onPreviewFile} 
              isDark={isDark} 
            />
          )
        }

        // 6. Checklists (- [ ] or - [x])
        if (/^[-*]\s+\[([ xX])\]\s+/.test(trimmed)) {
          const items = trimmed.split('\n').filter(l => l.trim())
          return (
            <ul key={pIdx} className={clsx("space-y-1.5 pl-1", isDark ? "text-zinc-300" : "text-slate-700")}>
              {items.map((it, itIdx) => {
                const match = it.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/)
                if (match) {
                  const isChecked = match[1].toLowerCase() === 'x'
                  return (
                    <li key={itIdx} className="flex items-start space-x-2 leading-relaxed">
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      ) : (
                        <Square className={clsx("w-3.5 h-3.5 shrink-0 mt-0.5", isDark ? "text-zinc-500" : "text-slate-400")} />
                      )}
                      <span className={clsx(isChecked && (isDark ? "line-through text-zinc-500" : "line-through text-slate-400"))}>
                        <InlineMarkdown text={match[2]} workspacePath={workspacePath} onPreviewFile={onPreviewFile} isDark={isDark} />
                      </span>
                    </li>
                  )
                }
                return (
                  <li key={itIdx} className="leading-relaxed">
                    <InlineMarkdown text={it} workspacePath={workspacePath} onPreviewFile={onPreviewFile} isDark={isDark} />
                  </li>
                )
              })}
            </ul>
          )
        }

        // 7. Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').filter(l => l.trim())
          return (
            <ul key={pIdx} className={clsx("space-y-1 pl-4 list-disc", isDark ? "text-zinc-300" : "text-slate-700")}>
              {items.map((it, itIdx) => (
                <li key={itIdx} className="leading-relaxed">
                  <InlineMarkdown text={it.replace(/^[-*]\s+/, '')} workspacePath={workspacePath} onPreviewFile={onPreviewFile} isDark={isDark} />
                </li>
              ))}
            </ul>
          )
        }

        // 8. Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split('\n').filter(l => l.trim())
          return (
            <ol key={pIdx} className={clsx("space-y-1 pl-4 list-decimal", isDark ? "text-zinc-300" : "text-slate-700")}>
              {items.map((it, itIdx) => (
                <li key={itIdx} className="leading-relaxed">
                  <InlineMarkdown text={it.replace(/^\d+\.\s+/, '')} workspacePath={workspacePath} onPreviewFile={onPreviewFile} isDark={isDark} />
                </li>
              ))}
            </ol>
          )
        }

        // 9. Regular Paragraph with inline formatting
        return (
          <p key={pIdx} className={clsx("leading-relaxed whitespace-pre-wrap break-words", isDark ? "text-zinc-200" : "text-slate-800")}>
            <InlineMarkdown text={trimmed} workspacePath={workspacePath} onPreviewFile={onPreviewFile} isDark={isDark} />
          </p>
        )
      })}
    </div>
  )
}

function AlertBlock({ 
  type, 
  content, 
  workspacePath, 
  onPreviewFile,
  isDark = true
}: { 
  type: string, 
  content: string, 
  workspacePath?: string, 
  onPreviewFile?: (path: string) => void,
  isDark?: boolean
}) {
  const configs: Record<string, { icon: React.ReactNode, title: string, border: string, bg: string, text: string }> = {
    NOTE: {
      icon: <Info className={clsx("w-4 h-4 shrink-0", isDark ? "text-sky-400" : "text-sky-600")} />,
      title: 'NOTE',
      border: isDark ? 'border-sky-500/50' : 'border-sky-300',
      bg: isDark ? 'bg-sky-950/20' : 'bg-sky-50',
      text: isDark ? 'text-sky-200' : 'text-sky-800'
    },
    TIP: {
      icon: <Lightbulb className={clsx("w-4 h-4 shrink-0", isDark ? "text-emerald-400" : "text-emerald-600")} />,
      title: 'TIP',
      border: isDark ? 'border-emerald-500/50' : 'border-emerald-300',
      bg: isDark ? 'bg-emerald-950/20' : 'bg-emerald-50',
      text: isDark ? 'text-emerald-200' : 'text-emerald-800'
    },
    IMPORTANT: {
      icon: <AlertCircle className={clsx("w-4 h-4 shrink-0", isDark ? "text-purple-400" : "text-purple-600")} />,
      title: 'IMPORTANT',
      border: isDark ? 'border-purple-500/50' : 'border-purple-300',
      bg: isDark ? 'bg-purple-950/20' : 'bg-purple-50',
      text: isDark ? 'text-purple-200' : 'text-purple-800'
    },
    WARNING: {
      icon: <AlertTriangle className={clsx("w-4 h-4 shrink-0", isDark ? "text-amber-400" : "text-amber-600")} />,
      title: 'WARNING',
      border: isDark ? 'border-amber-500/50' : 'border-amber-300',
      bg: isDark ? 'bg-amber-950/20' : 'bg-amber-50',
      text: isDark ? 'text-amber-200' : 'text-amber-800'
    },
    CAUTION: {
      icon: <OctagonAlert className={clsx("w-4 h-4 shrink-0", isDark ? "text-rose-400" : "text-rose-600")} />,
      title: 'CAUTION',
      border: isDark ? 'border-rose-500/50' : 'border-rose-300',
      bg: isDark ? 'bg-rose-950/20' : 'bg-rose-50',
      text: isDark ? 'text-rose-200' : 'text-rose-800'
    }
  }

  const cfg = configs[type] || configs.NOTE

  return (
    <div className={clsx("my-2.5 p-3 rounded-xl border-l-4 border shadow-2xs leading-relaxed", cfg.border, cfg.bg)}>
      <div className="flex items-center space-x-2 font-semibold text-xs mb-1.5">
        {cfg.icon}
        <span className={clsx("uppercase tracking-wide font-mono text-[11px]", cfg.text)}>{cfg.title}</span>
      </div>
      <div className={clsx("text-xs pl-6", isDark ? "text-zinc-300" : "text-slate-800")}>
        <InlineMarkdown text={content} workspacePath={workspacePath} onPreviewFile={onPreviewFile} isDark={isDark} />
      </div>
    </div>
  )
}

function TableBlock({ 
  rawTable, 
  workspacePath, 
  onPreviewFile,
  isDark = true
}: { 
  rawTable: string, 
  workspacePath?: string, 
  onPreviewFile?: (path: string) => void,
  isDark?: boolean
}) {
  const rawLines = rawTable.trim().split('\n').map(l => l.trim()).filter(Boolean)
  const lines = rawLines.map(l => l.replace(/^\s*\d+:\s*\|/, '|').replace(/^x\s*\|/, '|'))
  if (lines.length < 2) {
    return <pre className={clsx("p-2 text-[11px] font-mono rounded border", isDark ? "text-zinc-400 bg-zinc-900 border-zinc-800" : "text-slate-700 bg-slate-100 border-slate-200")}>{rawTable}</pre>
  }

  const firstLine = lines[0]
  const headers = firstLine.split('|').slice(1, -1).map(h => h.trim())
  let rowLines = lines.slice(1)
  if (rowLines[0] && rowLines[0].includes('|-')) {
    rowLines = rowLines.slice(1)
  }

  return (
    <div className={clsx(
      "my-2.5 overflow-x-auto rounded-xl border custom-scrollbar shadow-2xs",
      isDark ? "border-zinc-800 bg-zinc-900/50" : "border-slate-200 bg-white"
    )}>
      <table className="w-full text-left border-collapse text-[11px]">
        <thead>
          <tr className={clsx(
            "border-b font-semibold",
            isDark ? "border-zinc-800 bg-zinc-900/90 text-zinc-300" : "border-slate-200 bg-slate-100/90 text-slate-900"
          )}>
            {headers.map((h, idx) => (
              <th key={idx} className={clsx("px-3 py-2 border-r last:border-0 font-medium tracking-tight", isDark ? "border-zinc-800/60" : "border-slate-200")}>
                <InlineMarkdown text={h} workspacePath={workspacePath} onPreviewFile={onPreviewFile} isDark={isDark} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLines.map((row, rIdx) => {
            const cols = row.split('|').slice(1, -1).map(c => c.trim())
            return (
              <tr 
                key={rIdx} 
                className={clsx(
                  "border-b last:border-0 transition-colors",
                  isDark 
                    ? clsx("border-zinc-800/40 hover:bg-zinc-800/30", rIdx % 2 === 0 ? "bg-transparent" : "bg-zinc-900/20") 
                    : clsx("border-slate-200/80 hover:bg-slate-50", rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/60")
                )}
              >
                {cols.map((col, cIdx) => (
                  <td key={cIdx} className={clsx("px-3 py-1.5 border-r last:border-0", isDark ? "text-zinc-300 border-zinc-800/40" : "text-slate-700 border-slate-200")}>
                    <InlineMarkdown text={col} workspacePath={workspacePath} onPreviewFile={onPreviewFile} isDark={isDark} />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function InlineMarkdown({ 
  text, 
  workspacePath, 
  onPreviewFile,
  isDark = true
}: { 
  text: string, 
  workspacePath?: string, 
  onPreviewFile?: (path: string) => void,
  isDark?: boolean
}) {
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\/(?:Users|home|[a-zA-Z0-9_\-\.]+)\/[a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9_]+|`[^`]+`|\*\*[^*]+\*\*)/g
  const parts = text.split(tokenRegex)

  const handleClickTarget = (rawTarget: string) => {
    const target = rawTarget.trim()
    if (target.startsWith('http://') || target.startsWith('https://')) {
      // @ts-ignore
      if (window.api && window.api.openExternalUrl) {
        // @ts-ignore
        window.api.openExternalUrl(target)
      }
      return
    }

    if (onPreviewFile) {
      onPreviewFile(target)
      return
    }

    // Direct fallback to openInFolder
    // @ts-ignore
    if (window.api && window.api.openInFolder) {
      // @ts-ignore
      window.api.openInFolder(target)
    }
  }

  return (
    <>
      {parts.map((seg, idx) => {
        if (!seg) return null

        // 1. Markdown link [text](url)
        const linkMatch = seg.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (linkMatch) {
          const title = linkMatch[1]
          const url = linkMatch[2]
          const isWeb = url.startsWith('http://') || url.startsWith('https://')
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleClickTarget(url)}
              className={clsx(
                "inline-flex items-center space-x-0.5 underline underline-offset-2 font-medium cursor-pointer transition-colors",
                isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-800"
              )}
              title={`打开 / 预览: ${url}`}
            >
              <span>{title}</span>
              {isWeb ? (
                <ExternalLink className="w-2.5 h-2.5 ml-0.5 shrink-0 inline" />
              ) : (
                <FileCode className="w-2.5 h-2.5 ml-0.5 shrink-0 inline" />
              )}
            </button>
          )
        }

        // 2. Absolute file path
        if (seg.startsWith('/') && seg.includes('.') && seg.length > 5 && !seg.includes(' ')) {
          const filename = seg.split('/').pop() || seg
          return (
            <button 
              key={idx} 
              type="button"
              onClick={() => handleClickTarget(seg)}
              className={clsx(
                "inline-flex items-center space-x-1 px-1.5 py-0.5 mx-0.5 rounded font-mono text-[10.5px] transition-colors cursor-pointer group border shadow-2xs",
                isDark 
                  ? "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700/60 hover:border-indigo-500/60 text-zinc-300 hover:text-white"
                  : "bg-slate-100 hover:bg-slate-200/80 border-slate-300/80 hover:border-indigo-400 text-slate-800"
              )}
              title={`点击预览或定位文件: ${seg}`}
            >
              <FileText className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="truncate max-w-[200px]">{filename}</span>
              <FolderOpen className={clsx("w-2.5 h-2.5 shrink-0 ml-0.5", isDark ? "text-zinc-500 group-hover:text-indigo-300" : "text-slate-400 group-hover:text-indigo-600")} />
            </button>
          )
        }

        // 3. Inline code
        if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
          const code = seg.slice(1, -1).trim()
          const isPathLike = (
            (code.includes('/') || /\.(tsx|ts|jsx|js|mjs|cjs|json|md|sql|html|css|py|rs|go|yaml|yml|sh|env|png|jpg|svg)$/i.test(code)) &&
            !code.includes(' ') &&
            !code.includes('&&') &&
            !code.includes('||') &&
            !code.includes(';') &&
            code.length > 1
          )

          if (isPathLike) {
            const isDir = code.endsWith('/')
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleClickTarget(code)}
                className={clsx(
                  "inline-flex items-center space-x-1 px-1.5 py-0.5 mx-0.5 rounded font-mono text-[10.5px] transition-colors cursor-pointer group border shadow-2xs",
                  isDark 
                    ? "bg-zinc-800/60 hover:bg-indigo-950/40 border-zinc-700/60 hover:border-indigo-500/50 text-zinc-200 hover:text-indigo-200"
                    : "bg-slate-100 hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 text-slate-800 hover:text-indigo-700"
                )}
                title={`点击预览或定位: ${code}`}
              >
                {isDir ? (
                  <FolderOpen className="w-2.5 h-2.5 text-amber-500 group-hover:text-amber-400 shrink-0" />
                ) : (
                  <FileCode className="w-2.5 h-2.5 text-indigo-500 group-hover:text-indigo-400 shrink-0" />
                )}
                <span className="truncate max-w-[240px]">{code}</span>
              </button>
            )
          }

          return (
            <code key={idx} className={clsx(
              "px-1 py-0.5 mx-0.5 rounded font-mono text-[11px] border",
              isDark 
                ? "bg-zinc-800/60 text-zinc-200 border-zinc-700/40" 
                : "bg-slate-100 text-indigo-700 border-slate-200 font-medium"
            )}>
              {code}
            </code>
          )
        }

        // 4. Bold text
        if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
          return (
            <strong key={idx} className={clsx("font-semibold", isDark ? "text-zinc-100" : "text-slate-900")}>
              {seg.slice(2, -2)}
            </strong>
          )
        }

        return seg
      })}
    </>
  )
}
