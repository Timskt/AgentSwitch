import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getHierarchicalSessions, getSessionTranscript } from './db'
import { 
  formatToOpenCode, 
  formatToCodex, 
  formatToAntigravity, 
  formatToClaudeCode, 
  formatToMarkdown, 
  formatToHandoffPrompt,
  formatToPi 
} from './exporter'
import { 
  scanLocalEcosystem, 
  parseUniversalSessionFile, 
  getAllEcosystemSessions, 
  getUnifiedSessionTranscript 
} from './scanner'
import fs from 'fs'
import path from 'path'

// Set process name early so macOS Activity Monitor & Dock show AgentSwitch
app.setName('AgentSwitch')

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    title: 'AgentSwitch - 全生态 Agent 记忆与切换工坊',
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#09090b',
    trafficLightPosition: { x: 16, y: 18 }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.setTitle('AgentSwitch - 全生态 Agent 记忆与切换工坊')
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.setTitle('AgentSwitch - 全生态 Agent 记忆与切换工坊')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.agentswitch.desktop')
  
  if (process.platform === 'darwin' && app.dock) {
    try {
      app.dock.setIcon(join(__dirname, '../../resources/icon.png'))
    } catch (e) {}
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('get-sessions', (_, args?: { agentFilter?: string }) => {
    try {
      const data = getAllEcosystemSessions(args?.agentFilter || 'all')
      return { success: true, data }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('get-session-transcript', (_, { sessionId, source, includeChildren }) => {
    try {
      const data = getUnifiedSessionTranscript(sessionId, source || 'zcode', includeChildren)
      return { success: true, data }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('preview-export', (_, { sessionId, source, format, includeChildren }) => {
    try {
      const { meta, messages, analytics } = getUnifiedSessionTranscript(sessionId, source || 'zcode', includeChildren)
      let content = ''
      let filename = ''

      const cleanTitle = (meta.title || 'session').replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 40)
      const dateStr = new Date(meta.time_created || Date.now()).toISOString().slice(0, 10)
      const childTag = includeChildren ? '_merged' : ''

      if (format === 'opencode') {
        content = formatToOpenCode(meta, messages)
        filename = `${dateStr}_${cleanTitle}${childTag}.opencode.json`
      } else if (format === 'codex') {
        content = formatToCodex(meta, messages, analytics)
        filename = `${dateStr}_${cleanTitle}${childTag}.codex.json`
      } else if (format === 'pi') {
        content = formatToPi(meta, messages)
        filename = `${dateStr}_${cleanTitle}${childTag}.pi.json`
      } else if (format === 'claude') {
        content = formatToClaudeCode(meta, messages, analytics)
        filename = `${dateStr}_${cleanTitle}${childTag}.claude.json`
      } else if (format === 'antigravity') {
        content = formatToAntigravity(meta, messages)
        filename = `${dateStr}_${cleanTitle}${childTag}.transcript.jsonl`
      } else if (format === 'handoff') {
        content = formatToHandoffPrompt(meta, messages, analytics)
        filename = `${dateStr}_${cleanTitle}_handoff_prompt.md`
      } else {
        content = formatToMarkdown(meta, messages, includeChildren, analytics)
        filename = `${dateStr}_${cleanTitle}${childTag}.md`
      }

      return { success: true, content, filename, messageCount: messages.length, analytics }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('export-session-formatted', async (_, { sessionId, source, format, includeChildren }) => {
    try {
      const { meta, messages, analytics } = getUnifiedSessionTranscript(sessionId, source || 'zcode', includeChildren)
      let content = ''
      let defaultExt = '.json'

      if (format === 'opencode') {
        content = formatToOpenCode(meta, messages)
        defaultExt = '.opencode.json'
      } else if (format === 'codex') {
        content = formatToCodex(meta, messages, analytics)
        defaultExt = '.codex.json'
      } else if (format === 'pi') {
        content = formatToPi(meta, messages)
        defaultExt = '.pi.json'
      } else if (format === 'claude') {
        content = formatToClaudeCode(meta, messages, analytics)
        defaultExt = '.claude.json'
      } else if (format === 'antigravity') {
        content = formatToAntigravity(meta, messages)
        defaultExt = '.transcript.jsonl'
      } else if (format === 'handoff') {
        content = formatToHandoffPrompt(meta, messages, analytics)
        defaultExt = '_handoff_prompt.md'
      } else {
        content = formatToMarkdown(meta, messages, includeChildren, analytics)
        defaultExt = '.md'
      }

      const cleanTitle = (meta.title || 'session').replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 40)
      const dateStr = new Date(meta.time_created || Date.now()).toISOString().slice(0, 10)
      const childTag = includeChildren ? '_merged' : ''
      const defaultFilename = `${dateStr}_${cleanTitle}${childTag}${defaultExt}`

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: `Export Session to ${format.toUpperCase()}`,
        defaultPath: defaultFilename
      })

      if (!canceled && filePath) {
        fs.writeFileSync(filePath, content, 'utf-8')
        return { success: true, filePath, filename: path.basename(filePath) }
      }
      return { success: false, error: 'Cancelled' }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('batch-export-all', async (_, { format, includeChildren }) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '选择导出目录 (Select Destination Folder)',
        properties: ['openDirectory', 'createDirectory']
      })
      if (canceled || !filePaths || filePaths.length === 0) {
        return { success: false, error: 'Cancelled' }
      }

      const targetDir = filePaths[0]
      const { rootSessions } = getHierarchicalSessions()
      let exportedCount = 0

      for (const root of rootSessions) {
        try {
          const { meta, messages, analytics } = getSessionTranscript(root.id, includeChildren)
          let content = ''
          let ext = '.json'

          if (format === 'opencode') {
            content = formatToOpenCode(meta, messages)
            ext = '.opencode.json'
          } else if (format === 'codex') {
            content = formatToCodex(meta, messages, analytics)
            ext = '.codex.json'
          } else if (format === 'pi') {
            content = formatToPi(meta, messages)
            ext = '.pi.json'
          } else if (format === 'claude') {
            content = formatToClaudeCode(meta, messages, analytics)
            ext = '.claude.json'
          } else if (format === 'antigravity') {
            content = formatToAntigravity(meta, messages)
            ext = '.transcript.jsonl'
          } else if (format === 'handoff') {
            content = formatToHandoffPrompt(meta, messages, analytics)
            ext = '_handoff_prompt.md'
          } else {
            content = formatToMarkdown(meta, messages, includeChildren, analytics)
            ext = '.md'
          }

          const cleanTitle = (meta.title || 'session').replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 40)
          const dateStr = new Date(meta.time_created || Date.now()).toISOString().slice(0, 10)
          const filename = `${dateStr}_${cleanTitle}${ext}`
          fs.writeFileSync(join(targetDir, filename), content, 'utf-8')
          exportedCount++
        } catch (err) {
          console.error(`Failed to export ${root.id}:`, err)
        }
      }

      return { success: true, targetDir, exportedCount }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  // Settings & DB custom picker
  ipcMain.handle('select-custom-db', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '选择 ZCode SQLite 数据库文件',
        filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db', 'sqlite3'] }],
        properties: ['openFile']
      })
      if (!canceled && filePaths && filePaths.length > 0) {
        process.env.ZCODE_DB = filePaths[0]
        return { success: true, dbPath: filePaths[0] }
      }
      return { success: false, error: 'Cancelled' }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('check-for-updates', async () => {
    // Simulates live release check against GitHub / release channel
    return {
      success: true,
      currentVersion: '2.2.0',
      latestVersion: '2.2.0',
      isLatest: true,
      releaseDate: '2026-09-17',
      releaseNotes: 'ZCode Migrator v2.2 发布：支持多皮肤切换、Pi.ai 导出、大文本折叠与全屏查看、富文本渲染强化与零丢失 AI 接力工坊。'
    }
  })

  ipcMain.handle('open-in-folder', (_, filePath) => {
    shell.showItemInFolder(filePath)
    return { success: true }
  })

  ipcMain.handle('open-external-url', (_, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://'))) {
      shell.openExternal(url)
    }
    return { success: true }
  })

  ipcMain.handle('scan-local-ecosystem', () => {
    try {
      return { success: true, data: scanLocalEcosystem() }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('import-session-file', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '选择外部 Agent 会话文件进行导入与互转',
        filters: [
          { name: 'Supported Formats', extensions: ['json', 'jsonl', 'md'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      })
      if (!canceled && filePaths && filePaths.length > 0) {
        const filePath = filePaths[0]
        const data = parseUniversalSessionFile(filePath)
        return { success: true, data, filePath }
      }
      return { success: false, error: 'Cancelled' }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
