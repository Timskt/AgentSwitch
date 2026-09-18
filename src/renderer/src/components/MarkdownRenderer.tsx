import React, { useState } from 'react'
import { 
  Copy, Check, Maximize2, ChevronDown, ChevronUp, 
  FileCode, ExternalLink, FolderOpen, Image as ImageIcon,
  X, FileText, Info, Lightbulb, AlertCircle, AlertTriangle, 
  OctagonAlert, CheckSquare, Square
} from 'lucide-react'
import clsx from 'clsx'

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
}

export function MarkdownRenderer({ 
  content, 
  onOpenFullscreen, 
  maxCollapseLines = 25, 
  onFullScreenCode,
  workspacePath,
  onOpenInFolder,
  onPreviewFile,
  onImageClick
}: MarkdownRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<{ src: string, alt: string } | null>(null)

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
          />
        )
      })}
    </div>
  )
}

function CodeBlock({ 
  rawBlock, 
  maxCollapseLines, 
  onOpenFullscreen 
}: { 
  rawBlock: string, 
  maxCollapseLines: number, 
  onOpenFullscreen?: (code: string, lang: string) => void 
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
    <div className="my-2.5 rounded-xl border border-zinc-700/60 bg-[#09090b] overflow-hidden font-mono text-[11px] shadow-sm">
      {/* Code Header Bar */}
      <div className="px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between text-zinc-400 text-[10px]">
        <div className="flex items-center space-x-2">
          <FileCode className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold uppercase text-zinc-300">{lang || 'text'}</span>
          <span className="text-zinc-500">• {totalLines} 行</span>
        </div>
        <div className="flex items-center space-x-2">
          {onOpenFullscreen && (
            <button
              onClick={() => onOpenFullscreen(code, lang)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              title="全屏大文本检视器"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-1.5 py-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
            title="复制代码"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="relative">
        <pre className="p-3.5 overflow-x-auto custom-scrollbar text-zinc-300 leading-relaxed font-mono">
          <code>
            {displayLines.map((line, idx) => {
              if (isDiff) {
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  return (
                    <div key={idx} className="bg-emerald-950/40 text-emerald-300 px-1 -mx-1 rounded-xs">
                      {line}
                    </div>
                  )
                }
                if (line.startsWith('-') && !line.startsWith('---')) {
                  return (
                    <div key={idx} className="bg-rose-950/40 text-rose-300 px-1 -mx-1 rounded-xs">
                      {line}
                    </div>
                  )
                }
                if (line.startsWith('@@')) {
                  return (
                    <div key={idx} className="text-cyan-400 font-semibold opacity-90">
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
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand / Collapse Control */}
      {shouldCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-1.5 bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-400 hover:text-zinc-200 text-[11px] font-sans font-medium flex items-center justify-center space-x-1 border-t border-zinc-800/80 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>收起代码 ({totalLines} 行)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>展开超长代码 (共 {totalLines} 行，已截断显示前 {maxCollapseLines} 行)</span>
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
  onOpenInFolder
}: { 
  text: string, 
  workspacePath?: string,
  onOpenImage: (src: string, alt: string) => void,
  onPreviewFile?: (targetPath: string) => void,
  onOpenInFolder?: (path: string) => void
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
                className="group relative rounded-xl overflow-hidden border border-zinc-700/60 bg-zinc-900 cursor-pointer shadow-md hover:border-indigo-500/60 transition-all"
              >
                <img 
                  src={src} 
                  alt={alt}
                  className="w-full max-h-64 object-cover object-top group-hover:scale-[1.02] transition-transform duration-200"
                  onError={(e: any) => {
                    // Fallback to error card with click preview
                    e.target.style.display = 'none'
                  }}
                />
                <div className="p-2 bg-zinc-950/80 flex items-center justify-between text-[11px] text-zinc-300">
                  <span className="truncate flex items-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{alt || '点击查看图片'}</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 group-hover:text-indigo-400">点击放大</span>
                </div>
              </div>
            </div>
          )
        }

        // 2. Headings
        if (trimmed.startsWith('# ')) {
          return <h1 key={pIdx} className="text-base font-bold text-zinc-100 mt-2 mb-1 border-b border-zinc-800 pb-1">{trimmed.slice(2)}</h1>
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={pIdx} className="text-sm font-bold text-zinc-200 mt-2 mb-1 border-b border-zinc-800 pb-0.5">{trimmed.slice(3)}</h2>
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={pIdx} className="text-xs font-bold text-zinc-300 mt-1.5 mb-0.5">{trimmed.slice(4)}</h3>
        }

        // 3. GitHub Alerts Check: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
        const alertMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n)?([\s\S]*)$/i)
        if (alertMatch) {
          const alertType = alertMatch[1].toUpperCase()
          const alertContent = alertMatch[2].trim().replace(/^>\s?/gm, '')
          return <AlertBlock key={pIdx} type={alertType} content={alertContent} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
        }

        // 4. Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <div key={pIdx} className="pl-3 border-l-2 border-indigo-500/60 text-zinc-400 italic text-[11px] my-1 bg-zinc-900/30 py-1.5 rounded-r">
              <InlineMarkdown text={trimmed.replace(/^>\s?/gm, '')} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
            </div>
          )
        }

        // 5. Markdown Tables (| a | b |) including line-numbered tables (51: | ... |)
        const rawLines = trimmed.split('\n').map(l => l.trim())
        const cleanedLines = rawLines.map(l => l.replace(/^\s*\d+:\s*\|/, '|').replace(/^x\s*\|/, '|'))
        if (cleanedLines.length >= 2 && cleanedLines.filter(l => l.startsWith('|') && l.endsWith('|')).length >= 2) {
          return <TableBlock key={pIdx} rawTable={trimmed} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
        }

        // 6. Checklists (- [ ] or - [x])
        if (/^[-*]\s+\[([ xX])\]\s+/.test(trimmed)) {
          const items = trimmed.split('\n').filter(l => l.trim())
          return (
            <ul key={pIdx} className="space-y-1.5 pl-1 text-zinc-300">
              {items.map((it, itIdx) => {
                const match = it.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/)
                if (match) {
                  const isChecked = match[1].toLowerCase() === 'x'
                  return (
                    <li key={itIdx} className="flex items-start space-x-2 leading-relaxed">
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      )}
                      <span className={clsx(isChecked && "line-through text-zinc-500")}>
                        <InlineMarkdown text={match[2]} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
                      </span>
                    </li>
                  )
                }
                return (
                  <li key={itIdx} className="leading-relaxed">
                    <InlineMarkdown text={it} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
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
            <ul key={pIdx} className="space-y-1 pl-4 list-disc text-zinc-300">
              {items.map((it, itIdx) => (
                <li key={itIdx} className="leading-relaxed">
                  <InlineMarkdown text={it.replace(/^[-*]\s+/, '')} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
                </li>
              ))}
            </ul>
          )
        }

        // 8. Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split('\n').filter(l => l.trim())
          return (
            <ol key={pIdx} className="space-y-1 pl-4 list-decimal text-zinc-300">
              {items.map((it, itIdx) => (
                <li key={itIdx} className="leading-relaxed">
                  <InlineMarkdown text={it.replace(/^\d+\.\s+/, '')} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
                </li>
              ))}
            </ol>
          )
        }

        // 9. Regular Paragraph with inline formatting
        return (
          <p key={pIdx} className="leading-relaxed whitespace-pre-wrap break-words text-zinc-200">
            <InlineMarkdown text={trimmed} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
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
  onPreviewFile 
}: { 
  type: string, 
  content: string, 
  workspacePath?: string, 
  onPreviewFile?: (path: string) => void 
}) {
  const configs: Record<string, { icon: React.ReactNode, title: string, border: string, bg: string, text: string }> = {
    NOTE: {
      icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
      title: 'NOTE',
      border: 'border-sky-500/50',
      bg: 'bg-sky-950/20',
      text: 'text-sky-200'
    },
    TIP: {
      icon: <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />,
      title: 'TIP',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-950/20',
      text: 'text-emerald-200'
    },
    IMPORTANT: {
      icon: <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />,
      title: 'IMPORTANT',
      border: 'border-purple-500/50',
      bg: 'bg-purple-950/20',
      text: 'text-purple-200'
    },
    WARNING: {
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
      title: 'WARNING',
      border: 'border-amber-500/50',
      bg: 'bg-amber-950/20',
      text: 'text-amber-200'
    },
    CAUTION: {
      icon: <OctagonAlert className="w-4 h-4 text-rose-400 shrink-0" />,
      title: 'CAUTION',
      border: 'border-rose-500/50',
      bg: 'bg-rose-950/20',
      text: 'text-rose-200'
    }
  }

  const cfg = configs[type] || configs.NOTE

  return (
    <div className={clsx("my-2.5 p-3 rounded-xl border-l-4 border shadow-xs leading-relaxed", cfg.border, cfg.bg)}>
      <div className="flex items-center space-x-2 font-semibold text-xs mb-1.5">
        {cfg.icon}
        <span className={clsx("uppercase tracking-wide font-mono text-[11px]", cfg.text)}>{cfg.title}</span>
      </div>
      <div className="text-zinc-300 text-xs pl-6">
        <InlineMarkdown text={content} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
      </div>
    </div>
  )
}

function TableBlock({ 
  rawTable, 
  workspacePath, 
  onPreviewFile 
}: { 
  rawTable: string, 
  workspacePath?: string, 
  onPreviewFile?: (path: string) => void 
}) {
  const rawLines = rawTable.trim().split('\n').map(l => l.trim()).filter(Boolean)
  const lines = rawLines.map(l => l.replace(/^\s*\d+:\s*\|/, '|').replace(/^x\s*\|/, '|'))
  if (lines.length < 2) return <pre className="p-2 text-[11px] font-mono text-zinc-400 bg-zinc-900 rounded">{rawTable}</pre>

  const firstLine = lines[0]
  const headers = firstLine.split('|').slice(1, -1).map(h => h.trim())
  let rowLines = lines.slice(1)
  if (rowLines[0] && rowLines[0].includes('|-')) {
    rowLines = rowLines.slice(1)
  }

  return (
    <div className="my-2.5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50 custom-scrollbar shadow-xs">
      <table className="w-full text-left border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-300 font-semibold">
            {headers.map((h, idx) => (
              <th key={idx} className="px-3 py-2 border-r border-zinc-800/60 last:border-0 font-medium tracking-tight">
                <InlineMarkdown text={h} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLines.map((row, rIdx) => {
            const cols = row.split('|').slice(1, -1).map(c => c.trim())
            return (
              <tr key={rIdx} className={clsx("border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/30 transition-colors", rIdx % 2 === 0 ? "bg-transparent" : "bg-zinc-900/20")}>
                {cols.map((col, cIdx) => (
                  <td key={cIdx} className="px-3 py-1.5 text-zinc-300 border-r border-zinc-800/40 last:border-0">
                    <InlineMarkdown text={col} workspacePath={workspacePath} onPreviewFile={onPreviewFile} />
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
  onPreviewFile 
}: { 
  text: string, 
  workspacePath?: string, 
  onPreviewFile?: (path: string) => void 
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
              className="inline-flex items-center space-x-0.5 text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-medium cursor-pointer transition-colors"
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
              className="inline-flex items-center space-x-1 px-1.5 py-0.5 mx-0.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-indigo-500/60 rounded font-mono text-[10.5px] text-zinc-300 hover:text-white shadow-2xs transition-colors cursor-pointer group"
              title={`点击预览或定位文件: ${seg}`}
            >
              <FileText className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="truncate max-w-[200px]">{filename}</span>
              <FolderOpen className="w-2.5 h-2.5 text-zinc-500 group-hover:text-indigo-300 shrink-0 ml-0.5" />
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
                className="inline-flex items-center space-x-1 px-1.5 py-0.5 mx-0.5 bg-zinc-800/60 hover:bg-indigo-950/40 border border-zinc-700/60 hover:border-indigo-500/50 rounded font-mono text-[10.5px] text-zinc-200 hover:text-indigo-200 transition-colors cursor-pointer group"
                title={`点击预览或定位: ${code}`}
              >
                {isDir ? (
                  <FolderOpen className="w-2.5 h-2.5 text-amber-400/80 group-hover:text-amber-300 shrink-0" />
                ) : (
                  <FileCode className="w-2.5 h-2.5 text-indigo-400/80 group-hover:text-indigo-300 shrink-0" />
                )}
                <span className="truncate max-w-[240px]">{code}</span>
              </button>
            )
          }

          return (
            <code key={idx} className="px-1 py-0.5 mx-0.5 rounded font-mono text-[11px] bg-zinc-800/40 text-zinc-300 font-normal border border-zinc-700/30">
              {code}
            </code>
          )
        }

        // 4. Bold text
        if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
          return (
            <strong key={idx} className="font-semibold text-zinc-100">
              {seg.slice(2, -2)}
            </strong>
          )
        }

        return seg
      })}
    </>
  )
}
