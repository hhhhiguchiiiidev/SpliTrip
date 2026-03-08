import type { Receipt } from '../../shared/types/receipt'

/**
 * レシート表示カードコンポーネント
 * 要件: 3.1
 * 
 * Props:
 * - receipt: レシートデータ
 * - payerName: 支払い者名
 * - onClick: クリック時のハンドラー
 */
interface ReceiptCardProps {
  receipt: Receipt
  payerName: string
  onClick?: () => void
}

function ReceiptCard({ receipt, payerName, onClick }: ReceiptCardProps) {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.1s',
        minHeight: '44px', // タッチフレンドリーな最小高さ（要件: 10.2, 10.3）
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
        }
      }}
      onTouchStart={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(0.98)'
        }
      }}
      onTouchEnd={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', lineHeight: '1.4' }}>
            {receipt.title || '（用途なし）'}
          </h3>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
            支払い者: {payerName}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            margin: '0',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2196F3',
            whiteSpace: 'nowrap'
          }}>
            ¥{receipt.amount.toLocaleString()}
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        fontSize: '13px',
        color: '#999',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <span>
          {receipt.targetMode === 'all' ? '全員割' : `選択割 (${receipt.selectedMemberIds.length}人)`}
        </span>
        <span>•</span>
        <span>
          {receipt.splitMode === 'equal' ? '一律割' :
           receipt.splitMode === 'ratio' ? '比率配分' : '金額指定'}
        </span>
        {receipt.createdAt && (
          <>
            <span>•</span>
            <span>
              {new Date(receipt.createdAt).toLocaleDateString('ja-JP')}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default ReceiptCard
