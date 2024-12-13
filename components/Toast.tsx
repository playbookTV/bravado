import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

const toastConfig = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-100 dark:bg-green-800',
    textColor: 'text-green-800 dark:text-green-100',
    borderColor: 'border-green-400 dark:border-green-700',
  },
  error: {
    icon: ExclamationCircleIcon,
    bgColor: 'bg-red-100 dark:bg-red-800',
    textColor: 'text-red-800 dark:text-red-100',
    borderColor: 'border-red-400 dark:border-red-700',
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-100 dark:bg-blue-800',
    textColor: 'text-blue-800 dark:text-blue-100',
    borderColor: 'border-blue-400 dark:border-blue-700',
  },
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const config = toastConfig[type]
  const Icon = config.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
        role="alert"
      >
        <Icon className={`w-5 h-5 ${config.textColor}`} />
        <p className={`ml-3 mr-8 font-medium ${config.textColor}`}>{message}</p>
        <button
          onClick={onClose}
          className={`absolute right-2 top-2 ${config.textColor} hover:opacity-80`}
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

// Toast Container Component for managing multiple toasts
interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContainerProps {
  toasts: Toast[]
  removeToast: (id: string) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
} 