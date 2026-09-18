import React, { useEffect, useState, useMemo } from 'react'
import { 
  FileText, Code, Cpu, Database, ChevronRight, ChevronLeft, ChevronDown, 
  MessageSquare, Loader2, Maximize2, Bot, User, 
  Search, Check, Copy, Layers, GitFork, ArrowDownToLine,
  Sparkles, ExternalLink, RefreshCw, Terminal, X,
  SlidersHorizontal, Download, FolderArchive, FolderOpen, Folder,
  Filter, Eye, Calendar, Clock, HardDrive, CheckCircle2,
  ArrowRight, Share2, Settings, Zap, PanelRightOpen, PanelRightClose,
  FileCode, Wrench, Send, BookOpen, Pin, PinOff, ArrowUp, ArrowDown,
  CheckSquare, Square, UploadCloud, AlignLeft, ArrowRightLeft, Sliders,
  Languages, SunMoon
} from 'lucide-react'
import clsx from 'clsx'
import { Logo } from './components/Logo'
import { MarkdownRenderer } from './components/MarkdownRenderer'
import { SettingsModal } from './components/SettingsModal'
import { FilePreviewModal, FilePreviewData } from './components/FilePreviewModal'
import { ToastContainer, ToastMessage } from './components/Toast'
import { TurnOutline, ConversationTurn } from './components/TurnOutline'
import { TurnCard } from './components/TurnCard'
import { THEME_STYLES, AppTheme, AppThemeMode, resolveEffectiveTheme, getSystemTheme } from './theme'
import { useI18n } from './i18n'
import { sanitizePrompt } from './utils/promptSanitizer'
import { ErrorBoundary } from './components/ErrorBoundary'

interface ZSession {
  id: string
  parent_id?: string
  workspace?: string
  directory?: string
  title?: string
  task_type?: string
  time_created: number
  time_updated: number
  message_count?: number
  child_count?: number
  total_messages?: number
  children?: ZSession[]
}

interface DbStats {
  dbPath: string
  dbSize: string
  totalSessions: number
  rootSessionsCount: number
  childSessionsCount: number
  totalMessages: number
  workspaces: string[]
}

interface SessionAnalytics {
  modifiedFiles: string[]
  readFiles: string[]
  toolStats: Record<string, number>
  totalTokens?: number
  subagentCount: number
}

interface MessageItem {
  id: string
  session_id?: string
  sequence?: number
  time_created?: number
  created_at?: number
  role: string
  content?: string
  text?: string
  thought?: string
  reasoning?: string
  is_subagent?: boolean
  subagent_title?: string
  parts?: any[]
  tools?: any[]
  raw?: any
}

interface DetectedEcosystem {
  id: string
  name: string
  cliName: string
  formatExt: string
  status: 'active' | 'available' | 'not_installed'
  sessionCount: number
  path: string
  sizeText?: string
  description: string
  color: string
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days === 1) return '昨天'
  if (days < 30) return `${days} 天前`
  return new Date(timestamp).toLocaleDateString()
}

function App() {
  const [rootSessions, setRootSessions] = useState<ZSession[]>([])
  const [allSessions, setAllSessions] = useState<ZSession[]>([])
  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [includeChildren, setIncludeChildren] = useState<boolean>(true)
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({})
  const [showInspector, setShowInspector] = useState<boolean>(true)
  const [inspectorTab, setInspectorTab] = useState<'handoff' | 'files' | 'tools' | 'export'>('handoff')
  
  // i18n Multi-Language
  const { locale, setLocale, t: tr } = useI18n()

  // Theme & Appearance Preferences with Follow System Dark Mode
  const [themeMode, setThemeMode] = useState<AppThemeMode>(() => (localStorage.getItem('zm_theme_mode') as AppThemeMode) || 'system')
  const [effectiveTheme, setEffectiveTheme] = useState<AppTheme>(() => resolveEffectiveTheme(themeMode))
  const [fontSize, setFontSize] = useState<number>(() => Number(localStorage.getItem('zm_font_size')) || 13)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Reactive listener for OS dark/light mode preference
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => {
      if (themeMode === 'system') {
        setEffectiveTheme(mql.matches ? 'obsidian' : 'light')
      } else {
        setEffectiveTheme(themeMode as AppTheme)
      }
    }
    updateTheme()
    mql.addEventListener('change', updateTheme)
    return () => mql.removeEventListener('change', updateTheme)
  }, [themeMode])

  const handleThemeModeChange = (mode: AppThemeMode) => {
    setThemeMode(mode)
    localStorage.setItem('zm_theme_mode', mode)
    setEffectiveTheme(resolveEffectiveTheme(mode))
  }

  // Universal File Preview Modal (Code, Text, Markdown, Image, Oversized Protection)
  const [previewModalData, setPreviewModalData] = useState<FilePreviewData | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Floating Non-blocking Toast System for Safety & Error Fallbacks
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Safe file preview & inspection pipeline with multi-tier fallback
  const handlePreviewFile = async (targetPath: string) => {
    if (!targetPath) return
    const currentWs = currentSessionMeta?.directory || currentSessionMeta?.workspace
    try {
      // @ts-ignore
      const res = await window.api.readFilePreview(targetPath, currentWs)
      if (res.isDirectory) {
        addToast({
          type: 'info',
          title: locale === 'en-US' ? 'Opened in Finder' : '已在访达中定位目录',
          description: res.path
        })
        return
      }
      if (res.success) {
        setPreviewModalData({
          ...res,
          path: res.path || targetPath
        })
        setPreviewModalOpen(true)
        return
      }
      // Non-blocking fallback notification for invalid path / detection false positive
      addToast({
        type: 'warning',
        title: tr('preview.notFoundToast'),
        description: targetPath,
        actionLabel: tr('preview.copyPath'),
        onAction: () => {
          navigator.clipboard.writeText(targetPath)
          addToast({
            type: 'success',
            title: tr('toast.copied'),
            duration: 1500
          })
        }
      })
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Preview error',
        description: String(err?.message || err)
      })
    }
  }

  // Pinned Sessions & Sorting & Batch Mode
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('zm_pinned_ids')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch (e) {
      return new Set()
    }
  })
  const [sortBy, setSortBy] = useState<'time' | 'messages' | 'created'>('time')
  const [batchMode, setBatchMode] = useState(false)
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set())

  // Local CLI Ecosystem Radar & Universal Session Import
  const [ecosystems, setEcosystems] = useState<DetectedEcosystem[]>([])
  const [showEcosystemRadar, setShowEcosystemRadar] = useState(false)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [workspaceFilter, setWorkspaceFilter] = useState<string>('all')
  const [filterMode, setFilterMode] = useState<'roots' | 'with_subagents' | 'all'>('roots')
  const [inSessionSearch, setInSessionSearch] = useState('')
  const [fileSearch, setFileSearch] = useState('')
  const [msgFilter, setMsgFilter] = useState<'all' | 'qa_only' | 'tools_only' | 'thoughts_only'>('all')

  // Pagination for Ultra-Long Conversations
  const [visibleMsgCount, setVisibleMsgCount] = useState<number>(40)

  // Agent Ecosystem Switcher & CC-Switch Turns
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all')
  const [selectedSessionSource, setSelectedSessionSource] = useState<string>('zcode')
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(1)
  const [viewMode, setViewMode] = useState<'stream' | 'card'>('card')
  const [showOutline, setShowOutline] = useState<boolean>(true)

  // Transcript Data
  const [transcriptData, setTranscriptData] = useState<{
    meta: any
    messages: MessageItem[]
    sessionCount: number
    descendantCount: number
    analytics?: SessionAnalytics
  } | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({})
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})

  // Preview Modal
  const [previewModal, setPreviewModal] = useState<{
    open: boolean
    title: string
    format: string
    content: string
    filename: string
    messageCount: number
  } | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleThemeChange = (newTheme: AppTheme) => {
    handleThemeModeChange(newTheme)
  }

  const handleFontSizeChange = (sz: number) => {
    setFontSize(sz)
    localStorage.setItem('zm_font_size', String(sz))
  }

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(pinnedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPinnedIds(next)
    localStorage.setItem('zm_pinned_ids', JSON.stringify(Array.from(next)))
  }

  const toggleBatchSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selectedBatchIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedBatchIds(next)
  }

  const loadSessions = (agentFilter: string = selectedAgentFilter) => {
    const filter = typeof agentFilter === 'string' ? agentFilter : selectedAgentFilter
    // @ts-ignore
    window.api.getSessions(filter).then((res: any) => {
      if (res.success) {
        const list = res.data.sessions || res.data.rootSessions || []
        setRootSessions(list)
        setAllSessions(list)
        setDbStats(res.data.stats)
        const currentStillValid = list.length > 0 && selectedSessionId && list.some((s: any) => s.id === selectedSessionId && (filter === 'all' || s.source === filter))
        if (!currentStillValid && list.length > 0) {
          setSelectedSessionId(list[0].id)
          setSelectedSessionSource(list[0].source || 'zcode')
        }
      } else {
        setError(res.error)
      }
    })

    // Scan local CLI ecosystems
    // @ts-ignore
    window.api.scanLocalEcosystem().then((res: any) => {
      if (res?.success && Array.isArray(res.data)) {
        setEcosystems(res.data)
      } else if (Array.isArray(res)) {
        setEcosystems(res)
      }
    })
  }

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (!selectedSessionId) return
    setLoading(true)
    setVisibleMsgCount(40)
    // @ts-ignore
    window.api.getSessionTranscript(selectedSessionId, includeChildren, selectedSessionSource).then((res: any) => {
      if (res.success) {
        setTranscriptData(res.data)
        setCurrentTurnIndex(1)
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
  }, [selectedSessionId, includeChildren, selectedSessionSource])

  // CC-Switch Keyboard Shortcuts: Alt+Up / Alt+Down to flip turns, Cmd+O to toggle outline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const turnsCount = (transcriptData as any)?.turns?.length || 0
      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault()
        setCurrentTurnIndex(prev => Math.min(turnsCount || 1, prev + 1))
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault()
        setCurrentTurnIndex(prev => Math.max(1, prev - 1))
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        setShowOutline(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [(transcriptData as any)?.turns?.length])

  const toggleParentExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleThought = (id: string) => {
    setExpandedThoughts(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleTool = (id: string) => {
    setExpandedTools(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    showToast('已复制内容到剪贴板')
  }

  const handleExport = async (format: string) => {
    if (!selectedSessionId) return
    // @ts-ignore
    const res = await window.api.exportSessionFormatted(selectedSessionId, format, includeChildren, selectedSessionSource)
    if (res.success) {
      showToast(`已成功导出至: ${res.filename}`)
    } else if (res.error !== 'Cancelled') {
      showToast(`导出错误: ${res.error}`)
    }
  }

  const handlePreview = async (format: string) => {
    if (!selectedSessionId) return
    // @ts-ignore
    const res = await window.api.previewExport(selectedSessionId, format, includeChildren, selectedSessionSource)
    if (res.success) {
      setPreviewModal({
        open: true,
        title: `导出格式预览 (${format.toUpperCase()})`,
        format,
        content: res.content,
        filename: res.filename,
        messageCount: res.messageCount
      })
    } else {
      showToast(`预览生成失败: ${res.error}`)
    }
  }

  const handleCopyHandoff = async () => {
    if (!selectedSessionId) return
    // @ts-ignore
    const res = await window.api.previewExport(selectedSessionId, 'handoff', includeChildren, selectedSessionSource)
    if (res.success) {
      copyText(res.content, 'handoff-btn')
      showToast('已复制 AI 无损接力上下文提示词！可直接粘贴给新模型')
    }
  }

  const handleBatchExport = async () => {
    // @ts-ignore
    const res = await window.api.batchExportAll('opencode', includeChildren)
    if (res.success) {
      showToast(`批量导出成功！共导出 ${res.exportedCount} 个会话`)
    } else if (res.error !== 'Cancelled') {
      showToast(`批量导出错误: ${res.error}`)
    }
  }

  const handleSelectCustomDb = async () => {
    // @ts-ignore
    const res = await window.api.selectCustomDb()
    if (res.success) {
      showToast(`已切换至 SQLite 数据库: ${res.dbPath.split('/').pop()}`)
      loadSessions()
    }
  }

  const handleImportSession = async () => {
    // @ts-ignore
    const res = await window.api.importSessionFile()
    if (res.success && res.data) {
      showToast(`已成功导入会话: ${res.data.meta?.title || '外部导入会话'}`)
      setSelectedSessionId(res.data.meta?.id || 'imported_' + Date.now())
      setTranscriptData(res.data)
      setVisibleMsgCount(40)
    } else if (res.error && res.error !== 'Cancelled') {
      showToast(`导入失败: ${res.error}`)
    }
  }

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let list: ZSession[] = []
    if (filterMode === 'all') {
      list = [...allSessions]
    } else if (filterMode === 'with_subagents') {
      list = rootSessions.filter(s => (s.child_count || 0) > 0)
    } else {
      list = [...rootSessions]
    }

    // Strict front-end ecosystem isolation filter
    if (selectedAgentFilter !== 'all') {
      list = list.filter(s => (s as any).source === selectedAgentFilter)
    }

    if (workspaceFilter !== 'all') {
      list = list.filter(s => (s.directory || s.workspace) === workspaceFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s => 
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.directory && s.directory.toLowerCase().includes(q)) ||
        (s.id && s.id.toLowerCase().includes(q))
      )
    }

    // Sort: pinned first, then by selected sort
    return list.sort((a, b) => {
      const aPinned = pinnedIds.has(a.id) ? 1 : 0
      const bPinned = pinnedIds.has(b.id) ? 1 : 0
      if (aPinned !== bPinned) return bPinned - aPinned

      if (sortBy === 'messages') {
        const aMsgs = a.total_messages !== undefined ? a.total_messages : (a.message_count || 0)
        const bMsgs = b.total_messages !== undefined ? b.total_messages : (b.message_count || 0)
        return bMsgs - aMsgs
      }
      if (sortBy === 'created') {
        return b.time_created - a.time_created
      }
      return b.time_updated - a.time_updated
    })
  }, [rootSessions, allSessions, filterMode, selectedAgentFilter, workspaceFilter, searchQuery, pinnedIds, sortBy])

  const currentSessionMeta = useMemo(() => {
    return allSessions.find(s => s.id === selectedSessionId) || transcriptData?.meta
  }, [allSessions, selectedSessionId, transcriptData])

  const displayMessages = useMemo(() => {
    if (!transcriptData?.messages) return []
    let msgs = transcriptData.messages

    msgs = msgs.filter(m => {
      const parts = m.parts || []
      const tools = m.tools || []
      const hasTools = parts.some(p => p.type === 'tool' || p.tool_name || p.tool) || tools.length > 0
      const hasTimeline = parts.some(p => p.type === 'timeline')
      const content = m.content || m.text || ''
      const thought = m.thought || m.reasoning || ''
      const hasContent = Boolean(content.trim())
      const hasThought = Boolean(thought.trim())
      const r = (m.role || '').toLowerCase()
      return hasContent || hasThought || hasTools || hasTimeline || r === 'user'
    })

    if (inSessionSearch.trim()) {
      const q = inSessionSearch.toLowerCase()
      msgs = msgs.filter(m => {
        const content = (m.content || m.text || '').toLowerCase()
        const thought = (m.thought || m.reasoning || '').toLowerCase()
        const subTitle = (m.subagent_title || '').toLowerCase()
        const partsMatch = m.parts && m.parts.some(p => 
          (p.tool_name && p.tool_name.toLowerCase().includes(q)) || 
          (p.tool_args_json && p.tool_args_json.toLowerCase().includes(q))
        )
        const toolsMatch = m.tools && m.tools.some((toolItem: any) => 
          (toolItem.name && toolItem.name.toLowerCase().includes(q)) ||
          (toolItem.args && JSON.stringify(toolItem.args).toLowerCase().includes(q))
        )
        return content.includes(q) || thought.includes(q) || subTitle.includes(q) || partsMatch || toolsMatch
      })
    }

    if (msgFilter === 'qa_only') {
      msgs = msgs.filter(m => !m.is_subagent && (m.content || m.text || m.thought || m.reasoning))
    } else if (msgFilter === 'tools_only') {
      msgs = msgs.filter(m => (m.parts && m.parts.some(p => p.type === 'tool' || p.tool_name)) || (m.tools && m.tools.length > 0))
    } else if (msgFilter === 'thoughts_only') {
      msgs = msgs.filter(m => Boolean(m.thought || m.reasoning))
    }

    return msgs
  }, [transcriptData, inSessionSearch, msgFilter])

  // Virtualized slice for ultra-long conversations (e.g. 1900+ messages)
  const pagedMessages = useMemo(() => {
    if (displayMessages.length <= visibleMsgCount) return displayMessages
    return displayMessages.slice(-visibleMsgCount)
  }, [displayMessages, visibleMsgCount])

  const analytics = transcriptData?.analytics

  const filteredModifiedFiles = useMemo(() => {
    if (!analytics?.modifiedFiles) return []
    if (!fileSearch.trim()) return analytics.modifiedFiles
    return analytics.modifiedFiles.filter(f => f.toLowerCase().includes(fileSearch.toLowerCase()))
  }, [analytics, fileSearch])

  // Scroll to top or bottom
  const scrollToEdge = (edge: 'top' | 'bottom') => {
    const el = document.getElementById('message-feed-container')
    if (el) {
      el.scrollTo({ top: edge === 'top' ? 0 : el.scrollHeight, behavior: 'smooth' })
    }
  }

  // Active theme style tokens
  const t = THEME_STYLES[effectiveTheme] || THEME_STYLES.obsidian

  return (
    <div className={clsx("flex h-screen font-sans select-none overflow-hidden antialiased", t.appBg, t.textSecondary)} style={{ fontSize: `${fontSize}px` }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-5 right-8 z-50 flex items-center space-x-2 bg-zinc-800/95 text-zinc-100 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-xl border border-zinc-700/60 text-xs font-medium animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentThemeMode={themeMode}
        onThemeModeChange={handleThemeModeChange}
        locale={locale}
        onLocaleChange={setLocale}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        dbPath={dbStats?.dbPath}
        onSelectCustomDb={handleSelectCustomDb}
        onRefreshDb={loadSessions}
      />

      {/* Universal File & Code & Image Preview Modal */}
      <ErrorBoundary fallbackTitle="文件预览组件遇到异常">
        <FilePreviewModal
          open={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          data={previewModalData}
          theme={effectiveTheme}
          locale={locale}
          onOpenInEditor={(p) => (window as any).api.openInEditor(p)}
          onRevealInFinder={(p) => (window as any).api.openInFolder(p)}
        />
      </ErrorBoundary>

      {/* Crash-Proof Floating Toast System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#18181b]">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">{previewModal.title}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{previewModal.filename} • {previewModal.messageCount} {locale === 'en-US' ? 'messages' : '条消息'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyText(previewModal.content, 'preview-modal')}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 border border-zinc-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{locale === 'en-US' ? 'Copy All' : '复制全文'}</span>
                </button>
                <button
                  onClick={() => handleExport(previewModal.format)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{locale === 'en-US' ? 'Save to File...' : '保存至文件...'}</span>
                </button>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#09090b] font-mono text-xs text-zinc-300 custom-scrollbar select-text">
              <pre className="whitespace-pre-wrap leading-relaxed">{previewModal.content.slice(0, 100000)}</pre>
              {previewModal.content.length > 100000 && (
                <div className="p-3 text-center text-zinc-500 text-xs italic border-t border-zinc-800 mt-4">
                  {locale === 'en-US' ? '(Showing first 100,000 characters, full data saved on export)' : '（预览展示前 100,000 字符，保存时写入完整数据）'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pane 1: Left Sidebar (Sessions Explorer & Ecosystem Radar) */}
      <div className={clsx(
        "w-[340px] border-r flex flex-col shrink-0 relative transition-colors",
        t.sidebarBg, t.border
      )}>
        {/* macOS Traffic Lights Safe Zone & Brand Header */}
        <div className={clsx(
          "pt-9 pb-3 px-4 border-b transition-colors",
          t.sidebarHeaderBg, t.border
        )}>
          <div className="flex items-center space-x-3 mb-3 pl-16">
            <Logo className="w-8 h-8 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className={clsx("font-bold text-sm tracking-tight", t.textPrimary)}>
                  AgentSwitch
                </h1>
                <span className={clsx(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                  t.tagBg, t.tagText, t.border
                )}>
                  v2.6
                </span>
              </div>
              <p className={clsx("text-[11px] truncate mt-0.5", t.textMuted)}>{tr('brand.tagline')}</p>
            </div>
            
            {/* Action Buttons: Language Switch & Settings */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => setLocale(locale === 'zh-CN' ? 'en-US' : 'zh-CN')}
                title={locale === 'zh-CN' ? 'Switch to English' : '切换至简体中文'}
                className={clsx("px-2 py-1 rounded-lg text-[10px] font-mono font-medium transition-colors border flex items-center gap-1", t.tagBg, t.border, t.textSecondary, "hover:text-white")}
              >
                <Languages className="w-3 h-3 text-indigo-400" />
                <span>{locale === 'zh-CN' ? 'EN' : '中'}</span>
              </button>
              <button 
                onClick={() => setSettingsOpen(true)}
                title={tr('settings.title')}
                className={clsx("p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10", t.textMuted)}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Unified High-Density Ecosystem Switcher (CC-Switch Style, Zero Horizontal Overflow) */}
          <div className="grid grid-cols-3 gap-1 mb-2.5">
            {[
              { 
                id: 'all', 
                label: tr('ecosystem.all'), 
                color: '#6366f1', 
                count: ecosystems.reduce((sum, e) => sum + (e.sessionCount || 0), 0) || allSessions.length 
              },
              { 
                id: 'zcode', 
                label: tr('ecosystem.zcode'), 
                color: '#6366f1', 
                count: ecosystems.find(e => e.id === 'zcode')?.sessionCount ?? 0 
              },
              { 
                id: 'antigravity', 
                label: tr('ecosystem.antigravity'), 
                color: '#a855f7', 
                count: ecosystems.find(e => e.id === 'antigravity')?.sessionCount ?? 0 
              },
              { 
                id: 'claude', 
                label: tr('ecosystem.claude'), 
                color: '#f59e0b', 
                count: ecosystems.find(e => e.id === 'claude')?.sessionCount ?? 0 
              },
              { 
                id: 'codex', 
                label: tr('ecosystem.codex'), 
                color: '#10b981', 
                count: ecosystems.find(e => e.id === 'codex')?.sessionCount ?? 0 
              },
              { 
                id: 'opencode', 
                label: tr('ecosystem.opencode'), 
                color: '#38bdf8', 
                count: ecosystems.find(e => e.id === 'opencode')?.sessionCount ?? 0 
              }
            ].map(tab => {
              const isActive = selectedAgentFilter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedAgentFilter(tab.id)
                    loadSessions(tab.id)
                  }}
                  className={clsx(
                    "flex items-center justify-between px-1.5 py-1 rounded-md text-[10.5px] font-medium transition-all border text-left",
                    isActive
                      ? "bg-indigo-600/25 text-indigo-200 border-indigo-500/90 shadow-xs ring-1 ring-indigo-500/40 font-semibold"
                      : clsx(t.cardBg, t.border, t.textSecondary, "hover:bg-white/5 hover:border-zinc-700")
                  )}
                >
                  <div className="flex items-center space-x-1 truncate min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tab.color }} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  <span className={clsx(
                    "text-[9px] font-mono px-1 rounded ml-0.5 shrink-0",
                    isActive ? "bg-indigo-500/30 text-indigo-200 font-bold" : clsx(t.tagBg, t.textMuted)
                  )}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Compact Radar & Quick Action Strip */}
          <div className={clsx("mb-2 rounded-lg border px-2.5 py-1.5 transition-all", t.cardBg, t.border)}>
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setShowEcosystemRadar(!showEcosystemRadar)}
                className="flex items-center space-x-1.5 hover:opacity-80 transition-opacity text-[11px]"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className={clsx("font-semibold", t.textPrimary)}>
                  {tr('radar.title')} ({ecosystems.filter(e => e.status === 'active').length} {tr('radar.online')})
                </span>
                <ChevronDown className={clsx("w-3 h-3 transition-transform text-zinc-400", showEcosystemRadar && "rotate-180")} />
              </button>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleImportSession}
                  className={clsx("px-2 py-0.5 rounded text-[10px] font-medium border flex items-center space-x-1 transition-colors", t.tagBg, t.tagText, t.border)}
                  title={tr('radar.importTooltip')}
                >
                  <UploadCloud className="w-3 h-3" />
                  <span>{tr('radar.importBtn')}</span>
                </button>
                {dbStats && (
                  <button 
                    onClick={handleBatchExport}
                    className={clsx("px-2 py-0.5 rounded text-[10px] font-medium border flex items-center space-x-1 transition-colors", t.accentBg, "text-white border-transparent")}
                    title={tr('radar.exportTooltip')}
                  >
                    <FolderArchive className="w-3 h-3" />
                    <span>{tr('radar.exportBtn')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Radar Detail Card */}
            {showEcosystemRadar && (
              <div className={clsx("mt-2 pt-2 border-t space-y-1.5", t.border)}>
                {ecosystems.map(eco => (
                  <div key={eco.id} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: eco.color }} />
                      <span className={clsx("font-medium", eco.status === 'active' ? t.textPrimary : t.textMuted)}>
                        {eco.name}
                      </span>
                      <span className={clsx("text-[10px] font-mono", t.textMuted)}>
                        {eco.formatExt}
                      </span>
                    </div>
                    <span className={clsx("text-[10px] font-mono", eco.status === 'active' ? t.accentText : t.textMuted)}>
                      {eco.status === 'active' ? (eco.sizeText || `${eco.sessionCount} 会话`) : (locale === 'en-US' ? 'Not detected' : '未检出')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Micro DB Health Bar */}
          {dbStats && (
            <div className={clsx("flex items-center justify-between px-1 text-[10px] mb-2 font-mono", t.textMuted)}>
              <div className="flex items-center space-x-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className={t.textPrimary}>{dbStats.dbSize}</span>
                <span>•</span>
                <span>{dbStats.totalSessions} {locale === 'en-US' ? 'Sessions' : '会话'}</span>
                <span>•</span>
                <span>{dbStats.totalMessages} {locale === 'en-US' ? 'Messages' : '消息'}</span>
              </div>
            </div>
          )}

          {/* Search Box & Sort Controls */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder={tr('search.placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={clsx(
                  "w-full border rounded-lg pl-9 pr-8 py-1.5 text-xs placeholder-zinc-500 focus:outline-none transition-all",
                  t.inputBg, t.inputBorder, t.textPrimary
                )}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort & Batch Toggle Bar */}
            <div className={clsx("flex items-center justify-between text-[11px] px-1", t.textMuted)}>
              <div className="flex items-center space-x-1.5">
                <span>{tr('search.sortBy')}:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className={clsx("bg-transparent focus:outline-none cursor-pointer", t.textPrimary)}
                >
                  <option value="time">{tr('search.recent')}</option>
                  <option value="messages">{tr('search.mostMessages')}</option>
                  <option value="created">{locale === 'en-US' ? 'Created Time' : '创建时间'}</option>
                </select>
              </div>

              <button
                onClick={() => setBatchMode(!batchMode)}
                className={clsx(
                  "text-[10px] px-1.5 py-0.5 rounded transition-colors flex items-center space-x-1",
                  batchMode ? clsx(t.accentBg, "text-white") : clsx(t.textMuted, "hover:opacity-100")
                )}
              >
                <span>{batchMode ? (locale === 'en-US' ? 'Done' : '完成多选') : tr('search.batchSelect')}</span>
              </button>
            </div>
          </div>

          {/* Workspace Filter Dropdown */}
          {dbStats?.workspaces && dbStats.workspaces.length > 1 && (
            <div className="mt-2 flex items-center space-x-2 text-[11px]">
              <span className={clsx("shrink-0", t.textMuted)}>{locale === 'en-US' ? 'Workspace:' : '工作区:'}</span>
              <select
                value={workspaceFilter}
                onChange={e => setWorkspaceFilter(e.target.value)}
                className={clsx(
                  "flex-1 border rounded px-2 py-1 text-[11px] focus:outline-none truncate",
                  t.inputBg, t.inputBorder, t.textPrimary
                )}
              >
                <option value="all">{tr('search.allWorkspaces')} ({allSessions.length})</option>
                {dbStats.workspaces?.map(ws => (
                  <option key={ws} value={ws}>
                    {ws.split('/').slice(-2).join('/')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Tabs */}
          <div className={clsx(
            "grid grid-cols-3 gap-1 mt-2 p-0.5 rounded-lg border text-[11px]",
            t.inputBg, t.border
          )}>
            <button
              onClick={() => setFilterMode('roots')}
              className={clsx(
                "py-1 rounded font-medium transition-all text-center",
                filterMode === 'roots' 
                  ? clsx(t.cardActiveBg, t.cardBorderActive, t.textPrimary, "shadow-sm") 
                  : clsx(t.textMuted, "hover:opacity-100")
              )}
            >
              {tr('search.mainTasks')} ({rootSessions.length})
            </button>
            <button
              onClick={() => setFilterMode('with_subagents')}
              className={clsx(
                "py-1 rounded font-medium transition-all text-center",
                filterMode === 'with_subagents' 
                  ? clsx(t.cardActiveBg, t.cardBorderActive, t.textPrimary, "shadow-sm") 
                  : clsx(t.textMuted, "hover:opacity-100")
              )}
            >
              {tr('search.subTasks')}
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={clsx(
                "py-1 rounded font-medium transition-all text-center",
                filterMode === 'all' 
                  ? clsx(t.cardActiveBg, t.cardBorderActive, t.textPrimary, "shadow-sm") 
                  : clsx(t.textMuted, "hover:opacity-100")
              )}
            >
              {tr('search.allSessions')} ({allSessions.length})
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {error && <div className="text-red-400 p-3 text-xs bg-red-950/40 rounded-lg border border-red-800/40">{error}</div>}
          
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 text-xs">未找到匹配的会话</div>
          ) : (
            filteredSessions.map(s => {
              const isSelected = selectedSessionId === s.id
              const isPinned = pinnedIds.has(s.id)
              const isChecked = selectedBatchIds.has(s.id)
              const hasChildren = (s.children && s.children.length > 0) || (s.child_count || 0) > 0
              const isExpanded = expandedParents[s.id]
              const sessionKey = `${(s as any).source || 'zcode'}_${s.id}`

              return (
                <div key={sessionKey} className="space-y-1">
                  <div
                    onClick={() => {
                      setSelectedSessionId(s.id);
                      setSelectedSessionSource((s as any).source || "zcode");
                    }}
                    className={clsx(
                      "w-full text-left p-3 rounded-xl cursor-pointer transition-all relative border",
                      isSelected 
                        ? clsx(t.cardActiveBg, t.cardBorderActive)
                        : clsx(t.cardBg, t.cardBorder)
                    )}
                  >
                    {/* Active Left Pill */}
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full" />
                    )}

                    <div className="flex items-start justify-between space-x-2 pl-1.5">
                      {/* Batch Checkbox */}
                      {batchMode && (
                        <button
                          onClick={(e) => toggleBatchSelect(s.id, e)}
                          className={clsx("mt-0.5 hover:text-indigo-400", t.textMuted)}
                        >
                          {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {isPinned && <Pin className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400/20" />}
                          {hasChildren ? (
                            <Layers className={clsx("w-3.5 h-3.5 shrink-0", t.accentText)} />
                          ) : (
                            <MessageSquare className={clsx("w-3.5 h-3.5 shrink-0", t.textMuted)} />
                          )}
                          <h4 className={clsx("truncate font-semibold text-xs", isSelected ? t.textPrimary : t.textSecondary)} title={s.title}>
                            {s.title || '无标题会话'}
                          </h4>
                        </div>

                        <div className={clsx("flex items-center space-x-1.5 text-[10px] mt-1 flex-wrap", t.textMuted)}>
                          <span 
                            className="text-[9px] font-medium px-1.5 py-0.2 rounded font-mono shrink-0 border"
                            style={{ 
                              borderColor: `${(s as any).sourceColor || '#6366f1'}40`, 
                              color: (s as any).sourceColor || '#818cf8', 
                              backgroundColor: `${(s as any).sourceColor || '#6366f1'}18` 
                            }}
                          >
                            {(s as any).sourceName || ((s as any).source ? (s as any).source.toUpperCase() : 'ZCode')}
                          </span>
                          <span>{formatRelativeTime(s.time_created)}</span>
                          <span>•</span>
                          <span className="font-mono">
                            {s.total_messages !== undefined ? `${s.total_messages} 消息` : `${s.message_count} 消息`}
                          </span>
                          {s.directory && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[90px]" title={s.directory}>
                                {s.directory.split('/').pop()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right Action Icons: Pin & Expand */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={(e) => togglePin(s.id, e)}
                          className={clsx("p-1 rounded transition-colors", isPinned ? "text-amber-400" : clsx(t.textMuted, "opacity-0 group-hover:opacity-100"))}
                          title={isPinned ? "取消置顶" : "置顶会话"}
                        >
                          <Pin className="w-3 h-3" />
                        </button>

                        {hasChildren && filterMode !== 'all' && (
                          <button
                            onClick={(e) => toggleParentExpand(s.id, e)}
                            className={clsx("p-1 rounded transition-colors", t.textMuted)}
                            title="展开/折叠子任务"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {hasChildren && filterMode !== 'all' && (
                      <div className="mt-2 flex items-center space-x-1.5 pl-1.5">
                        <span className={clsx(
                          "inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] border font-medium",
                          t.tagBg, t.tagText, t.border
                        )}>
                          <GitFork className={clsx("w-3 h-3", t.accentText)} />
                          <span>聚合 {s.child_count || s.children?.length} 个子任务 Agent</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Subagent Hierarchical Tree */}
                  {isExpanded && s.children && s.children.length > 0 && (
                    <div className={clsx("pl-4 pr-1 py-1 space-y-1 border-l ml-4", t.border)}>
                      {s.children.map(child => (
                        <div
                          key={`${(child as any).source || (s as any).source || 'zcode'}_${child.id}`}
                          onClick={() => {
                            setSelectedSessionId(child.id)
                            setSelectedSessionSource((child as any).source || 'zcode')
                          }}
                          className={clsx(
                            "p-2 rounded-lg text-left cursor-pointer transition-all border text-[11px]",
                            selectedSessionId === child.id
                              ? clsx(t.cardActiveBg, t.cardBorderActive, t.textPrimary)
                              : clsx(t.cardBg, t.cardBorder, t.textMuted)
                          )}
                        >
                          <div className={clsx("truncate font-medium", selectedSessionId === child.id ? t.textPrimary : t.textSecondary)} title={child.title}>
                            {child.title || '独立执行子任务'}
                          </div>
                          <div className={clsx("text-[9px] mt-0.5 flex justify-between", t.textMuted)}>
                            <span>{new Date(child.time_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="font-mono">{child.message_count} 条</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Pane 2: Center (Conversation Stream) */}
      <div className={clsx(
        "flex-1 flex flex-col relative min-w-0 border-r transition-colors",
        t.mainBg, t.border
      )}>
        {selectedSessionId ? (
          <>
            {/* Top Session Header */}
            <div className={clsx(
              "py-3.5 px-6 border-b flex flex-col justify-between shrink-0 transition-colors",
              t.headerBg, t.border
            )}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className={clsx("text-base font-bold truncate", t.textPrimary)} title={currentSessionMeta?.title}>
                    {currentSessionMeta?.title || '会话详情'}
                  </h2>
                </div>

                {/* Right Controls */}
                <div className="flex items-center space-x-2.5 shrink-0">
                  {transcriptData && transcriptData.descendantCount > 0 && (
                    <button
                      onClick={() => setIncludeChildren(!includeChildren)}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 border",
                        includeChildren
                          ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                          : clsx(t.tagBg, t.tagText, t.border)
                      )}
                      title="开启后将该任务与其派生的所有子 Agent 对话按时序完整合并"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{includeChildren ? '已时序合并子任务' : '仅主任务'}</span>
                    </button>
                  )}

                  <div className="flex items-center p-0.5 rounded-lg border text-[11px]" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <button
                      onClick={() => setViewMode('stream')}
                      className={clsx(
                        "px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center space-x-1.5",
                        viewMode === 'stream' ? "bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold shadow-xs" : clsx(t.textMuted, "hover:text-zinc-200")
                      )}
                      title="连续流式视图"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>{tr('view.stream')}</span>
                    </button>
                    <button
                      onClick={() => setViewMode('card')}
                      className={clsx(
                        "px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center space-x-1.5",
                        viewMode === 'card' ? "bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold shadow-xs" : clsx(t.textMuted, "hover:text-zinc-200")
                      )}
                      title="轮次卡片视图 (⌥↑ / ⌥↓)"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{tr('view.card')}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowOutline(!showOutline)}
                    className={clsx(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 border",
                      showOutline ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40" : clsx(t.tagBg, t.tagText, t.border)
                    )}
                    title="展开/收起大纲 (⌘O)"
                  >
                    <Layers className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{tr('view.outline', { count: (transcriptData as any)?.turns?.length || 0 })}</span>
                  </button>

                  <button
                    onClick={handleCopyHandoff}
                    className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 border", t.tagBg, t.tagText, t.border)}
                    title={tr('view.handoffBtn')}
                  >
                    <Share2 className={clsx("w-3.5 h-3.5", t.accentText)} />
                    <span>{tr('view.handoffBtn')}</span>
                  </button>

                  <button
                    onClick={() => setShowInspector(!showInspector)}
                    className={clsx(
                      "p-1.5 rounded-lg text-xs transition-colors border",
                      showInspector ? clsx(t.cardActiveBg, t.textPrimary, t.cardBorderActive) : clsx(t.tagBg, t.tagText, t.border)
                    )}
                    title={tr('view.toggleDrawer')}
                  >
                    {showInspector ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Subheader: Directory Path & Metrics */}
              <div className={clsx("flex items-center justify-between text-[11px] pt-1 border-t", t.border, t.textMuted)}>
                <div className="flex items-center space-x-2 truncate">
                  <span className={clsx("font-mono truncate max-w-sm flex items-center gap-1.5", t.textSecondary)} title={currentSessionMeta?.directory || currentSessionMeta?.workspace}>
                    <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>{currentSessionMeta?.directory || currentSessionMeta?.workspace || (locale === 'en-US' ? 'Workspace' : '工程目录')}</span>
                  </span>
                  <span>•</span>
                  <span>
                    {locale === 'en-US' ? `Showing ${pagedMessages.length} / ${displayMessages.length} Messages` : `显示 ${pagedMessages.length} / ${displayMessages.length} 消息`}
                  </span>
                  {transcriptData && transcriptData.descendantCount > 0 && (
                    <>
                      <span>•</span>
                      <span className={clsx("font-medium", t.accentText)}>
                        {locale === 'en-US' ? `Merged ${transcriptData.descendantCount} Subagent Tasks` : `聚合 ${transcriptData.descendantCount} 个子任务 Agent`}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-[10px] shrink-0 font-mono">
                  <span>ID: {selectedSessionId.slice(0, 16)}...</span>
                  <button onClick={() => copyText(selectedSessionId, 'sid')} className="hover:opacity-100">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* In-Session Search & Filter Toolbar */}
            <div className={clsx(
              "px-6 py-2 border-b flex items-center justify-between text-xs transition-colors",
              t.filterBarBg, t.border
            )}>
              <div className="flex items-center space-x-2 w-72">
                <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input 
                  type="text"
                  placeholder={tr('view.searchInChat')}
                  value={inSessionSearch}
                  onChange={e => setInSessionSearch(e.target.value)}
                  className={clsx("w-full bg-transparent placeholder-zinc-500 focus:outline-none text-xs", t.textPrimary)}
                />
                {inSessionSearch && (
                  <button onClick={() => setInSessionSearch('')} className={clsx(t.textMuted, "hover:opacity-100")}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Message Filter Segmented Control */}
              <div className="flex items-center space-x-2 text-[11px]">
                <span className={t.textMuted}>{locale === 'en-US' ? 'Filter:' : '过滤展示:'}</span>
                <div className={clsx("flex items-center p-0.5 rounded-lg border", t.inputBg, t.border)}>
                  <button
                    onClick={() => setMsgFilter('all')}
                    className={clsx("px-2.5 py-0.5 rounded text-[10px] font-medium transition-colors", msgFilter === 'all' ? clsx(t.cardActiveBg, t.textPrimary) : t.textMuted)}
                  >
                    {tr('view.filterAll')} ({displayMessages.length})
                  </button>
                  <button
                    onClick={() => setMsgFilter('qa_only')}
                    className={clsx("px-2.5 py-0.5 rounded text-[10px] font-medium transition-colors", msgFilter === 'qa_only' ? clsx(t.cardActiveBg, t.textPrimary) : t.textMuted)}
                  >
                    {tr('view.filterQna')}
                  </button>
                  <button
                    onClick={() => setMsgFilter('tools_only')}
                    className={clsx("px-2.5 py-0.5 rounded text-[10px] font-medium transition-colors", msgFilter === 'tools_only' ? clsx(t.cardActiveBg, t.textPrimary) : t.textMuted)}
                  >
                    {tr('view.filterTools')}
                  </button>
                  <button
                    onClick={() => setMsgFilter('thoughts_only')}
                    className={clsx("px-2.5 py-0.5 rounded text-[10px] font-medium transition-colors", msgFilter === 'thoughts_only' ? clsx(t.cardActiveBg, t.textPrimary) : t.textMuted)}
                  >
                    {tr('view.filterThought')}
                  </button>
                </div>
              </div>
            </div>

            {/* Dedicated Turn Navigation Toolbar (When in card mode) */}
            {viewMode === 'card' && (transcriptData as any)?.turns && (transcriptData as any).turns.length > 0 && (
              <div className={clsx(
                "px-6 py-2 border-b flex items-center justify-between gap-4 select-none shrink-0 transition-colors z-10",
                t.filterBarBg, t.border
              )}>
                {/* Left: Prev / Next Buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    disabled={currentTurnIndex <= 1}
                    onClick={() => {
                      setCurrentTurnIndex(prev => Math.max(1, prev - 1))
                      document.getElementById('message-feed-container')?.scrollTo({ top: 0, behavior: 'instant' })
                    }}
                    className={clsx(
                      "h-8 px-3 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1.5 shrink-0 whitespace-nowrap",
                      currentTurnIndex <= 1 
                        ? "opacity-35 cursor-not-allowed border-zinc-800 text-zinc-600" 
                        : clsx(t.buttonSecondary, "hover:border-zinc-600 active:scale-95")
                    )}
                    title="上一轮 (⌥↑)"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{tr('view.prevTurn')}</span>
                    <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 font-mono text-zinc-400">⌥↑</kbd>
                  </button>

                  <button
                    disabled={currentTurnIndex >= (transcriptData as any).turns.length}
                    onClick={() => {
                      setCurrentTurnIndex(prev => Math.min((transcriptData as any).turns.length, prev + 1))
                      document.getElementById('message-feed-container')?.scrollTo({ top: 0, behavior: 'instant' })
                    }}
                    className={clsx(
                      "h-8 px-3 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1.5 shrink-0 whitespace-nowrap",
                      currentTurnIndex >= (transcriptData as any).turns.length 
                        ? "opacity-35 cursor-not-allowed border-zinc-800 text-zinc-600" 
                        : clsx(t.buttonSecondary, "hover:border-zinc-600 active:scale-95")
                    )}
                    title="下一轮 (⌥↓)"
                  >
                    <span className="whitespace-nowrap">{tr('view.nextTurn')}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 font-mono text-zinc-400">⌥↓</kbd>
                  </button>
                </div>

                {/* Center: Jump dropdown */}
                <div className="flex-1 min-w-0 max-w-xl relative flex items-center">
                  <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2.5 pointer-events-none absolute left-0" />
                  <select
                    value={currentTurnIndex}
                    onChange={(e) => {
                      setCurrentTurnIndex(Number(e.target.value))
                      document.getElementById('message-feed-container')?.scrollTo({ top: 0, behavior: 'instant' })
                    }}
                    className={clsx(
                      "w-full h-8 pl-8 pr-8 rounded-lg text-xs font-mono font-medium border outline-none cursor-pointer truncate transition-colors appearance-none",
                      t.inputBg, t.border, t.textPrimary, "hover:border-zinc-600 focus:border-indigo-500"
                    )}
                  >
                    {((transcriptData as any).turns as ConversationTurn[]).map(turnItem => {
                      const clean = sanitizePrompt(turnItem.summary || turnItem.userText || '').cleanText
                        .replace(/[\r\n\t]+/g, ' ')
                        .trim()
                      return (
                        <option key={turnItem.turnIndex} value={turnItem.turnIndex} className="bg-zinc-900 text-zinc-200">
                          {locale === 'en-US' ? `Turn ${turnItem.turnIndex}: ` : `第 ${turnItem.turnIndex} 轮: `}{clean.slice(0, 50) || `交互 #${turnItem.turnIndex}`}{clean.length > 50 ? '...' : ''}
                        </option>
                      )
                    })}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-2.5 pointer-events-none absolute right-0" />
                </div>

                {/* Right: Counter */}
                <div className="flex items-center space-x-2 text-xs shrink-0 whitespace-nowrap font-mono">
                  <span className={clsx("px-2.5 py-1 rounded-md border text-[11px]", t.tagBg, t.tagText, t.border)}>
                    <strong className={clsx("font-bold", t.accentText)}>{currentTurnIndex}</strong>
                    <span className="opacity-40 mx-1">/</span>
                    <span>{(transcriptData as any).turns.length} {locale === 'en-US' ? 'Turns' : '轮'}</span>
                  </span>
                </div>
              </div>
            )}
            
            {/* Messages Feed Area */}
            <div id="message-feed-container" className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar select-text relative">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-3">
                  <Loader2 className="w-7 h-7 animate-spin text-zinc-400" />
                  <p className="text-xs">{tr('view.loadingTranscript')}</p>
                </div>
              ) : viewMode === 'card' && (transcriptData as any)?.turns && (transcriptData as any).turns.length > 0 ? (
                /* CC-Switch Turn Card View */
                <div className="max-w-4xl mx-auto space-y-4 pb-20">
                  {/* Render the Active Turn Card */}
                  {(() => {
                    const turnsList = (transcriptData as any).turns as ConversationTurn[]
                    const activeTurn = turnsList.find(turn => turn.turnIndex === currentTurnIndex) || turnsList[0]
                    return (
                      <TurnCard
                        key={activeTurn.turnId}
                        turn={activeTurn}
                        totalTurns={turnsList.length}
                        theme={effectiveTheme}
                        locale={locale}
                        workspacePath={currentSessionMeta?.directory || currentSessionMeta?.workspace}
                        onOpenInFolder={(p) => (window as any).api.openInFolder(p)}
                        onFullScreenCode={(code, lang) => {
                          setPreviewModalData({
                            path: 'Snippet',
                            name: 'Code Snippet',
                            isText: true,
                            content: code,
                            ext: lang
                          })
                          setPreviewModalOpen(true)
                        }}
                        onPreviewFile={handlePreviewFile}
                        onImageClick={(src, alt) => {
                          setPreviewModalData({
                            path: src,
                            name: alt || 'Image',
                            isImage: true,
                            dataUrl: src
                          })
                          setPreviewModalOpen(true)
                        }}
                        onNextTurn={() => {
                          setCurrentTurnIndex(prev => Math.min(turnsList.length, prev + 1))
                          document.getElementById('message-feed-container')?.scrollTo({ top: 0, behavior: 'instant' })
                        }}
                        onPrevTurn={() => {
                          setCurrentTurnIndex(prev => Math.max(1, prev - 1))
                          document.getElementById('message-feed-container')?.scrollTo({ top: 0, behavior: 'instant' })
                        }}
                        isFocused={true}
                      />
                    )
                  })()}
                </div>
              ) : displayMessages.length > 0 ? (
                <div className="max-w-4xl mx-auto space-y-4 pb-20">
                  {/* Ultra-Long Conversation Pagination Bar */}
                  {displayMessages.length > visibleMsgCount && (
                    <div className={clsx("p-3 rounded-xl border mb-4 flex items-center justify-between shadow-sm", t.cardBg, t.border)}>
                      <div className="flex items-center space-x-2 text-xs">
                        <Sparkles className={clsx("w-4 h-4", t.accentText)} />
                        <span className={t.textSecondary}>
                          超长对话优化模式：已展示最近 <strong>{visibleMsgCount}</strong> 条（共 <strong>{displayMessages.length}</strong> 条）
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setVisibleMsgCount(prev => Math.min(displayMessages.length, prev + 50))}
                          className={clsx("px-2.5 py-1 rounded text-xs font-medium border transition-colors", t.tagBg, t.tagText, t.border)}
                        >
                          加载更早 50 条
                        </button>
                        <button
                          onClick={() => setVisibleMsgCount(displayMessages.length)}
                          className={clsx("px-2.5 py-1 rounded text-xs font-medium text-white transition-colors shadow-sm", t.accentBg)}
                        >
                          加载全部 ({displayMessages.length})
                        </button>
                      </div>
                    </div>
                  )}

                  {pagedMessages.map((m, idx) => {
                    const isUser = (m.role || '').toLowerCase() === 'user'
                    const content = m.content || m.text || ''
                    const thought = m.thought || m.reasoning || ''
                    const timeCreated = m.time_created || m.created_at || Date.now()
                    const timelinePart = m.parts && m.parts.find(p => p.type === 'timeline')
                    const isThoughtOpen = expandedThoughts[m.id]
                    const isToolOpen = expandedTools[m.id]

                    // Universal tool parsing
                    const toolParts = (m.parts && m.parts.filter(p => p.type === 'tool' || p.tool_name)) || 
                                      (m.tools && m.tools.map((toolItem: any) => ({
                                        tool_name: toolItem.name || toolItem.tool,
                                        state: { status: toolItem.status || 'completed' },
                                        tool_args_json: typeof toolItem.args === 'string' ? toolItem.args : JSON.stringify(toolItem.args, null, 2),
                                        tool_output_json: typeof toolItem.output === 'string' ? toolItem.output : JSON.stringify(toolItem.output, null, 2)
                                      }))) || []
                    const hasTools = toolParts.length > 0

                    if (timelinePart && timelinePart.timelineType === 'model_change') {
                      return (
                        <div key={m.id || idx} className="flex items-center justify-center my-3 space-x-3 text-[10px] text-zinc-500">
                          <span className={clsx("h-[1px] w-12", t.border)} />
                          <span className={clsx("px-2.5 py-0.5 rounded-full border flex items-center space-x-1.5", t.tagBg, t.tagText, t.border)}>
                            <RefreshCw className="w-3 h-3" />
                            <span>模型切换: {timelinePart.fromModel?.modelID || 'gpt'} → <strong className={t.textPrimary}>{timelinePart.toModel?.modelID || 'gpt'}</strong></span>
                          </span>
                          <span className={clsx("h-[1px] w-12", t.border)} />
                        </div>
                      )
                    }

                    return (
                      <div 
                        key={m.id || idx} 
                        className={clsx("flex flex-col", isUser ? "items-end" : "items-start")}
                      >
                        <div className={clsx(
                          "max-w-[92%] rounded-xl p-4 text-xs leading-relaxed border transition-all relative",
                          isUser 
                            ? clsx(t.userBubbleBg, "rounded-tr-sm") 
                            : clsx(t.assistantBubbleBg, "rounded-tl-sm")
                        )}>
                          {/* Message Header */}
                          <div className={clsx("flex items-center justify-between space-x-3 mb-2.5 pb-2 border-b text-[10px]", t.border)}>
                            <div className="flex items-center space-x-2">
                              <div className={clsx("p-1 rounded", isUser ? "bg-zinc-700 text-zinc-200" : "bg-zinc-800 text-zinc-400")}>
                                {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                              </div>
                              <span className={clsx("font-semibold uppercase tracking-wider", t.textPrimary)}>
                                {isUser ? 'USER' : (m.is_subagent ? 'SUBAGENT' : 'ASSISTANT')}
                              </span>

                              {m.is_subagent && (
                                <span className={clsx("inline-flex items-center space-x-1 px-1.5 py-0.5 rounded border text-[9px] font-medium", t.tagBg, t.tagText, t.border)} title={m.subagent_title}>
                                  <GitFork className={clsx("w-2.5 h-2.5", t.accentText)} />
                                  <span className="truncate max-w-[200px]">{m.subagent_title || '子任务'}</span>
                                </span>
                              )}
                            </div>

                            <div className={clsx("flex items-center space-x-2.5 font-mono text-[10px]", t.textMuted)}>
                              <span>{new Date(timeCreated).toLocaleTimeString()}</span>
                              <span className="opacity-40">#{m.sequence || idx}</span>
                              <button
                                onClick={() => copyText(content, m.id)}
                                className={clsx("p-0.5 rounded transition-colors hover:opacity-100", t.textMuted)}
                                title="复制内容"
                              >
                                {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          {/* Reasoning / Thought Section */}
                          {thought && (
                            <div className={clsx("mb-3 rounded-lg border overflow-hidden", t.cardBg, t.border)}>
                              <button
                                onClick={() => toggleThought(m.id)}
                                className={clsx("w-full px-3 py-1.5 text-[11px] font-medium flex items-center justify-between transition-colors", t.textSecondary)}
                              >
                                <div className="flex items-center space-x-1.5">
                                  <Sparkles className={clsx("w-3 h-3", t.accentText)} />
                                  <span>模型思考过程 ({thought.length} 字符)</span>
                                </div>
                                <ChevronDown className={clsx("w-3 h-3 transition-transform opacity-60", isThoughtOpen && "rotate-180")} />
                              </button>
                              {isThoughtOpen && (
                                <div className={clsx("p-3 border-t font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto custom-scrollbar", t.border, t.textSecondary)}>
                                  {thought}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tool Calls Section */}
                          {hasTools && (
                            <div className={clsx("mb-3 rounded-lg border overflow-hidden", t.cardBg, t.border)}>
                              <button
                                onClick={() => toggleTool(m.id)}
                                className={clsx("w-full px-3 py-1.5 text-[11px] font-medium flex items-center justify-between transition-colors", t.textPrimary)}
                              >
                                <div className="flex items-center space-x-1.5">
                                  <Terminal className={clsx("w-3 h-3", t.accentText)} />
                                  <span>工具调用日志 ({toolParts.length} 次)</span>
                                </div>
                                <ChevronDown className={clsx("w-3 h-3 transition-transform opacity-60", isToolOpen && "rotate-180")} />
                              </button>
                              {isToolOpen && (
                                <div className={clsx("p-3 border-t space-y-2 max-h-72 overflow-y-auto custom-scrollbar", t.border)}>
                                  {toolParts.map((tool: any, tIdx: number) => (
                                    <div key={tIdx} className={clsx("p-2.5 rounded-lg border font-mono text-[10px]", t.cardBg, t.border)}>
                                      <div className={clsx("flex items-center justify-between font-semibold mb-1", t.textPrimary)}>
                                        <span className="flex items-center space-x-1.5">
                                          <Zap className="w-3 h-3 text-zinc-400" />
                                          <span>{tool.tool_name || tool.tool || 'Tool'}</span>
                                        </span>
                                        <span className={clsx("text-[9px] px-1.5 py-0.5 rounded uppercase font-medium", t.tagBg, t.tagText)}>
                                          {tool.state?.status || 'completed'}
                                        </span>
                                      </div>
                                      {tool.tool_args_json && (
                                        <div className={clsx("break-words p-2 rounded mt-1 border leading-relaxed", t.inputBg, t.border, t.textSecondary)}>
                                          {tool.tool_args_json}
                                        </div>
                                      )}
                                      {tool.tool_output_json && (
                                        <div className={clsx("break-words p-2 rounded mt-1 border max-h-32 overflow-y-auto custom-scrollbar leading-relaxed", t.inputBg, t.border, t.textPrimary)}>
                                          {tool.tool_output_json}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message Body Content (Rich Markdown with Code Expansion, Lightbox, File Chips) */}
                          {content ? (
                            (() => {
                              if (isUser) {
                                const sanitized = sanitizePrompt(content)
                                return (
                                  <div className="space-y-2">
                                    <MarkdownRenderer 
                                      content={sanitized.cleanText || (locale === 'en-US' ? '(Empty user prompt)' : '(空用户指令)')}
                                      workspacePath={currentSessionMeta?.directory || currentSessionMeta?.workspace}
                                      theme={effectiveTheme}
                                      onPreviewFile={handlePreviewFile}
                                      onImageClick={(src, alt) => {
                                        setPreviewModalData({
                                          path: src,
                                          name: alt || 'Image',
                                          isImage: true,
                                          dataUrl: src
                                        })
                                        setPreviewModalOpen(true)
                                      }}
                                      onOpenFullscreen={(code, lang) => {
                                        setPreviewModalData({
                                          path: 'Snippet',
                                          name: 'Code Snippet',
                                          isText: true,
                                          content: code,
                                          ext: lang
                                        })
                                        setPreviewModalOpen(true)
                                      }}
                                      onFullScreenCode={(code, lang) => {
                                        setPreviewModalData({
                                          path: 'Snippet',
                                          name: 'Code Snippet',
                                          isText: true,
                                          content: code,
                                          ext: lang
                                        })
                                        setPreviewModalOpen(true)
                                      }}
                                    />
                                    {sanitized.hasEnvelopes && (
                                      <div className="pt-1">
                                        <details className="text-[11px] font-mono text-zinc-400 bg-black/20 rounded-lg p-2 border border-white/5">
                                          <summary className="cursor-pointer text-[10px] text-zinc-400 hover:text-zinc-200 font-sans font-medium select-none flex items-center gap-1.5">
                                            <Sliders className="w-3 h-3 text-zinc-400" />
                                            <span>{tr('turn.envContext')}</span>
                                            <span className="text-zinc-500 font-mono text-[9px]">{tr('turn.coreExtracted')}</span>
                                          </summary>
                                          <div className="mt-2 space-y-2 border-t border-white/5 pt-2">
                                            {sanitized.contextSummary && (
                                              <div>
                                                <div className="text-[9px] text-indigo-400 font-sans font-semibold mb-0.5">{tr('turn.contextSummary')}:</div>
                                                <div className="whitespace-pre-wrap text-[10px] text-zinc-300 font-sans bg-black/30 p-2 rounded border border-white/5">{sanitized.contextSummary}</div>
                                              </div>
                                            )}
                                            {sanitized.metadata && (
                                              <div>
                                                <div className="text-[9px] text-amber-400 font-sans font-semibold mb-0.5">{tr('turn.runtimeMetadata')}:</div>
                                                <pre className="whitespace-pre-wrap text-[10px] text-zinc-400 bg-black/30 p-2 rounded border border-white/5 overflow-x-auto">{sanitized.metadata}</pre>
                                              </div>
                                            )}
                                            {sanitized.systemMessage && (
                                              <div>
                                                <div className="text-[9px] text-emerald-400 font-sans font-semibold mb-0.5">{tr('turn.systemMessage')}:</div>
                                                <pre className="whitespace-pre-wrap text-[10px] text-zinc-400 bg-black/30 p-2 rounded border border-white/5 overflow-x-auto">{sanitized.systemMessage}</pre>
                                              </div>
                                            )}
                                          </div>
                                        </details>
                                      </div>
                                    )}
                                  </div>
                                )
                              }
                              return (
                                <MarkdownRenderer 
                                  content={content}
                                  workspacePath={currentSessionMeta?.directory || currentSessionMeta?.workspace}
                                  theme={effectiveTheme}
                                  onPreviewFile={handlePreviewFile}
                                  onImageClick={(src, alt) => {
                                    setPreviewModalData({
                                      path: src,
                                      name: alt || 'Image',
                                      isImage: true,
                                      dataUrl: src
                                    })
                                    setPreviewModalOpen(true)
                                  }}
                                  onOpenFullscreen={(code, lang) => {
                                    setPreviewModalData({
                                      path: 'Snippet',
                                      name: 'Code Snippet',
                                      isText: true,
                                      content: code,
                                      ext: lang
                                    })
                                    setPreviewModalOpen(true)
                                  }}
                                  onFullScreenCode={(code, lang) => {
                                    setPreviewModalData({
                                      path: 'Snippet',
                                      name: 'Code Snippet',
                                      isText: true,
                                      content: code,
                                      ext: lang
                                    })
                                    setPreviewModalOpen(true)
                                  }}
                                />
                              )
                            })()
                          ) : (
                            !hasTools && !thought && (
                              <div className={clsx("italic", t.textMuted)}>{tr('view.noContent')}</div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Reset Visible Window Button */}
                  {visibleMsgCount >= displayMessages.length && displayMessages.length > 50 && (
                    <div className="text-center pb-2">
                      <button
                        onClick={() => setVisibleMsgCount(40)}
                        className={clsx("text-[11px] underline opacity-60 hover:opacity-100 transition-opacity", t.textMuted)}
                      >
                        已展开全部 {displayMessages.length} 条消息。点击收起至最近 40 条以保持流畅
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={clsx("flex flex-col items-center justify-center h-full space-y-2", t.textMuted)}>
                  <Database className="w-10 h-10 opacity-30" />
                  <p className="text-xs">未找到符合条件的消息</p>
                </div>
              )}

              {/* Floating Jump to Top & Bottom Buttons */}
              <div className="fixed bottom-6 right-[410px] flex flex-col space-y-1.5 z-20">
                <button
                  onClick={() => scrollToEdge('top')}
                  className={clsx("p-2 rounded-full shadow-lg backdrop-blur border transition-transform active:scale-95", t.tagBg, t.tagText, t.border)}
                  title="回到对话顶部"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => scrollToEdge('bottom')}
                  className={clsx("p-2 rounded-full shadow-lg backdrop-blur border transition-transform active:scale-95", t.tagBg, t.tagText, t.border)}
                  title="滑到最新消息"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={clsx("flex-1 flex flex-col items-center justify-center p-8", t.textMuted)}>
            <Logo className="w-16 h-16 mb-4 opacity-80" />
            <h3 className={clsx("text-base font-bold", t.textPrimary)}>
              {locale === 'en-US' ? 'Select or import a session to begin' : '选择或导入一个会话以开始'}
            </h3>
            <p className={clsx("text-xs mt-1 max-w-sm text-center leading-relaxed", t.textMuted)}>
              {locale === 'en-US' ? 'Lossless format conversion and handoff across ZCode, OpenCode, Codex, Pi, Claude Code, and Antigravity.' : '支持 ZCode、OpenCode、Codex、Pi.ai、Claude Code、反重力等全部生态格式无损互转与会话接力。'}
            </p>
            <button
              onClick={handleImportSession}
              className={clsx("mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md flex items-center space-x-2", t.accentBg)}
            >
              <UploadCloud className="w-4 h-4" />
              <span>{locale === 'en-US' ? 'Import Session (.jsonl / .json / .md)' : '导入外部会话 (.jsonl / .json / .md)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Pane 3: Right Inspector Drawer (会话资产与跨模型交接工坊) */}
      {showInspector && selectedSessionId && (
        <div className={clsx(
          "w-[380px] border-l flex flex-col shrink-0 animate-in slide-in-from-right-3 duration-200 transition-colors",
          t.sidebarBg, t.border
        )}>
          {/* Drawer Header */}
          <div className={clsx(
            "p-3.5 border-b flex items-center justify-between transition-colors",
            t.sidebarHeaderBg, t.border
          )}>
            <div className="flex items-center space-x-2">
              <Wrench className={clsx("w-4 h-4", t.accentText)} />
              <h3 className={clsx("text-xs font-semibold", t.textPrimary)}>
                {tr('handoff.title')}
              </h3>
            </div>
            <button 
              onClick={() => setShowInspector(false)}
              className={clsx("p-1 rounded hover:opacity-100", t.textMuted)}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Drawer Tabs */}
          <div className={clsx("grid grid-cols-4 p-1 border-b text-[10px] font-medium transition-colors", t.filterBarBg, t.border)}>
            <button
              onClick={() => setInspectorTab('handoff')}
              className={clsx("py-1.5 rounded transition-colors flex items-center justify-center gap-1", inspectorTab === 'handoff' ? clsx(t.cardActiveBg, t.textPrimary) : t.textMuted)}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>{tr('handoff.tabHandoff')}</span>
            </button>
            <button
              onClick={() => setInspectorTab('files')}
              className={clsx("py-1.5 rounded transition-colors flex items-center justify-center gap-1", inspectorTab === 'files' ? clsx(t.cardActiveBg, t.textPrimary) : t.textMuted)}
            >
              <FileCode className="w-3 h-3" />
              <span>{tr('handoff.tabFiles', { count: String(analytics?.modifiedFiles.length || 0) })}</span>
            </button>
            <button
              onClick={() => setInspectorTab('tools')}
              className={clsx("py-1.5 rounded transition-colors flex items-center justify-center gap-1", inspectorTab === 'tools' ? clsx(t.cardActiveBg, t.textPrimary) : t.textMuted)}
            >
              <Terminal className="w-3 h-3" />
              <span>{tr('handoff.tabTools')}</span>
            </button>
            <button
              onClick={() => setInspectorTab('export')}
              className={clsx("py-1.5 rounded transition-colors flex items-center justify-center gap-1", inspectorTab === 'export' ? clsx(t.cardActiveBg, t.textPrimary) : t.textMuted)}
            >
              <Download className="w-3 h-3" />
              <span>{tr('handoff.tabExport')}</span>
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {/* Tab 1: AI Model Continuation Handoff */}
            {inspectorTab === 'handoff' && (
              <div className="space-y-3.5">
                <div className={clsx("p-3 rounded-xl border text-xs space-y-2", t.cardBg, t.border)}>
                  <div className={clsx("flex items-center space-x-1.5 font-semibold", t.accentText)}>
                    <FileText className="w-3.5 h-3.5" />
                    <span>{tr('handoff.handoffBanner')}</span>
                  </div>
                  <p className={clsx("text-[11px] leading-relaxed", t.textSecondary)}>
                    {tr('handoff.handoffDesc', { count: String(analytics?.modifiedFiles.length || 0) })}
                  </p>
                  <button
                    onClick={handleCopyHandoff}
                    className={clsx("w-full py-2 text-white rounded-lg font-medium text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm", t.accentBg)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{tr('handoff.copyPromptBtn')}</span>
                  </button>
                </div>

                <div className={clsx("p-3 rounded-xl border space-y-2 text-xs", t.cardBg, t.border)}>
                  <span className={clsx("font-semibold", t.textPrimary)}>{tr('handoff.handoffDetailsTitle')}</span>
                  <ul className={clsx("text-[11px] space-y-1.5 pl-3 list-disc", t.textSecondary)}>
                    <li>{tr('handoff.itemWorkspace')}</li>
                    <li>{tr('handoff.itemFiles', { count: String(analytics?.modifiedFiles.length || 0) })}</li>
                    <li>{tr('handoff.itemSubagents', { count: String(analytics?.subagentCount || 0) })}</li>
                    <li>{tr('handoff.itemRecent')}</li>
                  </ul>
                  <button
                    onClick={() => handleExport('handoff')}
                    className={clsx("w-full mt-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 border", t.tagBg, t.tagText, t.border)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{tr('handoff.savePromptBtn')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Touched Files */}
            {inspectorTab === 'files' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={locale === 'en-US' ? "Filter modified files..." : "过滤修改的文件名..."}
                    value={fileSearch}
                    onChange={e => setFileSearch(e.target.value)}
                    className={clsx("w-full border rounded-lg pl-8 pr-2 py-1.5 text-xs placeholder-zinc-500 focus:outline-none", t.inputBg, t.inputBorder, t.textPrimary)}
                  />
                </div>

                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {filteredModifiedFiles.length === 0 ? (
                    <div className={clsx("p-4 text-center text-xs", t.textMuted)}>{tr('handoff.modifiedFilesEmpty')}</div>
                  ) : (
                    filteredModifiedFiles.map((file, fIdx) => {
                      const baseName = file.split('/').pop()
                      const dirName = file.split('/').slice(0, -1).join('/')
                      return (
                        <div
                          key={fIdx}
                          onClick={() => handlePreviewFile(file)}
                          className={clsx("p-2 border rounded-lg cursor-pointer transition-all text-left group hover:border-indigo-500/50 hover:shadow-sm", t.cardBg, t.border)}
                          title={locale === 'en-US' ? "Click to preview file" : "点击预览文件"}
                        >
                          <div className="flex items-center justify-between">
                            <span className={clsx("font-mono text-xs font-medium truncate flex-1", t.textPrimary)}>{baseName}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyText(file, `file-${fIdx}`)
                              }}
                              className="p-1 hover:bg-white/10 rounded text-zinc-500 group-hover:text-zinc-300 shrink-0 ml-1 transition-colors"
                              title={locale === 'en-US' ? "Copy path" : "复制路径"}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className={clsx("font-mono text-[9px] truncate mt-0.5", t.textMuted)}>{dirName}</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Tools Stats */}
            {inspectorTab === 'tools' && (
              <div className="space-y-3">
                <div className={clsx("p-3 border rounded-xl space-y-2", t.cardBg, t.border)}>
                  <div className={clsx("text-xs font-semibold", t.textPrimary)}>{locale === 'en-US' ? 'Tool Call Frequency' : '工具调用频率统计'}</div>
                  <div className="space-y-2 mt-2">
                    {analytics && Object.entries(analytics.toolStats).length > 0 ? (
                      Object.entries(analytics.toolStats).map(([tool, count]) => (
                        <div key={tool} className="flex items-center justify-between text-xs font-mono">
                          <span className={clsx("truncate max-w-[180px]", t.textSecondary)}>{tool}</span>
                          <div className="flex items-center space-x-2">
                            <span className={clsx("font-semibold", t.textPrimary)}>{count} {locale === 'en-US' ? 'calls' : '次'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={clsx("p-2 text-center text-xs", t.textMuted)}>{tr('handoff.toolStatsEmpty')}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Export Formats Studio */}
            {inspectorTab === 'export' && (
              <div className="space-y-2.5 text-xs">
                {/* 1. OpenCode */}
                <div className={clsx("p-3 border rounded-xl space-y-1.5", t.cardBg, t.border)}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center space-x-1.5">
                      <Terminal className="w-4 h-4 text-sky-400" />
                      <span className={t.textPrimary}>OpenCode (.opencode.json)</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono">官方原生格式</span>
                  </div>
                  <p className={clsx("text-[11px] leading-relaxed", t.textSecondary)}>
                    专为 OpenCode CLI 打造的原生导入结构，包含 info、messages、parts 标准规范。
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handlePreview('opencode')}
                      className={clsx("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 border", t.tagBg, t.tagText, t.border)}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Preview' : '预览内容'}</span>
                    </button>
                    <button
                      onClick={() => handleExport('opencode')}
                      className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Export' : '导出文件'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. OpenAI Codex */}
                <div className={clsx("p-3 border rounded-xl space-y-1.5", t.cardBg, t.border)}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center space-x-1.5">
                      <Code className="w-4 h-4 text-emerald-400" />
                      <span className={t.textPrimary}>Codex / Copilot CLI (.codex.json)</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">Codex 格式</span>
                  </div>
                  <p className={clsx("text-[11px] leading-relaxed", t.textSecondary)}>
                    针对 OpenAI Codex 及 GitHub Copilot 场景优化，携带元数据、触达文件与执行回执。
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handlePreview('codex')}
                      className={clsx("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 border", t.tagBg, t.tagText, t.border)}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Preview' : '预览内容'}</span>
                    </button>
                    <button
                      onClick={() => handleExport('codex')}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Export' : '导出文件'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Inflection Pi (Pi.ai) */}
                <div className={clsx("p-3 border rounded-xl space-y-1.5", t.cardBg, t.border)}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center space-x-1.5">
                      <Send className="w-4 h-4 text-rose-400" />
                      <span className={t.textPrimary}>Pi.ai 对话格式 (.pi.json)</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">Pi 专属</span>
                  </div>
                  <p className={clsx("text-[11px] leading-relaxed", t.textSecondary)}>
                    适配 Inflection Pi / Pi.ai 的对话轮次与内部思考流规范，纯净自然。
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handlePreview('pi')}
                      className={clsx("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 border", t.tagBg, t.tagText, t.border)}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Preview' : '预览内容'}</span>
                    </button>
                    <button
                      onClick={() => handleExport('pi')}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Export' : '导出文件'}</span>
                    </button>
                  </div>
                </div>

                {/* 4. Claude Code */}
                <div className={clsx("p-3 border rounded-xl space-y-1.5", t.cardBg, t.border)}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <span className={t.textPrimary}>Claude Code (.claude.json)</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">Claude 格式</span>
                  </div>
                  <p className={clsx("text-[11px] leading-relaxed", t.textSecondary)}>
                    适配 Anthropic Claude Code 工具链，保留上下文、思考过程和工具调用。
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handlePreview('claude')}
                      className={clsx("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 border", t.tagBg, t.tagText, t.border)}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Preview' : '预览内容'}</span>
                    </button>
                    <button
                      onClick={() => handleExport('claude')}
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Export' : '导出文件'}</span>
                    </button>
                  </div>
                </div>

                {/* 5. Antigravity */}
                <div className={clsx("p-3 border rounded-xl space-y-1.5", t.cardBg, t.border)}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className={t.textPrimary}>反重力 (transcript.jsonl)</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">Antigravity</span>
                  </div>
                  <p className={clsx("text-[11px] leading-relaxed", t.textSecondary)}>
                    对齐 Antigravity 记忆系统的原生 JSON Lines 轨迹格式，支持 step_index 与 tool_calls。
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handlePreview('antigravity')}
                      className={clsx("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 border", t.tagBg, t.tagText, t.border)}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Preview' : '预览内容'}</span>
                    </button>
                    <button
                      onClick={() => handleExport('antigravity')}
                      className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Export' : '导出文件'}</span>
                    </button>
                  </div>
                </div>

                {/* 6. Markdown */}
                <div className={clsx("p-3 border rounded-xl space-y-1.5", t.cardBg, t.border)}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      <span className={t.textPrimary}>Markdown 文档 (.md)</span>
                    </span>
                    <span className={clsx("text-[9px] px-1.5 py-0.5 rounded font-mono", t.tagBg, t.tagText)}>人类可读</span>
                  </div>
                  <p className={clsx("text-[11px] leading-relaxed", t.textSecondary)}>
                    整洁排版的纯 Markdown 文档，内嵌修改文件列表、工具回执与思考折叠块。
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handlePreview('md')}
                      className={clsx("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 border", t.tagBg, t.tagText, t.border)}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Preview' : '预览内容'}</span>
                    </button>
                    <button
                      onClick={() => handleExport('md')}
                      className="flex-1 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>{locale === 'en-US' ? 'Export' : '导出文件'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Subtle Scrollbar CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}

export default App
