import React, { useState } from 'react'
import { X, Copy, Check, Download, Search } from 'lucide-react'

interface FullScreenCodeModalProps {
  open: boolean
  onClose: () => void
  code: string
  title?: string
  lang?: string
}

export function FullScreenCodeModal({ open, onClose, code, title = '大文本检视器', lang = 'text' }: FullScreenCodeModalProps) {
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')

  if (!open) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = code.split('\n')
  const filteredLines = search.trim() 
    ? lines.map((l, i) => ({ text: l, num: i + 1 })).filter(item => item.text.toLowerCase().includes(search.toLowerCase()))
    : lines.map((l, i) => ({ text: l, num: i + 1 }))

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-[#18181b]">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              {lang}
            </span>
            <span className="text-xs text-zinc-500 font-mono">• {lines.length} 行代码</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="在当前代码中搜索..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 border border-zinc-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制全文'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code with Line Numbers */}
        <div className="flex-1 overflow-auto bg-[#09090b] font-mono text-xs text-zinc-300 custom-scrollbar select-text flex">
          <div className="py-4 select-none bg-zinc-950 border-r border-zinc-800/80 text-zinc-600 text-right px-3 min-w-[50px]">
            {filteredLines.map(l => (
              <div key={l.num} className="leading-relaxed">{l.num}</div>
            ))}
          </div>
          <div className="py-4 px-4 flex-1 whitespace-pre leading-relaxed overflow-x-auto">
            {filteredLines.map((l, idx) => (
              <div key={idx}>{l.text || ' '}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
