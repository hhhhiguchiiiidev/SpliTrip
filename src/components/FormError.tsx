/**
 * フォームエラー表示コンポーネント
 * 要件: 10.5
 * 
 * Props:
 * - message: エラーメッセージ
 */
interface FormErrorProps {
  message?: string
}

function FormError({ message }: FormErrorProps) {
  if (!message) {
    return null
  }

  return (
    <div
      style={{
        color: '#f44336',
        fontSize: '14px',
        marginTop: '4px',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
      role="alert"
    >
      <span style={{ fontSize: '16px' }}>⚠</span>
      <span>{message}</span>
    </div>
  )
}

export default FormError
