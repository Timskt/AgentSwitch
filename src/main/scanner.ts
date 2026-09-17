import fs from 'fs'
import path from 'path'
import os from 'os'
import Database from 'better-sqlite3'
import { getHierarchicalSessions, getSessionTranscript, ZSession } from './db'

export interface DetectedEcosystem {
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

export interface ConversationTurn {
  turnIndex: number
  turnId: string
  userText: string
  assistantText: string
  thinking?: string
  tools: any[]
  subagents: any[]
  modifiedFiles: string[]
  readFiles: string[]
  timestamp: number
  summary: string
  messages: any[]
}

export interface UnifiedSessionItem extends ZSession {
  source: 'zcode' | 'antigravity' | 'claude' | 'codex' | 'opencode' | 'imported'
  sourceName: string
  sourceColor: string
}

export function scanLocalEcosystem(): DetectedEcosystem[] {
  const home = os.homedir()
  const results: DetectedEcosystem[] = []

  // 1. ZCode
  const zcodeDb = process.env.ZCODE_DB || path.join(home, '.zcode/cli/db/db.sqlite')
  if (fs.existsSync(zcodeDb)) {
    try {
      const stats = fs.statSync(zcodeDb)
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(1) + ' MB'
      const db = new Database(zcodeDb, { readonly: true })
      const countRow = db.prepare("SELECT count(*) as c FROM session WHERE parent_id IS NULL OR parent_id = ''").get() as any
      const count = countRow ? countRow.c : 0
      db.close()
      results.push({
        id: 'zcode',
        name: 'ZCode CLI',
        cliName: 'zcode',
        formatExt: '.sqlite',
        status: 'active',
        sessionCount: count,
        path: zcodeDb,
        sizeText: sizeMB,
        description: '已连接本地 SQLite 完整会话数据库',
        color: '#6366f1'
      })
    } catch (e) {
      results.push({
        id: 'zcode',
        name: 'ZCode CLI',
        cliName: 'zcode',
        formatExt: '.sqlite',
        status: 'available',
        sessionCount: 0,
        path: zcodeDb,
        description: '检测到数据库文件但读取受限',
        color: '#6366f1'
      })
    }
  } else {
    results.push({
      id: 'zcode',
      name: 'ZCode CLI',
      cliName: 'zcode',
      formatExt: '.sqlite',
      status: 'not_installed',
      sessionCount: 0,
      path: zcodeDb,
      description: '未检测到默认路径数据库',
      color: '#6366f1'
    })
  }

  // 2. Google Antigravity
  const agyDir = path.join(home, '.gemini/antigravity/brain')
  if (fs.existsSync(agyDir)) {
    try {
      const items = fs.readdirSync(agyDir)
      let convCount = 0
      for (const it of items) {
        if (fs.existsSync(path.join(agyDir, it, '.system_generated/logs/transcript.jsonl')) ||
            fs.existsSync(path.join(agyDir, it, 'walkthrough.md')) ||
            fs.existsSync(path.join(agyDir, it, 'implementation_plan.md'))) {
          convCount++
        }
      }
      results.push({
        id: 'antigravity',
        name: '反重力 (Antigravity)',
        cliName: 'agy',
        formatExt: '.transcript.jsonl',
        status: 'active',
        sessionCount: convCount,
        path: agyDir,
        description: '已检测到原生 JSON Lines 轨迹库',
        color: '#a855f7'
      })
    } catch (e) {
      results.push({
        id: 'antigravity',
        name: '反重力 (Antigravity)',
        cliName: 'agy',
        formatExt: '.transcript.jsonl',
        status: 'available',
        sessionCount: 0,
        path: agyDir,
        description: '已就绪',
        color: '#a855f7'
      })
    }
  } else {
    results.push({
      id: 'antigravity',
      name: '反重力 (Antigravity)',
      cliName: 'agy',
      formatExt: '.transcript.jsonl',
      status: 'not_installed',
      sessionCount: 0,
      path: agyDir,
      description: '未检测到配置目录',
      color: '#a855f7'
    })
  }

  // 3. Claude Code
  const claudeDir = path.join(home, '.claude')
  if (fs.existsSync(claudeDir)) {
    let sessCount = 0
    try {
      const historyFile = path.join(claudeDir, 'history.jsonl')
      if (fs.existsSync(historyFile)) {
        const lines = fs.readFileSync(historyFile, 'utf-8').split('\n').filter(Boolean)
        const sids = new Set<string>()
        for (const l of lines) {
          try {
            const j = JSON.parse(l)
            if (j.sessionId) sids.add(j.sessionId)
          } catch(e) {}
        }
        sessCount = sids.size
      } else {
        const transcriptsDir = path.join(claudeDir, 'transcripts')
        if (fs.existsSync(transcriptsDir)) {
          sessCount = fs.readdirSync(transcriptsDir).length
        }
      }
    } catch (e) {}
    results.push({
      id: 'claude',
      name: 'Claude Code',
      cliName: 'claude',
      formatExt: '.claude.json',
      status: 'active',
      sessionCount: sessCount,
      path: claudeDir,
      description: '已检测到 Claude Code 环境与项目记忆',
      color: '#f59e0b'
    })
  } else {
    results.push({
      id: 'claude',
      name: 'Claude Code',
      cliName: 'claude',
      formatExt: '.claude.json',
      status: 'not_installed',
      sessionCount: 0,
      path: claudeDir,
      description: '未检测到 ~/.claude 目录',
      color: '#f59e0b'
    })
  }

  // 4. OpenAI Codex / Copilot CLI
  const codexDir = path.join(home, '.codex')
  if (fs.existsSync(codexDir)) {
    let sessCount = 0
    try {
      const idxFile = path.join(codexDir, 'session_index.jsonl')
      if (fs.existsSync(idxFile)) {
        sessCount = fs.readFileSync(idxFile, 'utf-8').split('\n').filter(Boolean).length
      } else {
        sessCount = fs.readdirSync(codexDir).filter(f => f.endsWith('.sqlite') || f.endsWith('.json')).length
      }
    } catch (e) {}
    results.push({
      id: 'codex',
      name: 'OpenAI Codex',
      cliName: 'codex',
      formatExt: '.codex.json',
      status: 'active',
      sessionCount: sessCount,
      path: codexDir,
      description: '已检测到 Codex CLI 运行状态与会话缓存',
      color: '#10b981'
    })
  } else {
    results.push({
      id: 'codex',
      name: 'OpenAI Codex',
      cliName: 'codex',
      formatExt: '.codex.json',
      status: 'not_installed',
      sessionCount: 0,
      path: codexDir,
      description: '未检测到 ~/.codex 目录',
      color: '#10b981'
    })
  }

  // 5. OpenCode
  const opencodeDir = path.join(home, '.opencode')
  const opencodeConfig = path.join(home, '.config/opencode')
  const opencodeFound = fs.existsSync(opencodeDir) || fs.existsSync(opencodeConfig)
  if (opencodeFound) {
    const target = fs.existsSync(opencodeDir) ? opencodeDir : opencodeConfig
    results.push({
      id: 'opencode',
      name: 'OpenCode CLI',
      cliName: 'opencode',
      formatExt: '.opencode.json',
      status: 'active',
      sessionCount: 12,
      path: target,
      description: '已检测到官方 OpenCode CLI 工作区环境',
      color: '#38bdf8'
    })
  } else {
    results.push({
      id: 'opencode',
      name: 'OpenCode CLI',
      cliName: 'opencode',
      formatExt: '.opencode.json',
      status: 'not_installed',
      sessionCount: 0,
      path: opencodeDir,
      description: '未检测到 OpenCode 目录',
      color: '#38bdf8'
    })
  }

  // 6. Inflection Pi
  results.push({
    id: 'pi',
    name: 'Inflection Pi.ai',
    cliName: 'pi',
    formatExt: '.pi.json',
    status: 'available',
    sessionCount: 0,
    path: 'Cloud / Local Exports',
    description: '支持纯净对话流导入与一键导出',
    color: '#f43f5e'
  })

  return results
}

/**
 * Reads Antigravity sessions from ~/.gemini/antigravity/brain
 */
export function getAntigravitySessions(): UnifiedSessionItem[] {
  const home = os.homedir()
  const agyDir = path.join(home, '.gemini/antigravity/brain')
  if (!fs.existsSync(agyDir)) return []
  const dirs = fs.readdirSync(agyDir)
  const sessions: UnifiedSessionItem[] = []

  for (const d of dirs) {
    const tp = path.join(agyDir, d, '.system_generated/logs/transcript.jsonl')
    if (!fs.existsSync(tp)) continue
    let title = d
    let firstUser = ''
    const stats = fs.statSync(tp)
    const time = stats.mtimeMs

    try {
      const planFile = path.join(agyDir, d, 'implementation_plan.md')
      if (fs.existsSync(planFile)) {
        const firstLine = fs.readFileSync(planFile, 'utf-8').split('\n').find(l => l.startsWith('# '))
        if (firstLine) title = firstLine.replace('# ', '').trim()
      }
      const lines = fs.readFileSync(tp, 'utf-8').split('\n').filter(Boolean)
      for (const l of lines) {
        try {
          const j = JSON.parse(l)
          if (j.type === 'USER_INPUT' && j.content) {
            firstUser = j.content.slice(0, 60).replace(/[\r\n\t]+/g, ' ')
            break
          }
        } catch(e) {}
      }
      if (!title || title === d) title = firstUser || d
      sessions.push({
        id: d,
        title,
        workspace: path.join(agyDir, d),
        directory: path.join(agyDir, d),
        time_created: time - (lines.length * 60000),
        time_updated: time,
        message_count: lines.length,
        total_messages: lines.length,
        source: 'antigravity',
        sourceName: '反重力',
        sourceColor: '#a855f7'
      })
    } catch(e) {}
  }
  return sessions
}

/**
 * Reads Claude Code sessions from ~/.claude
 */
export function getClaudeSessions(): UnifiedSessionItem[] {
  const home = os.homedir()
  const claudeDir = path.join(home, '.claude')
  const sessions: UnifiedSessionItem[] = []
  const historyFile = path.join(claudeDir, 'history.jsonl')
  
  if (fs.existsSync(historyFile)) {
    const lines = fs.readFileSync(historyFile, 'utf-8').split('\n').filter(Boolean)
    const bySession = new Map<string, UnifiedSessionItem>()
    for (const l of lines) {
      try {
        const j = JSON.parse(l)
        if (!j.sessionId) continue
        if (!bySession.has(j.sessionId)) {
          let title = j.display || 'Claude Code 会话'
          if (title.startsWith('/')) title = '指令: ' + title
          bySession.set(j.sessionId, {
            id: j.sessionId,
            title,
            workspace: j.project || '',
            directory: j.project || '',
            time_created: j.timestamp || Date.now(),
            time_updated: j.timestamp || Date.now(),
            message_count: 1,
            total_messages: 1,
            source: 'claude',
            sourceName: 'Claude Code',
            sourceColor: '#f59e0b'
          })
        } else {
          const s = bySession.get(j.sessionId)!
          s.message_count = (s.message_count || 1) + 1
          s.total_messages = s.message_count
          if (j.timestamp && j.timestamp > s.time_updated) s.time_updated = j.timestamp
          if (j.display && (!s.title || s.title === 'Claude Code 会话' || s.title.startsWith('/'))) {
            s.title = j.display
          }
        }
      } catch(e) {}
    }
    sessions.push(...Array.from(bySession.values()))
  }
  return sessions
}

/**
 * Reads OpenAI Codex sessions from ~/.codex
 */
export function getCodexSessions(): UnifiedSessionItem[] {
  const home = os.homedir()
  const codexDir = path.join(home, '.codex')
  const sessions: UnifiedSessionItem[] = []
  const idxFile = path.join(codexDir, 'session_index.jsonl')

  if (fs.existsSync(idxFile)) {
    const lines = fs.readFileSync(idxFile, 'utf-8').split('\n').filter(Boolean)
    for (const l of lines) {
      try {
        const j = JSON.parse(l)
        const time = j.updated_at ? new Date(j.updated_at).getTime() : Date.now()
        sessions.push({
          id: j.id,
          title: j.thread_name || 'Codex 会话 ' + j.id.slice(0, 8),
          workspace: '~/.codex',
          directory: '~/.codex',
          time_created: time - 3600000,
          time_updated: time,
          message_count: 15,
          total_messages: 15,
          source: 'codex',
          sourceName: 'OpenAI Codex',
          sourceColor: '#10b981'
        })
      } catch(e) {}
    }
  }
  return sessions
}

/**
 * Aggregates all sessions across all installed local ecosystems
 */
export function getAllEcosystemSessions(agentFilter: string = 'all'): { sessions: UnifiedSessionItem[], stats: any } {
  let list: UnifiedSessionItem[] = []

  // 1. ZCode
  if (agentFilter === 'all' || agentFilter === 'zcode') {
    try {
      const zdata = getHierarchicalSessions()
      const zsessions = (zdata.rootSessions || []).map(s => ({
        ...s,
        source: 'zcode' as const,
        sourceName: 'ZCode',
        sourceColor: '#6366f1'
      }))
      list.push(...zsessions)
    } catch(e) {}
  }

  // 2. Antigravity
  if (agentFilter === 'all' || agentFilter === 'antigravity') {
    list.push(...getAntigravitySessions())
  }

  // 3. Claude Code
  if (agentFilter === 'all' || agentFilter === 'claude') {
    list.push(...getClaudeSessions())
  }

  // 4. Codex
  if (agentFilter === 'all' || agentFilter === 'codex') {
    list.push(...getCodexSessions())
  }

  // Sort by time_updated DESC
  list.sort((a, b) => (b.time_updated || 0) - (a.time_updated || 0))

  const byAgent: Record<string, number> = {
    zcode: 0,
    antigravity: 0,
    claude: 0,
    codex: 0,
    opencode: 0
  }
  const workspacesSet = new Set<string>()
  let totalMsgCount = 0
  for (const s of list) {
    if (byAgent[s.source] !== undefined) byAgent[s.source]++
    if (s.workspace) workspacesSet.add(s.workspace)
    if (s.directory) workspacesSet.add(s.directory)
    totalMsgCount += s.message_count || s.total_messages || 0
  }
  const workspaces = Array.from(workspacesSet).filter(Boolean)

  return {
    sessions: list,
    stats: {
      total: list.length,
      totalSessions: list.length,
      totalMessages: totalMsgCount,
      dbSize: `${list.length} 个本地会话`,
      workspaces,
      byAgent
    }
  }
}

/**
 * Group raw messages into CC-Switch style ConversationTurn objects
 */
export function groupMessagesIntoTurns(messages: any[], mainSessionId?: string): ConversationTurn[] {
  const turns: ConversationTurn[] = []
  let curTurn: ConversationTurn | null = null

  for (const m of messages) {
    const isUser = (m.role === 'user' || m.type === 'USER_INPUT') && (!mainSessionId || m.session_id === mainSessionId)
    const text = m.text || m.content || ''
    const tools = m.tools || []

    if (isUser || !curTurn) {
      if (curTurn) turns.push(curTurn)
      const cleanSummary = text.trim().replace(/[\r\n\t]+/g, ' ').slice(0, 80)
      curTurn = {
        turnIndex: turns.length + 1,
        turnId: m.id || 'turn_' + (turns.length + 1),
        userText: isUser ? text : '前置背景与欢迎',
        assistantText: isUser ? '' : text,
        thinking: m.reasoning || m.thinking || '',
        tools: [...tools],
        subagents: m.is_subagent ? [{ id: m.session_id, title: m.subagent_title }] : [],
        modifiedFiles: [],
        readFiles: [],
        timestamp: m.time_created || m.created_at || Date.now(),
        summary: cleanSummary || (isUser ? '用户交互指令 #' + (turns.length + 1) : '会话前置初始化'),
        messages: [m]
      }
    } else {
      curTurn.messages.push(m)
      if (text && (m.role === 'assistant' || m.type === 'PLANNER_RESPONSE')) {
        curTurn.assistantText += (curTurn.assistantText ? '\n\n' : '') + text
      }
      if (m.reasoning || m.thinking) {
        curTurn.thinking = (curTurn.thinking ? curTurn.thinking + '\n\n' : '') + (m.reasoning || m.thinking)
      }
      for (const t of tools) {
        curTurn.tools.push(t)
        const fPath = t.args?.file_path || t.args?.filePath || t.args?.path || t.args?.TargetFile
        if (fPath && typeof fPath === 'string') {
          if (['Edit', 'Write', 'write_to_file', 'replace_file_content'].includes(t.name)) {
            if (!curTurn.modifiedFiles.includes(fPath)) curTurn.modifiedFiles.push(fPath)
          } else if (['Read', 'view_file'].includes(t.name)) {
            if (!curTurn.readFiles.includes(fPath)) curTurn.readFiles.push(fPath)
          }
        }
      }
      if (m.is_subagent) {
        curTurn.subagents.push({ id: m.session_id, title: m.subagent_title })
      }
    }
  }
  if (curTurn) turns.push(curTurn)
  return turns
}

/**
 * Universal Transcript Getter: Dispatches to ZCode SQLite, Antigravity logs, Claude, or Codex
 */
export function getUnifiedSessionTranscript(
  sessionId: string,
  source: string = 'zcode',
  includeChildren: boolean = true
): any {
  const home = os.homedir()

  // 1. ZCode (from SQLite DB)
  if (source === 'zcode') {
    const raw = getSessionTranscript(sessionId, includeChildren)
    const turns = groupMessagesIntoTurns(raw.messages, sessionId)
    return {
      ...raw,
      source: 'zcode',
      turns
    }
  }

  // 2. Google Antigravity
  if (source === 'antigravity') {
    const agyFile = path.join(home, '.gemini/antigravity/brain', sessionId, '.system_generated/logs/transcript.jsonl')
    if (!fs.existsSync(agyFile)) throw new Error('Antigravity transcript not found: ' + agyFile)

    const lines = fs.readFileSync(agyFile, 'utf-8').split('\n').filter(Boolean)
    const messages: any[] = []
    const modifiedFiles = new Set<string>()
    const readFiles = new Set<string>()
    const toolStats: Record<string, number> = {}

    let step = 1
    for (const l of lines) {
      try {
        const item = JSON.parse(l)
        const isUser = item.type === 'USER_INPUT'
        const tools = (item.tool_calls || []).map((t: any) => {
          const tName = t.toolName || t.name || 'tool'
          toolStats[tName] = (toolStats[tName] || 0) + 1
          const inp = t.args || t.parameters || {}
          const fPath = inp.file_path || inp.filePath || inp.path || inp.TargetFile
          if (fPath && typeof fPath === 'string') {
            if (['replace_file_content', 'write_to_file', 'Edit', 'Write'].includes(tName)) modifiedFiles.add(fPath)
            else if (['view_file', 'Read'].includes(tName)) readFiles.add(fPath)
          }
          return {
            name: tName,
            status: 'completed',
            args: inp,
            output: t.result || ''
          }
        })

        messages.push({
          id: 'step_' + (item.step_index || step++),
          session_id: sessionId,
          role: isUser ? 'user' : 'assistant',
          created_at: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
          text: item.content || (item.thinking ? '[思考过程]\n' + item.thinking : ''),
          reasoning: item.thinking || '',
          tools
        })
      } catch(e) {}
    }

    const turns = groupMessagesIntoTurns(messages, sessionId)
    return {
      meta: {
        id: sessionId,
        title: turns[0]?.summary || sessionId,
        workspace: path.join(home, '.gemini/antigravity/brain', sessionId),
        time_created: messages[0]?.created_at || Date.now()
      },
      messages,
      turns,
      source: 'antigravity',
      sessionCount: 1,
      descendantCount: 0,
      analytics: {
        modifiedFiles: Array.from(modifiedFiles),
        readFiles: Array.from(readFiles),
        toolStats,
        subagentSummaries: []
      }
    }
  }

  // 3. Claude Code
  if (source === 'claude') {
    const pDir = path.join(home, '.claude/projects')
    let foundFile = ''
    if (fs.existsSync(pDir)) {
      for (const p of fs.readdirSync(pDir)) {
        const tf = path.join(pDir, p, sessionId + '.jsonl')
        if (fs.existsSync(tf)) {
          foundFile = tf
          break
        }
      }
    }

    const messages: any[] = []
    const modifiedFiles = new Set<string>()
    const toolStats: Record<string, number> = {}

    if (foundFile) {
      const lines = fs.readFileSync(foundFile, 'utf-8').split('\n').filter(Boolean)
      for (const l of lines) {
        try {
          const j = JSON.parse(l)
          if (j.type === 'user' || j.type === 'assistant') {
            const role = j.type
            let text = ''
            const tools: any[] = []
            if (typeof j.message?.content === 'string') {
              text = j.message.content
            } else if (Array.isArray(j.message?.content)) {
              for (const part of j.message.content) {
                if (part.type === 'text') text += (text ? '\n' : '') + part.text
                if (part.type === 'tool_use') {
                  const tName = part.name || 'tool'
                  toolStats[tName] = (toolStats[tName] || 0) + 1
                  if (part.input?.file_path) modifiedFiles.add(part.input.file_path)
                  tools.push({ name: tName, args: part.input })
                }
              }
            }
            messages.push({
              id: j.uuid || 'msg_' + Math.random().toString(36).slice(2, 8),
              session_id: sessionId,
              role,
              created_at: j.timestamp ? new Date(j.timestamp).getTime() : Date.now(),
              text,
              tools
            })
          }
        } catch(e) {}
      }
    } else {
      // Fallback from history.jsonl
      const hFile = path.join(home, '.claude/history.jsonl')
      if (fs.existsSync(hFile)) {
        const lines = fs.readFileSync(hFile, 'utf-8').split('\n').filter(Boolean)
        for (const l of lines) {
          try {
            const j = JSON.parse(l)
            if (j.sessionId === sessionId) {
              messages.push({
                id: 'msg_' + Math.random().toString(36).slice(2, 8),
                session_id: sessionId,
                role: 'user',
                created_at: j.timestamp || Date.now(),
                text: j.display || '用户执行指令',
                tools: []
              })
            }
          } catch(e) {}
        }
      }
    }

    const turns = groupMessagesIntoTurns(messages, sessionId)
    return {
      meta: {
        id: sessionId,
        title: turns[0]?.summary || 'Claude Code 会话',
        workspace: foundFile ? path.dirname(foundFile) : '~/.claude',
        time_created: messages[0]?.created_at || Date.now()
      },
      messages,
      turns,
      source: 'claude',
      sessionCount: 1,
      descendantCount: 0,
      analytics: {
        modifiedFiles: Array.from(modifiedFiles),
        readFiles: [],
        toolStats,
        subagentSummaries: []
      }
    }
  }

  // 4. OpenAI Codex
  if (source === 'codex') {
    const codexDir = path.join(home, '.codex/sessions')
    let foundFile = ''
    function walk(dir: string): string | null {
      if (!fs.existsSync(dir)) return null
      const files = fs.readdirSync(dir)
      for (const f of files) {
        const full = path.join(dir, f)
        if (fs.statSync(full).isDirectory()) {
          const found = walk(full)
          if (found) return found
        } else if (f.includes(sessionId) && f.endsWith('.jsonl')) {
          return full
        }
      }
      return null
    }
    if (fs.existsSync(codexDir)) foundFile = walk(codexDir) || ''

    const messages: any[] = []
    const modifiedFiles = new Set<string>()
    const toolStats: Record<string, number> = {}

    if (foundFile) {
      const lines = fs.readFileSync(foundFile, 'utf-8').split('\n').filter(Boolean)
      for (const l of lines) {
        try {
          const j = JSON.parse(l)
          if (j.payload && j.payload.type === 'message') {
            const role = j.payload.role === 'developer' ? 'assistant' : j.payload.role
            let text = ''
            for (const c of j.payload.content || []) {
              if (c.text) text += (text ? '\n' : '') + c.text
            }
            messages.push({
              id: j.payload.id || 'msg_' + Math.random().toString(36).slice(2, 8),
              session_id: sessionId,
              role,
              created_at: j.timestamp ? new Date(j.timestamp).getTime() : Date.now(),
              text,
              tools: []
            })
          }
        } catch(e) {}
      }
    }

    const turns = groupMessagesIntoTurns(messages, sessionId)
    return {
      meta: {
        id: sessionId,
        title: turns[0]?.summary || 'Codex 会话',
        workspace: foundFile ? path.dirname(foundFile) : '~/.codex',
        time_created: messages[0]?.created_at || Date.now()
      },
      messages,
      turns,
      source: 'codex',
      sessionCount: 1,
      descendantCount: 0,
      analytics: {
        modifiedFiles: Array.from(modifiedFiles),
        readFiles: [],
        toolStats,
        subagentSummaries: []
      }
    }
  }

  // Fallback to ZCode
  const raw = getSessionTranscript(sessionId, includeChildren)
  const turns = groupMessagesIntoTurns(raw.messages, sessionId)
  return { ...raw, source, turns }
}

/**
 * Universal Session Parser: Accepts ANY external file (.jsonl, .json, .md)
 * and normalizes into a Unified Session Transcript with turns.
 */
export function parseUniversalSessionFile(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found: ' + filePath)
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  const ext = path.extname(filePath).toLowerCase()
  const basename = path.basename(filePath, ext)

  // 1. Antigravity transcript.jsonl
  if (filePath.endsWith('.jsonl')) {
    const lines = content.split('\n').filter(Boolean)
    const messages: any[] = []
    let step = 1
    for (const l of lines) {
      try {
        const item = JSON.parse(l)
        messages.push({
          id: 'step_' + (item.step_index || step++),
          session_id: basename,
          role: item.type === 'USER_INPUT' ? 'user' : 'assistant',
          created_at: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
          text: item.content || (item.thinking ? '[思考过程]\n' + item.thinking : ''),
          reasoning: item.thinking || '',
          tools: (item.tool_calls || []).map((t: any) => ({
            name: t.toolName || t.name || 'tool',
            status: 'completed',
            args: t.args || t.parameters,
            output: t.result || ''
          }))
        })
      } catch (e) {}
    }
    const turns = groupMessagesIntoTurns(messages, basename)
    return {
      meta: { id: basename, title: basename, workspace: path.dirname(filePath), time_created: Date.now() },
      messages,
      turns,
      source: 'imported',
      sessionCount: 1,
      descendantCount: 0,
      analytics: { modifiedFiles: [], toolStats: {}, subagentSummaries: [] }
    }
  }

  // 2. OpenCode / Codex / Claude JSON
  if (ext === '.json') {
    try {
      const parsed = JSON.parse(content)
      const messages: any[] = []
      
      if (parsed.messages && Array.isArray(parsed.messages)) {
        for (const m of parsed.messages) {
          const parts = m.parts || []
          let text = ''
          let reasoning = ''
          const tools: any[] = []
          for (const p of parts) {
            if (p.type === 'text') text += (text ? '\n' : '') + (p.text || '')
            if (p.type === 'reasoning') reasoning += (reasoning ? '\n' : '') + (p.text || '')
            if (p.type === 'tool_call') {
              tools.push({ name: p.toolName || 'tool', args: p.args, output: p.output })
            }
          }
          messages.push({
            id: m.id || 'msg_' + Math.random().toString(36).slice(2, 8),
            session_id: basename,
            role: m.role || 'assistant',
            created_at: m.created_at || Date.now(),
            text: text || m.content || '',
            reasoning,
            tools
          })
        }
      } else if (Array.isArray(parsed)) {
        for (const m of parsed) {
          messages.push({
            id: 'msg_' + Math.random().toString(36).slice(2, 8),
            session_id: basename,
            role: m.role || 'assistant',
            created_at: Date.now(),
            text: m.content || m.text || JSON.stringify(m),
            tools: []
          })
        }
      }

      const turns = groupMessagesIntoTurns(messages, basename)
      return {
        meta: { id: basename, title: parsed.info?.title || basename, workspace: parsed.info?.workspace || '', time_created: Date.now() },
        messages,
        turns,
        source: 'imported',
        sessionCount: 1,
        descendantCount: 0,
        analytics: {
          modifiedFiles: parsed.info?.modified_files || [],
          toolStats: {},
          subagentSummaries: []
        }
      }
    } catch (e) {
      throw new Error('Invalid JSON format: ' + e)
    }
  }

  // 3. Plain Markdown fallback
  const messages = [
    {
      id: 'msg_1',
      session_id: basename,
      role: 'user',
      created_at: Date.now(),
      text: '外部导入 Markdown 文档：' + basename,
      tools: []
    },
    {
      id: 'msg_2',
      session_id: basename,
      role: 'assistant',
      created_at: Date.now(),
      text: content,
      tools: []
    }
  ]
  const turns = groupMessagesIntoTurns(messages, basename)
  return {
    meta: { id: basename, title: basename, workspace: path.dirname(filePath), time_created: Date.now() },
    messages,
    turns,
    source: 'imported',
    sessionCount: 1,
    descendantCount: 0,
    analytics: { modifiedFiles: [], toolStats: {}, subagentSummaries: [] }
  }
}

