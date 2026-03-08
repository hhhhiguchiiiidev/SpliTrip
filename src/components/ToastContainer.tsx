import Toast from './Toast'
import type { ToastState } from '../hooks/useToast'

/**
 * トーストコンテナコンポーネント
 * 複数のトースト通知を管理
 * 要件: 10.5
 */
interface ToastContainerProps {
  toasts: ToastState[]
  onClose: (id: number) => void
}

function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '500px',
        padding: '0 10px'
      }}
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  )
}

export default ToastContainer
