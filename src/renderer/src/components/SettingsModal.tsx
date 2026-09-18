import React, { useState, useEffect } from 'react'
import { 
  X, Palette, Database, Sparkles, RefreshCw, Check, 
  ExternalLink, Download, FolderOpen, Shield, Bell, CheckCircle2, Info, Languages, SunMoon
} from 'lucide-react'
import clsx from 'clsx'
import { AppTheme, AppThemeMode, THEME_STYLES } from '../theme'
import { translations, Locale } from '../i18n'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  currentThemeMode: AppThemeMode
  onThemeModeChange: (mode: AppThemeMode) => void
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  dbPath?: string
  onSelectCustomDb: () => void
  onRefreshDb: () => void
  theme?: AppTheme
}

export function SettingsModal({
  open,
  onClose,
  currentThemeMode,
  onThemeModeChange,
  locale,
  onLocaleChange,
  fontSize,
  onFontSizeChange,
  dbPath,
  onSelectCustomDb,
  onRefreshDb,
  theme = 'obsidian'
}: SettingsModalProps) {
  const [tab, setTab] = useState<'appearance' | 'language' | 'database' | 'update' | 'about'>('appearance')
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateResult, setUpdateResult] = useState<any>(null)
  const [autoCheckUpdate, setAutoCheckUpdate] = useState(true)

  const t = translations[locale]?.settings || translations['zh-CN'].settings
  const themeStyle = THEME_STYLES[theme] || THEME_STYLES.obsidian
  const isDark = themeStyle.isDark

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true)
    try {
      // @ts-ignore
      const res = await window.api.checkForUpdates()
      setTimeout(() => {
        setUpdateResult(res)
        setCheckingUpdate(false)
      }, 600)
    } catch(e) {
      setCheckingUpdate(false)
    }
  }

  const themes: { id: AppThemeMode, name: string, desc: string, bg: string, border: string, icon?: React.ReactNode }[] = [
    {
      id: 'system',
      name: t.themeFollowSystem,
      desc: t.themeFollowSystemDesc,
      bg: 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-slate-200',
      border: 'border-indigo-500/50',
      icon: <SunMoon className="w-4 h-4 text-indigo-400 shrink-0" />
    },
    {
      id: 'obsidian',
      name: t.themeObsidian,
      desc: t.themeObsidianDesc,
      bg: 'bg-[#0a0a0c]',
      border: 'border-indigo-500/50'
    },
    {
      id: 'midnight',
      name: t.themeMidnight,
      desc: t.themeMidnightDesc,
      bg: 'bg-[#0f1115]',
      border: 'border-cyan-500/50'
    },
    {
      id: 'solar',
      name: t.themeSolar,
      desc: t.themeSolarDesc,
      bg: 'bg-[#181614]',
      border: 'border-amber-500/50'
    },
    {
      id: 'light',
      name: t.themeLight,
      desc: t.themeLightDesc,
      bg: 'bg-[#ffffff]',
      border: 'border-slate-300'
    }
  ]

  return (
    <div 
      onClick={onClose}
      className={clsx("fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in", themeStyle.modalBackdropBg || "bg-black/75 backdrop-blur-sm")}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className={clsx("border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden", themeStyle.modalBg)}
      >
        {/* Modal Header */}
        <div className={clsx("px-6 py-4 border-b flex items-center justify-between", themeStyle.modalHeaderBg)}>
          <div className="flex items-center space-x-2.5">
            <Palette className="w-4 h-4 text-indigo-500" />
            <h2 className={clsx("text-sm font-semibold", themeStyle.textPrimary)}>{t.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className={clsx("p-1 rounded transition-colors", themeStyle.buttonGhost)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className={clsx(
          "flex border-b px-6 space-x-6 text-xs font-medium overflow-x-auto",
          themeStyle.border,
          isDark ? "bg-zinc-900" : "bg-slate-100/70"
        )}>
          {[
            { id: 'appearance', label: t.tabAppearance, icon: <Palette className="w-3.5 h-3.5" /> },
            { id: 'language', label: t.tabLanguage, icon: <Languages className="w-3.5 h-3.5" /> },
            { id: 'database', label: t.tabDatabase, icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'update', label: t.tabUpdate, icon: <RefreshCw className="w-3.5 h-3.5" /> },
            { id: 'about', label: t.tabAbout, icon: <Info className="w-3.5 h-3.5" /> },
          ].map(tb => {
            const isActive = tab === tb.id
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id as any)}
                className={clsx(
                  "py-2.5 border-b-2 transition-colors flex items-center gap-1.5 shrink-0",
                  isActive 
                    ? (isDark ? "border-indigo-500 text-zinc-100 font-semibold" : "border-indigo-600 text-indigo-700 font-semibold")
                    : (isDark ? "border-transparent text-zinc-400 hover:text-zinc-200" : "border-transparent text-slate-500 hover:text-slate-900")
                )}
              >
                {tb.icon}
                <span>{tb.label}</span>
              </button>
            )
          })}
        </div>

        {/* Modal Body */}
        <div className={clsx("flex-1 overflow-y-auto p-6 space-y-6 text-xs custom-scrollbar", isDark ? "bg-[#121215]" : "bg-white")}>
          {/* Tab 1: Appearance */}
          {tab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <label className={clsx("text-xs font-semibold block mb-2", themeStyle.textPrimary)}>{t.themeTitle}</label>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map(tm => {
                    const isSelected = currentThemeMode === tm.id
                    return (
                      <div
                        key={tm.id}
                        onClick={() => onThemeModeChange(tm.id)}
                        className={clsx(
                          "p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden group",
                          isSelected 
                            ? (isDark ? "bg-zinc-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/50" : "bg-indigo-50/70 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30") 
                            : (isDark ? "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs")
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {tm.icon || <div className={clsx("w-3.5 h-3.5 rounded-full border", tm.bg, tm.border)} />}
                            <span className={clsx("font-medium", themeStyle.textPrimary)}>{tm.name}</span>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className={clsx("text-[11px] leading-relaxed", themeStyle.textMuted)}>{tm.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={clsx("pt-2 border-t", themeStyle.border)}>
                <label className={clsx("text-xs font-semibold block mb-2", themeStyle.textPrimary)}>{t.fontSizeTitle}</label>
                <div className="flex items-center space-x-3">
                  {[
                    { size: 12, label: t.fontSmall },
                    { size: 13, label: t.fontMedium },
                    { size: 14, label: t.fontLarge }
                  ].map(f => (
                    <button
                      key={f.size}
                      onClick={() => onFontSizeChange(f.size)}
                      className={clsx(
                        "px-4 py-2 rounded-lg border text-xs font-medium transition-all",
                        fontSize === f.size 
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-sm" 
                          : themeStyle.buttonSecondary
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Language */}
          {tab === 'language' && (
            <div className="space-y-4">
              <div>
                <label className={clsx("text-xs font-semibold block mb-1", themeStyle.textPrimary)}>{t.languageTitle}</label>
                <p className={clsx("text-xs mb-4", themeStyle.textMuted)}>{t.languageDesc}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'zh-CN' as Locale, label: t.langZh },
                    { id: 'en-US' as Locale, label: t.langEn },
                  ].map(l => {
                    const isSelected = locale === l.id
                    return (
                      <button
                        key={l.id}
                        onClick={() => onLocaleChange(l.id)}
                        className={clsx(
                          "p-4 rounded-xl border transition-all text-left flex items-center justify-between",
                          isSelected 
                            ? (isDark ? "bg-zinc-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/50" : "bg-indigo-50/70 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30") 
                            : (isDark ? "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300" : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs")
                        )}
                      >
                        <span className={clsx("font-semibold text-xs", themeStyle.textPrimary)}>{l.label}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Database */}
          {tab === 'database' && (
            <div className="space-y-4">
              <div>
                <label className={clsx("text-xs font-semibold block mb-1", themeStyle.textPrimary)}>{t.dbTitle}</label>
                <p className={clsx("text-xs mb-3", themeStyle.textMuted)}>{t.dbDesc}</p>
                <div className={clsx("p-3 border rounded-lg text-xs font-mono break-all select-all flex items-center justify-between", isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-slate-50 border-slate-200 text-slate-700")}>
                  <span>{dbPath || '~/.local/share/opencode, ~/.codex, ~/.gemini/antigravity'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={onSelectCustomDb}
                  className={clsx("px-3.5 py-2 border rounded-lg font-medium transition-colors flex items-center space-x-2", themeStyle.buttonSecondary)}
                >
                  <FolderOpen className={clsx("w-3.5 h-3.5", themeStyle.textMuted)} />
                  <span>{t.customDbBtn}</span>
                </button>

                <button
                  onClick={onRefreshDb}
                  className={clsx("px-3.5 py-2 border rounded-lg font-medium transition-colors flex items-center space-x-2", themeStyle.buttonSecondary)}
                >
                  <RefreshCw className={clsx("w-3.5 h-3.5", themeStyle.textMuted)} />
                  <span>{t.refreshDbBtn}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Updates */}
          {tab === 'update' && (
            <div className="space-y-4">
              <div>
                <label className={clsx("text-xs font-semibold block mb-1", themeStyle.textPrimary)}>{t.updateTitle}</label>
                <div className={clsx("p-4 border rounded-xl space-y-3", isDark ? "bg-zinc-900 border-zinc-800" : "bg-slate-50 border-slate-200")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={clsx("font-semibold text-xs", themeStyle.textPrimary)}>AgentSwitch v2.6.0</div>
                      <div className={clsx("text-[11px]", themeStyle.textMuted)}>Release: 2026-09-18</div>
                    </div>
                    <button
                      onClick={handleCheckUpdate}
                      disabled={checkingUpdate}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 text-xs shadow-sm"
                    >
                      <RefreshCw className={clsx("w-3 h-3", checkingUpdate && "animate-spin")} />
                      <span>{checkingUpdate ? t.checkingUpdate : t.checkUpdateBtn}</span>
                    </button>
                  </div>

                  {updateResult && (
                    <div className={clsx("p-3 rounded-lg border flex items-center space-x-2", isDark ? "bg-zinc-950/80 border-emerald-900/40 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700")}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{t.latestVersion.replace('{version}', 'v2.6.0')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={clsx("flex items-center space-x-2 text-xs pt-1", themeStyle.textSecondary)}>
                <input 
                  type="checkbox" 
                  id="autoCheck"
                  checked={autoCheckUpdate} 
                  onChange={e => setAutoCheckUpdate(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="autoCheck" className="cursor-pointer select-none">{t.autoCheckLabel}</label>
              </div>
            </div>
          )}

          {/* Tab 5: About */}
          {tab === 'about' && (
            <div className="space-y-4">
              <div className={clsx("p-5 border rounded-xl space-y-3", isDark ? "bg-zinc-900 border-zinc-800" : "bg-slate-50 border-slate-200")}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    AS
                  </div>
                  <div>
                    <h3 className={clsx("text-sm font-bold", themeStyle.textPrimary)}>{t.aboutTitle}</h3>
                    <p className={clsx("text-[11px]", themeStyle.textMuted)}>{t.aboutDesc}</p>
                  </div>
                </div>

                <div className={clsx("border-t pt-3 space-y-1.5 text-[11px] font-mono", themeStyle.border)}>
                  <div className="flex justify-between">
                    <span className={themeStyle.textMuted}>{t.version}:</span>
                    <span className={themeStyle.textPrimary}>v2.6.0 (Build 2026.09.18)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={themeStyle.textMuted}>Electron:</span>
                    <span className={themeStyle.textPrimary}>v39.2.6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={themeStyle.textMuted}>React:</span>
                    <span className={themeStyle.textPrimary}>v19.2.1 (Vite v7.2.6)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={themeStyle.textMuted}>{t.license}:</span>
                    <span className={themeStyle.textPrimary}>MIT Open Source</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
