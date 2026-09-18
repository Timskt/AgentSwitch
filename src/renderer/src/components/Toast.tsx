import React, { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, X, Copy, Check } from 'lucide-react'
import clsx from 'clsx'

export interface ToastMessage {
  id: string
  type?: 'info' | 'warning' | 'success' | 'error'
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  duration?: number
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col space-y-2.5 max-w-md pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage, onDismiss: () => void }) {
  const { type = 'info', title, description, actionLabel, onAction, duration = 3500 } = toast
  const [copied, setCopied] = React.useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [duration, onDismiss])

  const handleAction = () => {
    if (onAction) {
      onAction()
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const icons = {
    info: <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />,
  }

  const borders = {
    info: 'border-sky-500/30 bg-[#0f172a]/95 text-sky-100',
    warning: 'border-amber-500/40 bg-[#1c1917]/95 text-amber-100',
    success: 'border-emerald-500/30 bg-[#064e3b]/95 text-emerald-100',
    error: 'border-rose-500/40 bg-[#1f1216]/95 text-rose-100',
  }

  return (
    <div className={clsx(
      "pointer-events-auto p-3.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-start space-x-3 text-xs animate-in slide-in-from-bottom-3 duration-200",
      borders[type]
    )}>
      {icons[type]}
      <div className="flex-1 min-w-0 pr-2">
        <div className="font-semibold text-[12px] leading-tight text-white mb-0.5">{title}</div>
        {description && (
          <div className="text-[11px] opacity-80 break-all leading-relaxed font-mono mt-1 select-all">
            {description}
          </div>
        )}
        {actionLabel && (
          <div className="mt-2">
            <button
              onClick={handleAction}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] border border-white/20 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? '已复制' : actionLabel}</span>
            </button>
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
