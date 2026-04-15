import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export function PwaUpdatePrompt() {
  const [dismissed, setDismissed] = useState(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 minutes
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000)
      }
    },
  })

  if (!needRefresh || dismissed) return null

  return (
    <div
      role="alertdialog"
      aria-label="App update available"
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl bg-[#1E3A5F] px-4 py-3 text-white shadow-2xl sm:left-auto sm:right-4 sm:w-80"
    >
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <p className="text-sm font-semibold">Update available</p>
          <p className="text-xs text-slate-300">Reload to get the latest version</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-[#0F2040] transition hover:bg-amber-300 active:scale-95"
        >
          Reload
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded-full p-1 text-slate-400 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
