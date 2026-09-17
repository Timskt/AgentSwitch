import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { ExportMessage, SessionAnalytics } from './exporter'

export interface ZSession {
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

export interface DbStats {
  dbPath: string
  dbSize: string
  totalSessions: number
  rootSessionsCount: number
  childSessionsCount: number
  totalMessages: number
  workspaces: string[]
}

const getDbPath = () => {
  return process.env.ZCODE_DB || path.join(os.homedir(), '.zcode', 'cli', 'db', 'db.sqlite')
}

export const getHierarchicalSessions = () => {
  const currentDbPath = getDbPath()
  let dbSize = '0 MB'
  try {
    const st = fs.statSync(currentDbPath)
    dbSize = (st.size / (1024 * 1024)).toFixed(1) + ' MB'
  } catch (e) {}

  const db = new Database(currentDbPath, { readonly: true })
  
  const stmt = db.prepare(`
    SELECT id, parent_id, workspace_id as workspace, directory, title, task_type, time_created, time_updated 
    FROM session 
    ORDER BY time_updated DESC
  `)
  const allSessions = stmt.all() as ZSession[]

  const msgCounts = db.prepare(`SELECT session_id, count(*) as count FROM message GROUP BY session_id`).all() as { session_id: string, count: number }[]
  const countMap = new Map<string, number>()
  let totalMsgCount = 0
  for (const row of msgCounts) {
    countMap.set(row.session_id, row.count)
    totalMsgCount += row.count
  }

  const workspaceRows = db.prepare(`SELECT DISTINCT directory FROM session WHERE directory IS NOT NULL AND directory != ''`).all() as { directory: string }[]
  const workspaces = workspaceRows.map(r => r.directory)

  db.close()

  const sessionMap = new Map<string, ZSession>()
  for (const s of allSessions) {
    s.message_count = countMap.get(s.id) || 0
    s.children = []
    sessionMap.set(s.id, s)
  }

  const rootSessions: ZSession[] = []

  for (const s of allSessions) {
    if (s.parent_id && sessionMap.has(s.parent_id)) {
      const parent = sessionMap.get(s.parent_id)!
      parent.children = parent.children || []
      parent.children.push(s)
    } else {
      rootSessions.push(s)
    }
  }

  for (const root of rootSessions) {
    let total = root.message_count || 0
    const countChildren = (s: ZSession) => {
      let c = 0
      if (s.children) {
        for (const child of s.children) {
          total += child.message_count || 0
          c += 1 + countChildren(child)
        }
      }
      return c
    }
    root.child_count = countChildren(root)
    root.total_messages = total
  }

  const stats: DbStats = {
    dbPath: currentDbPath,
    dbSize,
    totalSessions: allSessions.length,
    rootSessionsCount: rootSessions.length,
    childSessionsCount: allSessions.length - rootSessions.length,
    totalMessages: totalMsgCount,
    workspaces
  }

  return { rootSessions, allSessions, stats }
}

function getAllDescendantIds(db: any, sid: string): string[] {
  const result: string[] = [sid]
  const queue: string[] = [sid]
  const seen = new Set<string>([sid])
  
  while (queue.length > 0) {
    const cur = queue.shift()!
    const children = db.prepare("SELECT id FROM session WHERE parent_id = ?").all(cur) as { id: string }[]
    for (const c of children) {
      if (!seen.has(c.id)) {
        seen.add(c.id)
        result.push(c.id)
        queue.push(c.id)
      }
    }
  }
  return result
}

export const getSessionTranscript = (sessionId: string, includeChildren: boolean = false) => {
  const db = new Database(getDbPath(), { readonly: true })

  const sessionMeta = db.prepare("SELECT * FROM session WHERE id = ?").get(sessionId) as any
  if (!sessionMeta) {
    db.close()
    throw new Error(`Session ${sessionId} not found`)
  }

  const sids = includeChildren ? getAllDescendantIds(db, sessionId) : [sessionId]
  const placeholders = sids.map(() => '?').join(',')

  const sessionInfoRows = db.prepare(`SELECT id, title, parent_id, task_type FROM session WHERE id IN (${placeholders})`).all(...sids) as any[]
  const sessionTitleMap = new Map<string, { title: string, is_subagent: boolean }>()
  for (const s of sessionInfoRows) {
    sessionTitleMap.set(s.id, {
      title: s.title || '',
      is_subagent: s.id !== sessionId
    })
  }

  const messagesRaw = db.prepare(`
    SELECT id, session_id, time_created, time_updated, data, sequence 
    FROM message 
    WHERE session_id IN (${placeholders}) 
    ORDER BY time_created ASC, COALESCE(sequence, 0) ASC, id ASC
  `).all(...sids) as any[]

  const partsRaw = db.prepare(`
    SELECT id, message_id, session_id, time_created, time_updated, data, sequence 
    FROM part 
    WHERE session_id IN (${placeholders}) 
    ORDER BY message_id, COALESCE(sequence, 0) ASC, time_created ASC, id ASC
  `).all(...sids) as any[]

  db.close()

  const modifiedFiles = new Set<string>()
  const readFiles = new Set<string>()
  const toolStats: Record<string, number> = {}

  const partsByMessage = new Map<string, any[]>()
  for (const p of partsRaw) {
    let pdata: any = {}
    try { pdata = JSON.parse(p.data) } catch (e) {}
    
    const tName = pdata.tool || pdata.name
    if (pdata.type === 'tool' || tName) {
      const toolKey = tName || 'tool'
      toolStats[toolKey] = (toolStats[toolKey] || 0) + 1
      
      const inp = pdata.state?.input || pdata.args || {}
      const fPath = inp.file_path || inp.filePath || inp.path || inp.file || inp.TargetFile
      if (fPath && typeof fPath === 'string') {
        if (toolKey === 'Edit' || toolKey === 'Write' || toolKey === 'write_to_file' || toolKey === 'replace_file_content') {
          modifiedFiles.add(fPath)
        } else if (toolKey === 'Read' || toolKey === 'view_file') {
          readFiles.add(fPath)
        }
      }
    }

    const partObj = {
      id: p.id,
      message_id: p.message_id,
      session_id: p.session_id,
      sequence: p.sequence,
      time_created: p.time_created,
      type: pdata.type,
      text: pdata.text,
      tool: pdata.tool,
      state: pdata.state,
      callID: pdata.callID,
      tool_name: pdata.tool || pdata.name,
      tool_args_json: pdata.args ? JSON.stringify(pdata.args) : (pdata.state?.input ? JSON.stringify(pdata.state.input) : undefined),
      tool_output_json: pdata.state?.output ? (typeof pdata.state.output === 'string' ? pdata.state.output : JSON.stringify(pdata.state.output, null, 2)) : undefined,
      ...pdata
    }
    const list = partsByMessage.get(p.message_id) || []
    list.push(partObj)
    partsByMessage.set(p.message_id, list)
  }

  const messages: ExportMessage[] = messagesRaw.map(m => {
    let mdata: any = {}
    try { mdata = JSON.parse(m.data) } catch (e) {}
    
    const parts = partsByMessage.get(m.id) || []
    const sInfo = sessionTitleMap.get(m.session_id)

    const textParts = parts.filter(p => p.type === 'text' && p.text).map(p => p.text)
    let content = textParts.join('\n\n')
    if (!content) {
      if (typeof mdata.content === 'string') content = mdata.content
      else if (typeof mdata.semantics?.text === 'string') content = mdata.semantics.text
    }

    const thoughtParts = parts.filter(p => p.type === 'reasoning' && p.text).map(p => p.text)
    let thought = thoughtParts.join('\n\n')
    if (!thought && typeof mdata.thought === 'string') {
      thought = mdata.thought
    }

    return {
      id: m.id,
      session_id: m.session_id,
      sequence: m.sequence,
      time_created: m.time_created,
      role: mdata.role || mdata.source || 'assistant',
      content,
      thought,
      is_subagent: sInfo?.is_subagent || false,
      subagent_title: sInfo?.title,
      parts,
      raw: mdata
    }
  })

  const analytics: SessionAnalytics = {
    modifiedFiles: Array.from(modifiedFiles),
    readFiles: Array.from(readFiles),
    toolStats,
    subagentCount: sids.length - 1
  }

  return {
    meta: sessionMeta,
    messages,
    parts: partsRaw,
    sessionCount: sids.length,
    descendantCount: sids.length - 1,
    analytics
  }
}
