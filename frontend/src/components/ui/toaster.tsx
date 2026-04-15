import { useState, useEffect } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

let toasts: Toast[] = []
let listeners: Array<() => void> = []

const createToast = (message: string, type: Toast['type'] = 'info') => {
  const id = Math.random().toString(36).substr(2, 9)
  toasts = [...toasts, { id, message, type }]
  listeners.forEach((listener) => listener())
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    listeners.forEach((listener) => listener())
  }, 3000)
}

export const toast = {
  success: (message: string) => createToast(message, 'success'),
  error: (message: string) => createToast(message, 'error'),
  info: (message: string) => createToast(message, 'info'),
  warning: (message: string) => createToast(message, 'warning'),
}

export function Toaster() {
  const [toastList, setToastList] = useState<Toast[]>([])

  useEffect(() => {
    const update = () => setToastList([...toasts])
    listeners.push(update)
    return () => {
      listeners = listeners.filter((l) => l !== update)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toastList.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md
            ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : toast.type === 'warning'
                ? 'bg-yellow-500 text-white'
                : 'bg-blue-500 text-white'
            }
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}




