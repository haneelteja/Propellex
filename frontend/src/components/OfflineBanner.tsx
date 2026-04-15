import { WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export function OfflineBanner() {
  const isOnline = useNetworkStatus()

  if (isOnline) return null

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You're offline — showing cached data</span>
    </div>
  )
}
