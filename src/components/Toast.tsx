import { useEffect } from 'react'

/**
 * トースト通知コンポーネント
 * 要件: 10.5
 * 
 * Props:
 * - message: 表示するメッセージ
 * - type: トーストのタイプ（error, success, info, warning）
 * - onClose: 閉じる時のコールバック
 * - duration: 自動で閉じるまでの時間（ミリ秒、デフォルト: 3000）
 */
interface ToastProps {
  message: string
  type?: 'error' | 'success' | 'info' | 'warning'
  onClose: () => void
  duration?: number
}

function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return '#f44336'
      case 'success':
        return '#4caf50'
      case 'warning':
        return '#ff9800'
      case 'info':
      default:
        return '#2196F3'
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: getBackgroundColor(),
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        maxWidth: '90%',
        minWidth: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <span style={{ flex: 1, fontSize: '16px' }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '0',
          minWidth: '24px',
          minHeight: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="閉じる"
      >
        ×
      </button>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default Toast
