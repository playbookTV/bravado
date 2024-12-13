import { useState, useCallback } from 'react'
import { ToastType } from '../components/Toast'

interface Toast {
  id: string
  message: string
  type: ToastType
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback((message: string) => {
    addToast(message, 'success')
  }, [addToast])

  const error = useCallback((message: string) => {
    addToast(message, 'error')
  }, [addToast])

  const info = useCallback((message: string) => {
    addToast(message, 'info')
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
  }
} 