import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTrip } from '../api/tripApi'
import type { Trip } from '../../shared/types/trip'

/**
 * レシート一覧ページコンポーネント
 * 要件: 3.1
 * 
 * 機能:
 * - レシート一覧表示
 * - 編集リンク
 */
function ReceiptListPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 旅行データ取得
  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) {
        setError('旅行IDが指定されていません')
        setIsLoading(false)
        return
      }

      try {
        const data = await getTrip(tripId)
        setTrip(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '旅行データの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrip()
  }, [tripId])

  // メンバー名を取得
  const getMemberName = (memberId: string): string => {
    if (!trip) return '不明'
    const member = trip.members.find(m => m.id === memberId)
    return member ? member.name : '不明'
  }

  // レシート編集ページへ
  const handleEdit = (receiptId: string) => {
    navigate(`/trip/${tripId}/receipt/${receiptId}/edit`)
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!trip) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <p style={{ color: '#c00' }}>旅行が見つかりません</p>
        <button
          onClick={() => navigate('/admin')}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          管理ページへ
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>レシート一覧</h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        旅行: {trip.tripName}
      </p>

      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {/* レシート一覧 */}
      {trip.receipts.length === 0 ? (
        <div style={{
          padding: '30px',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            レシートがまだ登録されていません
          </p>
          <button
            onClick={() => navigate(`/trip/${tripId}/receipt/new`)}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            レシートを追加
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
          {trip.receipts.map((receipt) => (
            <div
              key={receipt.id}
              style={{
                padding: '15px',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
              onClick={() => handleEdit(receipt.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '10px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>
                    {receipt.title || '（用途なし）'}
                  </h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                    支払い者: {getMemberName(receipt.payerId)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    margin: '0',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#2196F3'
                  }}>
                    ¥{receipt.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                fontSize: '12px',
                color: '#999'
              }}>
                <span>
                  {receipt.targetMode === 'all' ? '全員割' : `選択割 (${receipt.selectedMemberIds.length}人)`}
                </span>
                <span>•</span>
                <span>
                  {receipt.splitMode === 'equal' ? '一律割' :
                   receipt.splitMode === 'ratio' ? '比率配分' : '金額指定'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ボタン */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => navigate(`/trip/${tripId}`)}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#9E9E9E',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          戻る
        </button>
        {trip.receipts.length > 0 && (
          <button
            onClick={() => navigate(`/trip/${tripId}/receipt/new`)}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            新規追加
          </button>
        )}
      </div>
    </div>
  )
}

export default ReceiptListPage
