import { TripListItem } from '../../shared/types/tripListItem'

/**
 * TripListComponentのProps
 */
export type TripListComponentProps = {
  trips: TripListItem[]
  onDelete: (tripId: string) => Promise<void>
}

/**
 * 旅行一覧表示コンポーネント
 * 要件: 1.2, 1.3, 1.4, 2.1
 * 
 * 機能:
 * - 旅行リストを作成日時降順で表示
 * - 各旅行に旅行名、作成日時、メンバー数を表示（要件: 1.2）
 * - 各旅行に旅行ページへのリンクを表示（要件: 1.3）
 * - 各旅行に削除ボタンを表示（要件: 2.1）
 * - 空リスト時のメッセージ表示（要件: 1.4）
 */
function TripListComponent({ trips, onDelete }: TripListComponentProps) {
  // 削除確認ダイアログを表示して削除を実行
  const handleDelete = async (tripId: string, tripName: string) => {
    // 削除確認ダイアログ（要件: 2.2）
    if (window.confirm(`「${tripName}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
      await onDelete(tripId)
    }
  }

  // 日時をフォーマット
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 空リスト時のメッセージ表示（要件: 1.4）
  if (trips.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        color: '#666'
      }}>
        <p style={{ fontSize: '16px', margin: 0 }}>
          まだ旅行が作成されていません
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2>作成済みの旅行 ({trips.length}件)</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {trips.map((trip) => (
          <li
            key={trip.tripId}
            style={{
              padding: '16px',
              marginBottom: '12px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {/* 旅行情報（要件: 1.2） */}
              <div style={{ flex: '1 1 200px' }}>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  {trip.tripName}
                </h3>
                <p style={{
                  margin: '4px 0',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  作成日時: {formatDate(trip.createdAt)}
                </p>
                <p style={{
                  margin: '4px 0',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  メンバー数: {trip.memberCount}人
                </p>
              </div>

              {/* アクションボタン */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {/* 旅行ページへのリンク（要件: 1.3） */}
                <a
                  href={`/trip/${trip.tripId}`}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
                >
                  開く
                </a>

                {/* 削除ボタン（要件: 2.1） */}
                <button
                  onClick={() => handleDelete(trip.tripId, trip.tripName)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    minHeight: '40px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
                >
                  削除
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TripListComponent
