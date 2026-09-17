export interface ExportMessage {
  id: string
  session_id: string
  sequence: number
  time_created: number
  role: string
  content?: string
  thought?: string
  tool_calls?: any[]
  is_subagent?: boolean
  subagent_title?: string
  parts?: any[]
  raw?: any
}

export interface SessionAnalytics {
  modifiedFiles: string[]
  readFiles: string[]
  toolStats: Record<string, number>
  totalTokens?: number
  subagentCount: number
}

function rand(n: number): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let res = ''
  for (let i = 0; i < n; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return res
}

function ocId(prefix: string, tsMs: number): string {
  const hex = (BigInt(tsMs) * 1000n & 0xFFFFFFFFFFFFn).toString(16).padStart(12, '0')
  return `${prefix}_${hex}${rand(14)}`
}

function slugify(title: string): string {
  const s = (title || 'zcode-export').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()
  return (s.slice(0, 48) || 'zcode-export').replace(/-+$/, '')
}

// 1. OpenCode Official Native Format (.opencode.json)
export function formatToOpenCode(sessionMeta: any, messages: ExportMessage[]): string {
  const newSid = ocId('ses', sessionMeta.time_created || Date.now())
  const idMap: Record<string, string> = {}
  for (const m of messages) {
    idMap[m.id] = ocId('msg', m.time_created || Date.now())
  }

  const doc = {
    info: {
      id: newSid,
      slug: slugify(sessionMeta.title || 'zcode-export'),
      title: sessionMeta.title || 'ZCode Export',
      version: '2',
      cost: 0,
      tokens: {
        input: 0,
        output: 0,
        reasoning: 0,
        cache: { read: 0, write: 0 }
      },
      time: {
        created: sessionMeta.time_created || Date.now(),
        updated: Math.max(sessionMeta.time_updated || 0, sessionMeta.time_created || 0)
      }
    },
    messages: messages.map(m => {
      const mid = idMap[m.id] || m.id
      const info = {
        id: mid,
        sessionID: newSid,
        role: m.role === 'user' || m.role === 'USER' ? 'user' : 'assistant',
        time: {
          created: m.time_created,
          completed: m.time_created + 1000
        },
        source: m.is_subagent ? 'subagent' : 'main',
        ...m.raw
      }
      delete info.error

      const parts = (m.parts || []).map((p: any) => ({
        id: ocId('prt', m.time_created || Date.now()),
        sessionID: newSid,
        messageID: mid,
        ...p
      }))

      return { info, parts }
    })
  }

  return JSON.stringify(doc, null, 2)
}

// 2. OpenAI Codex / Copilot CLI Format (.codex.json)
export function formatToCodex(sessionMeta: any, messages: ExportMessage[], analytics?: SessionAnalytics): string {
  const doc = {
    metadata: {
      id: sessionMeta.id,
      title: sessionMeta.title,
      workspace: sessionMeta.directory || sessionMeta.workspace,
      targetEnvironment: 'Codex / Copilot CLI',
      exportedAt: new Date().toISOString(),
      modifiedFiles: analytics?.modifiedFiles || [],
      toolCallsSummary: analytics?.toolStats || {}
    },
    conversation: messages.map(m => ({
      role: m.role === 'user' || m.role === 'USER' ? 'user' : 'assistant',
      timestamp: m.time_created,
      author: m.is_subagent ? `subagent:${m.subagent_title || 'child'}` : 'main',
      content: m.content || '',
      reasoning: m.thought || undefined,
      tools: m.parts?.filter(p => p.type === 'tool' || p.tool_name).map(p => ({
        name: p.tool_name || p.tool || p.name,
        input: p.tool_args_json ? JSON.parse(p.tool_args_json) : (p.state?.input || p.args || {}),
        output: p.tool_output_json || p.state?.output || undefined,
        status: p.state?.status || 'completed'
      }))
    }))
  }

  return JSON.stringify(doc, null, 2)
}

// 3. Inflection Pi (Pi.ai) Format (.pi.json)
export function formatToPi(sessionMeta: any, messages: ExportMessage[]): string {
  const turns = messages.filter(m => m.content && m.content.trim()).map(m => ({
    role: m.role === 'user' || m.role === 'USER' ? 'user' : 'assistant',
    message: m.content,
    timestamp: new Date(m.time_created).toISOString(),
    ...(m.thought ? { internal_thought: m.thought } : {}),
    ...(m.is_subagent ? { subagent: m.subagent_title } : {})
  }))

  const doc = {
    schema: 'https://pi.ai/schema/conversation-v1.json',
    source: 'ZCode Migrator Export for Pi.ai',
    sessionId: sessionMeta.id,
    title: sessionMeta.title,
    workspace: sessionMeta.directory || sessionMeta.workspace,
    exportedAt: new Date().toISOString(),
    dialogue: {
      totalTurns: turns.length,
      turns
    }
  }

  return JSON.stringify(doc, null, 2)
}

// 4. Claude Code Project Format (.claude.json)
export function formatToClaudeCode(sessionMeta: any, messages: ExportMessage[], analytics?: SessionAnalytics): string {
  const claudeDoc = {
    sessionId: sessionMeta.id,
    title: sessionMeta.title,
    workspace: sessionMeta.directory || sessionMeta.workspace,
    createdAt: new Date(sessionMeta.time_created).toISOString(),
    updatedAt: new Date(sessionMeta.time_updated).toISOString(),
    context: {
      subagentsCount: analytics?.subagentCount || 0,
      modifiedFiles: analytics?.modifiedFiles || [],
      toolStats: analytics?.toolStats || {}
    },
    messages: messages.map(m => ({
      id: m.id,
      role: m.role === 'user' || m.role === 'USER' ? 'user' : 'assistant',
      timestamp: new Date(m.time_created).toISOString(),
      content: m.content || '',
      thought: m.thought || undefined,
      isSubagent: m.is_subagent,
      subagentTitle: m.subagent_title,
      tools: m.parts?.filter(p => p.type === 'tool' || p.tool_name).map(p => ({
        tool: p.tool_name || p.tool || p.name,
        input: p.tool_args_json ? JSON.parse(p.tool_args_json) : (p.state?.input || p.args || {}),
        output: p.tool_output_json || p.state?.output || undefined
      }))
    }))
  }
  return JSON.stringify(claudeDoc, null, 2)
}

// 5. Antigravity Native transcript.jsonl
export function formatToAntigravity(_sessionMeta: any, messages: ExportMessage[]): string {
  const lines: string[] = []
  let stepIndex = 0

  for (const m of messages) {
    const isUser = m.role === 'user' || m.role === 'USER'
    const record = {
      step_index: stepIndex++,
      source: isUser ? 'USER_EXPLICIT' : (m.is_subagent ? 'SUBAGENT' : 'MODEL'),
      type: isUser ? 'USER_INPUT' : 'PLANNER_RESPONSE',
      status: 'DONE',
      created_at: new Date(m.time_created).toISOString(),
      content: m.content || '',
      ...(m.thought ? { thinking: m.thought } : {}),
      ...(m.parts && m.parts.some(p => p.type === 'tool' || p.tool_name) ? {
        tool_calls: m.parts.filter(p => p.type === 'tool' || p.tool_name).map(p => ({
          tool_name: p.tool_name || p.tool || p.name,
          arguments: p.tool_args_json ? JSON.parse(p.tool_args_json) : (p.args || {}),
          status: p.state?.status || 'completed'
        }))
      } : {})
    }
    lines.push(JSON.stringify(record))
  }

  return lines.join('\n')
}

// 6. Human-Readable Markdown
export function formatToMarkdown(sessionMeta: any, messages: ExportMessage[], includeChildren: boolean, analytics?: SessionAnalytics): string {
  const lines: string[] = [
    `# ${sessionMeta.title || 'ZCode Session Export'}`,
    '',
    `- **Session ID**: \`${sessionMeta.id}\``,
    `- **Workspace**: \`${sessionMeta.directory || sessionMeta.workspace || 'N/A'}\``,
    `- **Created At**: ${new Date(sessionMeta.time_created).toLocaleString()}`,
    `- **Updated At**: ${new Date(sessionMeta.time_updated).toLocaleString()}`,
    `- **Total Messages**: ${messages.length}`,
    `- **Include Subagents**: ${includeChildren ? 'Yes (Merged)' : 'No'}`,
    ''
  ]

  if (analytics && analytics.modifiedFiles.length > 0) {
    lines.push(`### 📁 Modified Files (${analytics.modifiedFiles.length})`)
    for (const f of analytics.modifiedFiles) {
      lines.push(`- \`${f}\``)
    }
    lines.push('')
  }

  lines.push('---', '')

  for (const m of messages) {
    const role = (m.role || 'unknown').toUpperCase()
    const time = new Date(m.time_created).toLocaleTimeString()
    const subagentBadge = m.is_subagent ? ` [Subagent: ${m.subagent_title || 'Child Agent'}]` : ''
    
    lines.push(`## ${role}${subagentBadge} (${time})`)
    lines.push('')

    if (m.thought) {
      lines.push('> [!NOTE]')
      lines.push('> **Thinking Process**:')
      lines.push(m.thought.split('\n').map(l => `> ${l}`).join('\n'))
      lines.push('')
    }

    if (m.content) {
      lines.push(m.content)
      lines.push('')
    }

    if (m.parts && m.parts.length > 0) {
      for (const p of m.parts) {
        if (p.type === 'tool' || p.tool_name || p.tool) {
          const tName = p.tool_name || p.tool || p.name || 'tool'
          const state = p.state || {}
          const status = state.status || 'completed'
          const inputStr = p.tool_args_json || JSON.stringify(state.input || p.args || {}, null, 2)
          lines.push('```bash')
          lines.push(`# Tool Call: ${tName} [Status: ${status}]`)
          lines.push(inputStr)
          lines.push('```')
          if (state.output || p.tool_output_json) {
            lines.push('<details><summary>Tool Output</summary>')
            lines.push('')
            lines.push('```')
            lines.push(typeof state.output === 'string' ? state.output : JSON.stringify(state.output || p.tool_output_json, null, 2))
            lines.push('```')
            lines.push('</details>')
            lines.push('')
          }
        }
      }
    }

    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

// 7. High-Density AI Model Continuation & Handoff Prompt (零丢失记忆接力文档)
export function formatToHandoffPrompt(sessionMeta: any, messages: ExportMessage[], analytics: SessionAnalytics): string {
  const ws = sessionMeta.directory || sessionMeta.workspace || 'Current Directory'
  const userPrompts = messages.filter(m => m.role === 'user' || m.role === 'USER').map(m => m.content).filter(Boolean)
  const lastUserPrompt = userPrompts[userPrompts.length - 1] || '继续执行当前工程任务'

  const lines: string[] = [
    `# 🚀 AI Agent 任务接力与全量记忆上下文 (Task Continuity Context)`,
    ``,
    `> 本文档由 ZCode Migrator 自动提取自前置 AI Agent 的执行现场。请完整阅读以下背景、已修改文件与历史会话，直接在本项目中无缝接续工作，无需重复已验证步骤。`,
    ``,
    `## 1. 工程基本信息`,
    `- **工作区路径**: \`${ws}\``,
    `- **前置任务主题**: ${sessionMeta.title}`,
    `- **合并子任务数量**: ${analytics.subagentCount} 个 Subagent`,
    `- **对话与执行记录**: ${messages.length} 轮消息`,
    `- **用户最新诉求**:`,
    `> "${lastUserPrompt}"`,
    ``,
    `## 2. 累计修改与产出的核心文件 (${analytics.modifiedFiles.length} 个)`,
    `前置 Agent 已在当前项目中修改或创建了以下关键代码/文档，请基于这些最新文件继续推进，切勿回滚：`,
  ]

  for (const f of analytics.modifiedFiles) {
    const relPath = f.startsWith(ws) ? f.slice(ws.length).replace(/^\/+/, '') : f
    lines.push(`- \`${relPath}\``)
  }

  lines.push(``, `## 3. 工具执行与验证画像`)
  for (const [tool, count] of Object.entries(analytics.toolStats)) {
    lines.push(`- **${tool}**: 执行 ${count} 次`)
  }

  lines.push(``, `## 4. 关键历史对话与执行轨迹摘要`, ``)
  
  const recentMsgs = messages.slice(-25)
  for (const m of recentMsgs) {
    const role = (m.role || 'unknown').toUpperCase()
    const author = m.is_subagent ? `[子任务: ${m.subagent_title || 'Agent'}]` : ''
    lines.push(`### ${role} ${author}`)
    if (m.content) {
      lines.push(m.content.slice(0, 1500) + (m.content.length > 1500 ? '\n...(略)' : ''))
    }
    if (m.parts) {
      const tools = m.parts.filter(p => p.type === 'tool' || p.tool_name)
      if (tools.length > 0) {
        lines.push(`*执行工具: ${tools.map(t => t.tool_name || t.tool).join(', ')}*`)
      }
    }
    lines.push(``)
  }

  lines.push(`---`, `## 5. 接续指令`, `请确认已掌握上述工作区文件状态与历史结论，并在当前工作区 \`${ws}\` 中直接继续响应用户的需求。`)

  return lines.join('\n')
}
