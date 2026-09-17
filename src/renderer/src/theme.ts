export type AppTheme = 'obsidian' | 'midnight' | 'solar' | 'light'

export interface ThemeColors {
  id: AppTheme
  appBg: string
  sidebarBg: string
  sidebarHeaderBg: string
  mainBg: string
  headerBg: string
  filterBarBg: string
  cardBg: string
  cardActiveBg: string
  cardBorder: string
  cardBorderActive: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  inputBg: string
  inputBorder: string
  userBubbleBg: string
  assistantBubbleBg: string
  border: string
  accentText: string
  accentBg: string
  accentBorder: string
  tagBg: string
  tagText: string
  borderHover: string
  cardNormal: string
  cardActive: string
  buttonGhost: string
  buttonSecondary: string
  badgeActive: string
  badgeInactive: string
  bgSidebar: string
}

export const THEME_STYLES: Record<AppTheme, ThemeColors> = {
  obsidian: {
    id: 'obsidian',
    appBg: 'bg-[#09090b]',
    sidebarBg: 'bg-[#0e0e11]',
    sidebarHeaderBg: 'bg-[#121216]',
    mainBg: 'bg-[#09090b]',
    headerBg: 'bg-[#0e0e11]',
    filterBarBg: 'bg-[#0c0c0e]',
    cardBg: 'bg-zinc-900/40 hover:bg-zinc-800/40 border-transparent',
    cardActiveBg: 'bg-zinc-800/90 border-zinc-700 shadow-sm',
    cardBorder: 'border-transparent',
    cardBorderActive: 'border-zinc-700',
    textPrimary: 'text-zinc-100',
    textSecondary: 'text-zinc-300',
    textMuted: 'text-zinc-500',
    inputBg: 'bg-zinc-900',
    inputBorder: 'border-zinc-800 focus:border-zinc-700',
    userBubbleBg: 'bg-[#141419] border-zinc-800/90',
    assistantBubbleBg: 'bg-[#0f0f13] border-zinc-800/60',
    border: 'border-zinc-800/80',
    accentText: 'text-indigo-400',
    accentBg: 'bg-indigo-600 hover:bg-indigo-500',
    accentBorder: 'border-indigo-500/30',
    tagBg: 'bg-zinc-800/80',
    tagText: 'text-zinc-300',
    borderHover: 'hover:border-zinc-700',
    cardNormal: 'bg-zinc-900/40 hover:bg-zinc-800/40 border-zinc-800/60',
    cardActive: 'bg-zinc-800/90 border-indigo-500/60 shadow-md',
    buttonGhost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
    buttonSecondary: 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60',
    badgeActive: 'bg-indigo-600 text-white shadow-sm',
    badgeInactive: 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
    bgSidebar: 'bg-[#0e0e11]'
  },
  midnight: {
    id: 'midnight',
    appBg: 'bg-[#0b0e14]',
    sidebarBg: 'bg-[#0f141d]',
    sidebarHeaderBg: 'bg-[#141b26]',
    mainBg: 'bg-[#0b0e14]',
    headerBg: 'bg-[#0f141d]',
    filterBarBg: 'bg-[#101621]',
    cardBg: 'bg-slate-900/40 hover:bg-slate-800/40 border-transparent',
    cardActiveBg: 'bg-slate-800/90 border-slate-700 shadow-sm',
    cardBorder: 'border-transparent',
    cardBorderActive: 'border-slate-700',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-500',
    inputBg: 'bg-[#141b26]',
    inputBorder: 'border-slate-800 focus:border-slate-700',
    userBubbleBg: 'bg-[#151e2b] border-slate-700/80',
    assistantBubbleBg: 'bg-[#101723] border-slate-800/60',
    border: 'border-slate-800/80',
    accentText: 'text-sky-400',
    accentBg: 'bg-sky-600 hover:bg-sky-500',
    accentBorder: 'border-sky-500/30',
    tagBg: 'bg-slate-800/80',
    tagText: 'text-slate-300',
    borderHover: 'hover:border-slate-700',
    cardNormal: 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800/60',
    cardActive: 'bg-slate-800/90 border-sky-500/60 shadow-md',
    buttonGhost: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60',
    buttonSecondary: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60',
    badgeActive: 'bg-sky-600 text-white shadow-sm',
    badgeInactive: 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200',
    bgSidebar: 'bg-[#0f141d]'
  },
  solar: {
    id: 'solar',
    appBg: 'bg-[#141312]',
    sidebarBg: 'bg-[#1c1a17]',
    sidebarHeaderBg: 'bg-[#24211d]',
    mainBg: 'bg-[#141312]',
    headerBg: 'bg-[#1c1a17]',
    filterBarBg: 'bg-[#171513]',
    cardBg: 'bg-stone-900/40 hover:bg-stone-800/40 border-transparent',
    cardActiveBg: 'bg-stone-800/90 border-amber-900/40 shadow-sm',
    cardBorder: 'border-transparent',
    cardBorderActive: 'border-amber-900/40',
    textPrimary: 'text-amber-50',
    textSecondary: 'text-stone-300',
    textMuted: 'text-stone-500',
    inputBg: 'bg-[#24211d]',
    inputBorder: 'border-stone-800 focus:border-stone-700',
    userBubbleBg: 'bg-[#221e1a] border-amber-950/60',
    assistantBubbleBg: 'bg-[#1b1815] border-stone-800/60',
    border: 'border-stone-800/80',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-600 hover:bg-amber-500',
    accentBorder: 'border-amber-500/30',
    tagBg: 'bg-stone-800/80',
    tagText: 'text-amber-200',
    borderHover: 'hover:border-stone-700',
    cardNormal: 'bg-stone-900/40 hover:bg-stone-800/40 border-stone-800/60',
    cardActive: 'bg-stone-800/90 border-amber-500/60 shadow-md',
    buttonGhost: 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/60',
    buttonSecondary: 'bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 border border-stone-700/60',
    badgeActive: 'bg-amber-600 text-white shadow-sm',
    badgeInactive: 'bg-stone-800/60 text-stone-400 hover:bg-stone-800 hover:text-stone-200',
    bgSidebar: 'bg-[#1c1a17]'
  },
  light: {
    id: 'light',
    appBg: 'bg-[#f8fafc]',
    sidebarBg: 'bg-[#f1f5f9]',
    sidebarHeaderBg: 'bg-[#e2e8f0]',
    mainBg: 'bg-[#ffffff]',
    headerBg: 'bg-[#f8fafc]',
    filterBarBg: 'bg-[#f1f5f9]',
    cardBg: 'bg-white/70 hover:bg-white border-transparent',
    cardActiveBg: 'bg-white border-slate-300 shadow-sm',
    cardBorder: 'border-transparent',
    cardBorderActive: 'border-slate-300',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
    textMuted: 'text-slate-400',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-300 focus:border-slate-400',
    userBubbleBg: 'bg-white border-slate-200 shadow-sm',
    assistantBubbleBg: 'bg-slate-50 border-slate-200',
    border: 'border-slate-200',
    accentText: 'text-blue-600',
    accentBg: 'bg-blue-600 hover:bg-blue-500',
    accentBorder: 'border-blue-500/30',
    tagBg: 'bg-slate-200',
    tagText: 'text-slate-700',
    borderHover: 'hover:border-slate-400',
    cardNormal: 'bg-white hover:bg-slate-50 border-slate-200',
    cardActive: 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500/20',
    buttonGhost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    buttonSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300',
    badgeActive: 'bg-blue-600 text-white shadow-sm',
    badgeInactive: 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
    bgSidebar: 'bg-[#f1f5f9]'
  }
}
