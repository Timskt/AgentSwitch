import React, { useState } from 'react'
import { 
  Copy, Check, Maximize2, ChevronDown, ChevronUp, 
  FileCode, ExternalLink, FolderOpen, Image as ImageIcon,
  X, FileText, Table as TableIcon
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
  onImageClick?: (src: string) => void
}

export function MarkdownRenderer({ 
  content, 
  onOpenFullscreen, 
  maxCollapseLines = 25, 
  onFullScreenCode,
  workspacePath
}: MarkdownRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<{ src: string, alt: string } | null>(null)

  if (!content) return null

  // Split code blocks from prose
  const blocks = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-3 leading-relaxed text-xs">
      {/* Lightbox Modal */}
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
            onOpenImage={(src, alt) => setLightboxImage({ src, alt })} 
          />
        )
      })}
    </div>
  )
}

function CodeBlock({ rawBlock, maxCollapseLines, onOpenFullscreen }: { rawBlock: string, maxCollapseLines: number, onOpenFullscreen?: (code: string, lang: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const lines = rawBlock.slice(3, -3).trim().split('\n')
  const firstLine = lines[0].trim()
  const langMatch = firstLine.match(/^[a-zA-Z0-9_#-]+$/)
  const lang = langMatch ? firstLine : ''
  const code = (lang ? lines.slice(1) : lines).join('\n')
  const totalLines = (lang ? lines.slice(1) : lines).length

  const shouldCollapse = totalLines > maxCollapseLines
  const displayLines = shouldCollapse && !expanded 
    ? (lang ? lines.slice(1, maxCollapseLines + 1) : lines.slice(0, maxCollapseLines)).join('\n')
    : code

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
        <pre className="p-3.5 overflow-x-auto custom-scrollbar text-zinc-300 leading-relaxed">
          <code>{displayLines}</code>
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
  onOpenImage 
}: { 
  text: string, 
  workspacePath?: string,
  onOpenImage: (src: string, alt: string) => void 
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
          let src = imgMatch[2]
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
                    e.target.style.display = 'none'
                  }}
                />
                <div className="p-2 bg-zinc-950/80 flex items-center justify-between text-[11px] text-zinc-300">
                  <span className="truncate flex items-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{alt || '点击放大查看图片'}</span>
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

        // 3. Markdown Tables (| a | b |) including line-numbered tables (51: | ... |)
        const rawLines = trimmed.split('\n').map(l => l.trim())
        const cleanedLines = rawLines.map(l => l.replace(/^\s*\d+:\s*\|/, '|').replace(/^x\s*\|/, '|'))
        if (cleanedLines.length >= 2 && cleanedLines.filter(l => l.startsWith('|') && l.endsWith('|')).length >= 2) {
          return <TableBlock key={pIdx} rawTable={trimmed} workspacePath={workspacePath} />
        }

        // 4. Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <div key={pIdx} className="pl-3 border-l-2 border-indigo-500/60 text-zinc-400 italic text-[11px] my-1 bg-zinc-900/30 py-1 rounded-r">
              {trimmed.replace(/^>\s?/gm, '')}
            </div>
          )
        }

        // 5. Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').filter(l => l.trim())
          return (
            <ul key={pIdx} className="space-y-1 pl-4 list-disc text-zinc-300">
              {items.map((it, itIdx) => (
                <li key={itIdx} className="leading-relaxed">
                  <InlineMarkdown text={it.replace(/^[-*]\s+/, '')} workspacePath={workspacePath} />
                </li>
              ))}
            </ul>
          )
        }

        // 6. Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split('\n').filter(l => l.trim())
          return (
            <ol key={pIdx} className="space-y-1 pl-4 list-decimal text-zinc-300">
              {items.map((it, itIdx) => (
                <li key={itIdx} className="leading-relaxed">
                  <InlineMarkdown text={it.replace(/^\d+\.\s+/, '')} workspacePath={workspacePath} />
                </li>
              ))}
            </ol>
          )
        }

        // 7. Regular Paragraph with inline formatting
        return (
          <p key={pIdx} className="leading-relaxed whitespace-pre-wrap break-words text-zinc-200">
            <InlineMarkdown text={trimmed} workspacePath={workspacePath} />
          </p>
        )
      })}
    </div>
  )
}

function TableBlock({ rawTable, workspacePath }: { rawTable: string, workspacePath?: string }) {
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
                <InlineMarkdown text={h} workspacePath={workspacePath} />
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
                    <InlineMarkdown text={col} workspacePath={workspacePath} />
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

function InlineMarkdown({ text, workspacePath }: { text: string, workspacePath?: string }) {
  // Matches:
  // 1. [link text](url)
  // 2. Absolute file paths
  // 3. `inline code`
  // 4. **bold**
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\/(?:Users|home|[a-zA-Z0-9_\-\.]+)\/[a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9_]+|`[^`]+`|\*\*[^*]+\*\*)/g
  const parts = text.split(tokenRegex)

  const handleOpenUrl = (url: string) => {
    let target = url.trim()
    if (target.startsWith('file://')) {
      const clean = decodeURIComponent(target.replace(/^file:\/\//, '').split('#')[0])
      // @ts-ignore
      if (window.api && window.api.openInFolder) {
        // @ts-ignore
        window.api.openInFolder(clean)
        return
      }
    }
    // @ts-ignore
    if (window.api && window.api.openExternalUrl) {
      // @ts-ignore
      window.api.openExternalUrl(target)
    }
  }

  const handleOpenPath = (filePath: string) => {
    let target = filePath.trim().replace(/^[`'"]+|[`'"]+$/g, '')
    target = target.split('#')[0]
    if (!target.startsWith('/') && !target.startsWith('~') && workspacePath) {
      target = workspacePath.replace(/\/$/, '') + '/' + target.replace(/^\.\//, '')
    }
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
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleOpenUrl(url)}
              className="inline-flex items-center space-x-0.5 text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-medium cursor-pointer transition-colors"
              title={`打开: ${url}`}
            >
              <span>{title}</span>
              <ExternalLink className="w-2.5 h-2.5 ml-0.5 shrink-0 inline" />
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
              onClick={() => handleOpenPath(seg)}
              className="inline-flex items-center space-x-1 px-1.5 py-0.5 mx-0.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-indigo-500/60 rounded font-mono text-[10.5px] text-zinc-300 hover:text-white shadow-2xs transition-colors cursor-pointer group"
              title={`在访达中定位: ${seg}`}
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
            (code.includes('/') || /\.(tsx|ts|jsx|js|mjs|cjs|json|md|sql|html|css|py|rs|go|yaml|yml|sh|env)$/i.test(code)) &&
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
                onClick={() => handleOpenPath(code)}
                className="inline-flex items-center space-x-1 px-1.5 py-0.5 mx-0.5 bg-zinc-800/60 hover:bg-indigo-950/40 border border-zinc-700/60 hover:border-indigo-500/50 rounded font-mono text-[10.5px] text-zinc-200 hover:text-indigo-200 transition-colors cursor-pointer group"
                title={`点击定位文件/目录: ${code}`}
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
