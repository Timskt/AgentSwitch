export type AppThemeMode = 'system' | 'obsidian' | 'midnight' | 'solar' | 'light'
export type AppTheme = 'obsidian' | 'midnight' | 'solar' | 'light'

export interface ThemeColors {
  id: AppTheme
  isDark: boolean
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
  modalBg: string
  modalHeaderBg: string
  modalBackdropBg: string
  codeBlockBg: string
  codeBlockHeaderBg: string
  inlineCodeBg: string
  kbdBg: string
  pillActiveBg: string
  pillInactiveBg: string
  roleUserBadge: string
  roleAssistantBadge: string
  tableHeaderBg: string
  tableRowAltBg: string
  subtleBoxBg: string
  accordionBg: string
}

export function getSystemTheme(): AppTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'obsidian' : 'light'
  }
  return 'obsidian'
}

export function resolveEffectiveTheme(mode: AppThemeMode): AppTheme {
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode
}

export const THEME_STYLES: Record<AppTheme, ThemeColors> = {
  obsidian: {
    id: 'obsidian',
    isDark: true,
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
    bgSidebar: 'bg-[#0e0e11]',
    modalBg: 'bg-[#121215] border-zinc-800 text-zinc-100 shadow-2xl',
    modalHeaderBg: 'bg-[#18181b] border-zinc-800 text-zinc-100',
    modalBackdropBg: 'bg-black/80 backdrop-blur-sm',
    codeBlockBg: 'bg-[#09090b] border-zinc-700/60 text-zinc-200',
    codeBlockHeaderBg: 'bg-zinc-900/90 border-zinc-800/80 text-zinc-400',
    inlineCodeBg: 'bg-zinc-800/60 text-zinc-200 border-zinc-700/40',
    kbdBg: 'bg-zinc-800 border-zinc-700/60 text-zinc-400',
    pillActiveBg: 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-xs',
    pillInactiveBg: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
    roleUserBadge: 'bg-zinc-800/90 border-zinc-700/60 text-zinc-200',
    roleAssistantBadge: 'bg-zinc-800/90 border-zinc-700/60 text-zinc-200',
    tableHeaderBg: 'bg-zinc-900/90 text-zinc-200 border-zinc-800',
    tableRowAltBg: 'bg-zinc-900/20',
    subtleBoxBg: 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300',
    accordionBg: 'bg-zinc-950/40 border-zinc-800/60'
  },
  midnight: {
    id: 'midnight',
    isDark: true,
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
    bgSidebar: 'bg-[#0f141d]',
    modalBg: 'bg-[#111622] border-slate-800 text-slate-100 shadow-2xl',
    modalHeaderBg: 'bg-[#161d2d] border-slate-800 text-slate-100',
    modalBackdropBg: 'bg-black/80 backdrop-blur-sm',
    codeBlockBg: 'bg-[#090d15] border-slate-700/60 text-slate-200',
    codeBlockHeaderBg: 'bg-slate-900/90 border-slate-800/80 text-slate-400',
    inlineCodeBg: 'bg-slate-800/60 text-cyan-200 border-slate-700/40',
    kbdBg: 'bg-slate-800 border-slate-700/60 text-slate-400',
    pillActiveBg: 'bg-slate-800 border-slate-700 text-slate-100 shadow-xs',
    pillInactiveBg: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
    roleUserBadge: 'bg-slate-800/90 border-slate-700/60 text-slate-200',
    roleAssistantBadge: 'bg-slate-800/90 border-slate-700/60 text-slate-200',
    tableHeaderBg: 'bg-slate-900/90 text-slate-200 border-slate-800',
    tableRowAltBg: 'bg-slate-900/20',
    subtleBoxBg: 'bg-[#0a0e17]/80 border-slate-800/80 text-slate-300',
    accordionBg: 'bg-[#090d15]/50 border-slate-800/60'
  },
  solar: {
    id: 'solar',
    isDark: true,
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
    bgSidebar: 'bg-[#1c1a17]',
    modalBg: 'bg-[#1a1714] border-stone-800 text-amber-50 shadow-2xl',
    modalHeaderBg: 'bg-[#221f1a] border-stone-800 text-amber-50',
    modalBackdropBg: 'bg-black/80 backdrop-blur-sm',
    codeBlockBg: 'bg-[#110f0d] border-stone-700/60 text-stone-200',
    codeBlockHeaderBg: 'bg-stone-900/90 border-stone-800/80 text-stone-400',
    inlineCodeBg: 'bg-stone-800/60 text-amber-200 border-stone-700/40',
    kbdBg: 'bg-stone-800 border-stone-700/60 text-stone-400',
    pillActiveBg: 'bg-stone-800 border-stone-700 text-stone-100 shadow-xs',
    pillInactiveBg: 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50',
    roleUserBadge: 'bg-stone-800/90 border-stone-700/60 text-amber-100',
    roleAssistantBadge: 'bg-stone-800/90 border-stone-700/60 text-amber-100',
    tableHeaderBg: 'bg-stone-900/90 text-stone-200 border-stone-800',
    tableRowAltBg: 'bg-stone-900/20',
    subtleBoxBg: 'bg-[#13110e]/80 border-stone-800/80 text-stone-300',
    accordionBg: 'bg-[#12100e]/50 border-stone-800/60'
  },
  light: {
    id: 'light',
    isDark: false,
    appBg: 'bg-[#f8fafc]',
    sidebarBg: 'bg-[#ffffff]',
    sidebarHeaderBg: 'bg-[#f8fafc]',
    mainBg: 'bg-[#ffffff]',
    headerBg: 'bg-[#ffffff]',
    filterBarBg: 'bg-[#f8fafc]',
    cardBg: 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs',
    cardActiveBg: 'bg-indigo-50/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20',
    cardBorder: 'border-slate-200',
    cardBorderActive: 'border-indigo-500',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
    textMuted: 'text-slate-500',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-300 focus:border-indigo-500',
    userBubbleBg: 'bg-slate-50/90 border-slate-200/90 shadow-2xs',
    assistantBubbleBg: 'bg-white border-slate-200',
    border: 'border-slate-200',
    accentText: 'text-indigo-600',
    accentBg: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    accentBorder: 'border-indigo-500/30',
    tagBg: 'bg-slate-100',
    tagText: 'text-slate-700',
    borderHover: 'hover:border-slate-300',
    cardNormal: 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs',
    cardActive: 'bg-indigo-50/60 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20',
    buttonGhost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    buttonSecondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs',
    badgeActive: 'bg-indigo-600 text-white shadow-xs',
    badgeInactive: 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
    bgSidebar: 'bg-[#ffffff]',
    modalBg: 'bg-white border-slate-200 text-slate-900 shadow-2xl',
    modalHeaderBg: 'bg-slate-50 border-slate-200 text-slate-900',
    modalBackdropBg: 'bg-slate-900/40 backdrop-blur-sm',
    codeBlockBg: 'bg-[#f8fafc] border-slate-200 text-slate-800',
    codeBlockHeaderBg: 'bg-slate-100 border-slate-200 text-slate-600',
    inlineCodeBg: 'bg-slate-100 text-indigo-700 border-slate-200 font-medium',
    kbdBg: 'bg-slate-100 border-slate-200 text-slate-600',
    pillActiveBg: 'bg-white border-slate-300 text-slate-900 shadow-xs font-semibold',
    pillInactiveBg: 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    roleUserBadge: 'bg-slate-900 text-white border-slate-800 font-semibold',
    roleAssistantBadge: 'bg-slate-100 border-slate-200 text-slate-800 font-semibold',
    tableHeaderBg: 'bg-slate-100 text-slate-800 border-slate-200',
    tableRowAltBg: 'bg-slate-50/60',
    subtleBoxBg: 'bg-slate-50 border-slate-200 text-slate-700',
    accordionBg: 'bg-slate-50/60 border-slate-200'
  }
}
