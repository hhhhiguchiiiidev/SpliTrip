import { useState, useCallback } from 'react'

/**
 * トースト通知の状態管理フック
 * 要件: 10.5
 */
export interface ToastState {
  message: string
  type: 'error' | 'success' | 'info' | 'warning'
  id: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { message, type, id }])
  }, [])

  const showError = useCallback((message: string) => {
    showToast(message, 'error')
  }, [showToast])

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success')
  }, [showToast])

  const showInfo = useCallback((message: string) => {
    showToast(message, 'info')
  }, [showToast])

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning')
  }, [showToast])

  const hideToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return {
    toasts,
    showToast,
    showError,
    showSuccess,
    showInfo,
    showWarning,
    hideToast
  }
}
