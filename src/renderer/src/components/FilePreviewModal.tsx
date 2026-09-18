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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-[#121215] border border-zinc-700/80 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-[#18181c] shrink-0 gap-3">
          {/* File Meta info */}
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            {data.isImage ? (
              <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
            ) : (
              <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <div className="min-w-0 truncate">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-zinc-100 truncate">{fileName}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 shrink-0">
                  {ext || 'FILE'}
                </span>
                {formattedSize && (
                  <span className="text-[11px] text-zinc-500 font-mono shrink-0">• {formattedSize}</span>
                )}
                {data.isText && (
                  <span className="text-[11px] text-zinc-500 font-mono shrink-0">• {lines.length} 行</span>
                )}
              </div>
              <div 
                onClick={handleCopyPath}
                title={`点击复制完整路径: ${data.path}`}
                className="text-[10.5px] font-mono text-zinc-400 truncate hover:text-zinc-200 cursor-pointer flex items-center gap-1 mt-0.5"
              >
                <span className="truncate">{data.path}</span>
                {copiedPath ? (
                  <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
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
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* External Editor Button */}
            {onOpenInEditor && (
              <button
                onClick={() => onOpenInEditor(data.path)}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 border border-zinc-700/80"
                title={t.openInEditor}
              >
                <ExternalLink className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">{t.openInEditor}</span>
              </button>
            )}

            {/* Reveal in Finder Button */}
            {onRevealInFinder && (
              <button
                onClick={() => onRevealInFinder(data.path)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors border border-zinc-700/80"
                title={t.revealInFinder}
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Copy Content Button */}
            {data.isText && !data.isOversized && (
              <button
                onClick={handleCopyContent}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 border border-zinc-700/80"
                title={t.copyAll}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="hidden sm:inline">{copied ? t.copied : t.copyAll}</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-hidden bg-[#09090b] relative flex flex-col">
          {/* Case 1: Oversized File Protection */}
          {data.isOversized ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-200">{t.oversizedTitle}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
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
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition-all flex items-center space-x-2"
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
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-200">{t.binaryTitle}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{t.binaryDesc}</p>
              <div className="flex items-center space-x-3 pt-2">
                {onOpenInEditor && (
                  <button
                    onClick={() => onOpenInEditor(data.path)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition-all flex items-center space-x-2"
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
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-auto custom-scrollbar select-none bg-zinc-950">
              {/* Zoom Toolbar */}
              <div className="absolute top-4 right-4 z-10 flex items-center space-x-1 p-1 bg-zinc-900/90 border border-zinc-800 rounded-lg shadow-lg">
                <button
                  onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                  title={t.zoomIn}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-zinc-400 px-1.5">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                  title={t.zoomOut}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 ml-0.5"
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
            <div className="flex-1 overflow-auto bg-[#09090b] font-mono text-xs text-zinc-300 custom-scrollbar select-text flex">
              {/* Line Numbers Column */}
              <div className="py-4 select-none bg-zinc-950 border-r border-zinc-800/80 text-zinc-600 text-right px-3 min-w-[52px] shrink-0 font-mono text-[11px]">
                {filteredLines.map(l => (
                  <div key={l.num} className="leading-relaxed">{l.num}</div>
                ))}
              </div>
              {/* Code Content */}
              <div className="py-4 px-4 flex-1 whitespace-pre leading-relaxed overflow-x-auto font-mono text-[11px]">
                {filteredLines.map((l, idx) => (
                  <div key={idx} className="hover:bg-zinc-900/50">
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
