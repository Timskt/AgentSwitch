import { ElectronAPI } from '@electron-toolkit/preload'

export interface AgentSwitchApi {
  getSessions: (agentFilter?: string) => Promise<any>
  getSessionTranscript: (sessionId: string, includeChildren?: boolean, source?: string) => Promise<any>
  previewExport: (sessionId: string, format: string, includeChildren?: boolean, source?: string) => Promise<any>
  exportSessionFormatted: (sessionId: string, format: string, includeChildren?: boolean, source?: string) => Promise<any>
  batchExportAll: (format: string, includeChildren?: boolean) => Promise<any>
  selectCustomDb: () => Promise<any>
  checkForUpdates: () => Promise<any>
  openInFolder: (filePath: string) => Promise<{ success: boolean }>
  openInEditor: (filePath: string) => Promise<{ success: boolean, path?: string, error?: string }>
  readFilePreview: (targetPath: string, workspacePath?: string) => Promise<{
    success: boolean
    reason?: string
    targetPath?: string
    path?: string
    name?: string
    size?: number
    ext?: string
    isImage?: boolean
    dataUrl?: string
    isText?: boolean
    content?: string
    isDirectory?: boolean
    isOversized?: boolean
    isBinary?: boolean
    error?: string
  }>
  openExternalUrl: (url: string) => Promise<{ success: boolean }>
  exportFile: (data: { filename: string, content: string }) => Promise<any>
  scanLocalEcosystem: () => Promise<any>
  importSessionFile: () => Promise<any>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AgentSwitchApi
  }
}
