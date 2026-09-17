import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getSessions: (agentFilter?: string) => ipcRenderer.invoke('get-sessions', { agentFilter }),
  getSessionTranscript: (sessionId: string, includeChildren: boolean = false, source?: string) => 
    ipcRenderer.invoke('get-session-transcript', { sessionId, includeChildren, source }),
  previewExport: (sessionId: string, format: string, includeChildren: boolean = true, source?: string) =>
    ipcRenderer.invoke('preview-export', { sessionId, format, includeChildren, source }),
  exportSessionFormatted: (sessionId: string, format: string, includeChildren: boolean = true, source?: string) =>
    ipcRenderer.invoke('export-session-formatted', { sessionId, format, includeChildren, source }),
  batchExportAll: (format: string, includeChildren: boolean = true) =>
    ipcRenderer.invoke('batch-export-all', { format, includeChildren }),
  selectCustomDb: () => ipcRenderer.invoke('select-custom-db'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  openInFolder: (filePath: string) => ipcRenderer.invoke('open-in-folder', filePath),
  openExternalUrl: (url: string) => ipcRenderer.invoke('open-external-url', url),
  exportFile: (data: { filename: string, content: string }) => ipcRenderer.invoke('export-file', data),
  scanLocalEcosystem: () => ipcRenderer.invoke('scan-local-ecosystem'),
  importSessionFile: () => ipcRenderer.invoke('import-session-file'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
