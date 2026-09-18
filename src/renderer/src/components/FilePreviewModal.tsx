import React, { useState, useMemo, useEffect } from 'react'
import { 
  X, Copy, Check, Search, ExternalLink, FolderOpen, 
  FileCode, Image as ImageIcon, ShieldAlert, FileText, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react'
import clsx from 'clsx'
import { AppTheme, THEME_STYLES } from '../theme'
import { translations, Locale } from '../i18n'

export interface FilePreviewData {
  path: string
  name?: string
  ext?: string
  size?: number
  isImage?: boolean
  dataUrl?: string
  isText?: boolean
  content?: string
  isOversized?: boolean
  isBinary?: boolean
  title?: string
}

interface FilePreviewModalProps {
  open: boolean
  onClose: () => void
  data: FilePreviewData | null
  theme?: AppTheme
  locale?: Locale
  onOpenInEditor?: (path: string) => void
  onRevealInFinder?: (path: string) => void
}

export function FilePreviewModal({
  open,
  onClose,
  data,
  theme = 'obsidian',
  locale = 'zh-CN',
  onOpenInEditor,
  onRevealInFinder
}: FilePreviewModalProps) {
  const [copied, setCopied] = useState(false)
  const [copiedPath, setCopiedPath] = useState(false)
  const [search, setSearch] = useState('')
  const [zoom, setZoom] = useState(1)

  const t = translations[locale]?.preview || translations['zh-CN'].preview
  const themeStyle = THEME_STYLES[theme] || THEME_STYLES.obsidian

  useEffect(() => {
    // Reset zoom and search when file data changes
    setZoom(1)
    setSearch('')
  }, [data?.path])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const rawContent = data?.content || ''
  const lines = useMemo(() => {
    return rawContent.split('\n')
  }, [rawContent])

  const filteredLines = useMemo(() => {
    if (!search.trim()) {
      return lines.map((text, idx) => ({ num: idx + 1, text }))
    }
    const q = search.toLowerCase()
    return lines
      .map((text, idx) => ({ num: idx + 1, text }))
      .filter(item => item.text.toLowerCase().includes(q))
  }, [lines, search])

  if (!open || !data) return null

  const fileName = data.name || data.path.split('/').pop() || 'file'
  const ext = (data.ext || fileName.split('.').pop() || '').toLowerCase()
  const formattedSize = data.size !== undefined ? (
    data.size < 1024 
      ? `${data.size} B` 
      : data.size < 1024 * 1024 
        ? `${(data.size / 1024).toFixed(1)} KB` 
        : `${(data.size / (1024 * 1024)).toFixed(2)} MB`
  ) : ''

  const handleCopyContent = () => {
    if (data.content) {
      navigator.clipboard.writeText(data.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyPath = () => {
    navigator.clipboard.writeText(data.path)
    setCopiedPath(true)
    setTimeout(() => setCopiedPath(false), 2000)
  }

  return (
    <div className={clsx("fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150", themeStyle.modalBackdropBg || "bg-black/80 backdrop-blur-md")}>
      <div className={clsx("border rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden", themeStyle.modalBg)}>
        
        {/* Top Header Bar */}
        <div className={clsx("px-5 py-3 border-b flex items-center justify-between shrink-0 gap-3", themeStyle.modalHeaderBg)}>
          {/* File Meta info */}
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            {data.isImage ? (
              <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />
            ) : (
              <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
            )}
            <div className="min-w-0 truncate">
              <div className="flex items-center space-x-2">
                <span className={clsx("text-xs font-semibold truncate", themeStyle.textPrimary)}>{fileName}</span>
                <span className={clsx("text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border shrink-0", themeStyle.kbdBg)}>
                  {ext || 'FILE'}
                </span>
                {formattedSize && (
                  <span className={clsx("text-[11px] font-mono shrink-0", themeStyle.textMuted)}>• {formattedSize}</span>
                )}
                {data.isText && (
                  <span className={clsx("text-[11px] font-mono shrink-0", themeStyle.textMuted)}>• {lines.length} 行</span>
                )}
              </div>
              <div 
                onClick={handleCopyPath}
                title={`点击复制完整路径: ${data.path}`}
                className={clsx("text-[10.5px] font-mono truncate hover:underline cursor-pointer flex items-center gap-1 mt-0.5", themeStyle.textSecondary)}
              >
                <span className="truncate">{data.path}</span>
                {copiedPath ? (
                  <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-2.5 h-2.5 opacity-60 hover:opacity-100 shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Search within code */}
            {data.isText && !data.isOversized && (
              <div className="relative w-48 sm:w-56">
                <Search className={clsx("w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2", themeStyle.textMuted)} />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={clsx(
                    "w-full border rounded-lg pl-8 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500",
                    themeStyle.inputBg,
                    themeStyle.inputBorder,
                    themeStyle.textPrimary
                  )}
                />
              </div>
            )}

            {/* External Editor Button */}
            {onOpenInEditor && (
              <button
                onClick={() => onOpenInEditor(data.path)}
                className={clsx("px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 border", themeStyle.buttonSecondary)}
                title={t.openInEditor}
              >
                <ExternalLink className="w-3 h-3 text-indigo-500" />
                <span className="hidden sm:inline">{t.openInEditor}</span>
              </button>
            )}

            {/* Reveal in Finder Button */}
            {onRevealInFinder && (
              <button
                onClick={() => onRevealInFinder(data.path)}
                className={clsx("p-1.5 rounded-lg text-xs transition-colors border", themeStyle.buttonSecondary)}
                title={t.revealInFinder}
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Copy Content Button */}
            {data.isText && !data.isOversized && (
              <button
                onClick={handleCopyContent}
                className={clsx("px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 border", themeStyle.buttonSecondary)}
                title={t.copyAll}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span className="hidden sm:inline">{copied ? t.copied : t.copyAll}</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className={clsx("p-1.5 rounded-lg transition-colors", themeStyle.buttonGhost)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className={clsx("flex-1 overflow-hidden relative flex flex-col", themeStyle.codeBlockBg)}>
          {/* Case 1: Oversized File Protection */}
          {data.isOversized ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className={clsx("text-sm font-semibold", themeStyle.textPrimary)}>{t.oversizedTitle}</h4>
              <p className={clsx("text-xs leading-relaxed", themeStyle.textSecondary)}>
                {t.oversizedDesc.replace('{size}', formattedSize)}
              </p>
              <div className="flex items-center space-x-3 pt-2">
                {onOpenInEditor && (
                  <button
                    onClick={() => onOpenInEditor(data.path)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all flex items-center space-x-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t.openInEditor}</span>
                  </button>
                )}
                {onRevealInFinder && (
                  <button
                    onClick={() => onRevealInFinder(data.path)}
                    className={clsx("px-4 py-2 rounded-xl font-medium text-xs border transition-all flex items-center space-x-2", themeStyle.buttonSecondary)}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{t.revealInFinder}</span>
                  </button>
                )}
              </div>
            </div>
          ) : data.isBinary ? (
            /* Case 2: Binary File Notification */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className={clsx("w-12 h-12 rounded-2xl border flex items-center justify-center", themeStyle.kbdBg)}>
                <FileText className="w-6 h-6 opacity-75" />
              </div>
              <h4 className={clsx("text-sm font-semibold", themeStyle.textPrimary)}>{t.binaryTitle}</h4>
              <p className={clsx("text-xs leading-relaxed", themeStyle.textSecondary)}>{t.binaryDesc}</p>
              <div className="flex items-center space-x-3 pt-2">
                {onOpenInEditor && (
                  <button
                    onClick={() => onOpenInEditor(data.path)}
                    className={clsx("px-4 py-2 rounded-xl font-medium text-xs border transition-all flex items-center space-x-2", themeStyle.buttonSecondary)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t.openInEditor}</span>
                  </button>
                )}
                {onRevealInFinder && (
                  <button
                    onClick={() => onRevealInFinder(data.path)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all flex items-center space-x-2"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{t.revealInFinder}</span>
                  </button>
                )}
              </div>
            </div>
          ) : data.isImage ? (
            /* Case 3: Image Inspector with Zoom & Pan */
            <div className={clsx("flex-1 flex flex-col items-center justify-center p-6 relative overflow-auto custom-scrollbar select-none", themeStyle.isDark ? "bg-zinc-950" : "bg-slate-100/60")}>
              {/* Zoom Toolbar */}
              <div className={clsx(
                "absolute top-4 right-4 z-10 flex items-center space-x-1 p-1 border rounded-lg shadow-lg",
                themeStyle.isDark ? "bg-zinc-900/90 border-zinc-800 text-zinc-400" : "bg-white border-slate-200 text-slate-700 shadow-sm"
              )}>
                <button
                  onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                  className={clsx("p-1 rounded", themeStyle.buttonGhost)}
                  title={t.zoomIn}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1.5">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
                  className={clsx("p-1 rounded", themeStyle.buttonGhost)}
                  title={t.zoomOut}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className={clsx("p-1 rounded ml-0.5", themeStyle.buttonGhost)}
                  title={t.resetZoom}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Image element */}
              <div className="flex items-center justify-center min-h-full min-w-full">
                <img
                  src={data.dataUrl || (data.path.startsWith('/') ? `file://${data.path}` : data.path)}
                  alt={fileName}
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-100"
                />
              </div>
            </div>
          ) : (
            /* Case 4: Text / Source Code with Line Numbers */
            <div className="flex-1 overflow-auto font-mono text-xs custom-scrollbar select-text flex">
              {/* Line Numbers Column */}
              <div className={clsx(
                "py-4 select-none border-r text-right px-3 min-w-[52px] shrink-0 font-mono text-[11px]",
                themeStyle.isDark ? "bg-zinc-950 border-zinc-800/80 text-zinc-600" : "bg-slate-100 border-slate-200 text-slate-400"
              )}>
                {filteredLines.map(l => (
                  <div key={l.num} className="leading-relaxed">{l.num}</div>
                ))}
              </div>
              {/* Code Content */}
              <div className={clsx("py-4 px-4 flex-1 whitespace-pre leading-relaxed overflow-x-auto font-mono text-[11px]", themeStyle.textPrimary)}>
                {filteredLines.map((l, idx) => (
                  <div key={idx} className={themeStyle.isDark ? "hover:bg-zinc-900/50" : "hover:bg-slate-200/50"}>
                    {l.text || ' '}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
