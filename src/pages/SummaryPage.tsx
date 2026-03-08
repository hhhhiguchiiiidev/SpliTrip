import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trip } from '@shared/types/trip'
import { Settlement } from '@shared/types/settlement'
import { getTrip } from '../api/tripApi'
import { calculateSettlements, validateSettlements } from '@shared/utils/settlementCalculator'
import SettlementSummary from '../components/SettlementSummary'

/**
 * 精算ページコンポーネント
 * メンバー別精算サマリー表示
 * 要件: 4.1, 4.2, 4.3, 4.4, 4.5
 */
function SummaryPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tripId) {
      setError('旅行IDが指定されていません')
      setLoading(false)
      return
    }

    loadTripAndCalculateSettlements()
  }, [tripId])

  const loadTripAndCalculateSettlements = async () => {
    try {
      setLoading(true)
      setError(null)

      const tripData = await getTrip(tripId!)
      setTrip(tripData)

      // 精算計算
      const calculatedSettlements = calculateSettlements(tripData)
      
      // 精算検証（差額合計がゼロであることを確認）
      const isValid = validateSettlements(calculatedSettlements)
      if (!isValid) {
        console.warn('精算の差額合計がゼロではありません')
      }

      setSettlements(calculatedSettlements)
    } catch (err) {
      console.error('精算計算エラー:', err)
      setError('精算データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(`/trip/${tripId}`)
  }

  if (loading) {
    return (
      <div className="summary-page">
        <div className="loading">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="summary-page">
        <div className="error">{error}</div>
        <button onClick={handleBack} className="back-button">
          旅行ページに戻る
        </button>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="summary-page">
        <div className="error">旅行が見つかりません</div>
        <button onClick={handleBack} className="back-button">
          旅行ページに戻る
        </button>
      </div>
    )
  }

  return (
    <div className="summary-page">
      <div className="header">
        <button onClick={handleBack} className="back-button">
          ← 戻る
        </button>
        <h1>{trip.tripName} - 精算</h1>
      </div>

      {trip.receipts.length === 0 ? (
        <div className="no-receipts">
          <p>レシートがまだ登録されていません</p>
          <button
            onClick={() => navigate(`/trip/${tripId}/receipt/new`)}
            className="add-receipt-button"
          >
            レシートを追加
          </button>
        </div>
      ) : (
        <SettlementSummary settlements={settlements} tripId={tripId!} />
      )}

      <style>{`
        .summary-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          margin-bottom: 24px;
        }

        .header h1 {
          margin: 16px 0 0 0;
          font-size: 28px;
          color: #333;
        }

        .back-button {
          padding: 8px 16px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .back-button:hover {
          background-color: #5a6268;
        }

        .loading,
        .error {
          text-align: center;
          padding: 40px 20px;
          font-size: 16px;
          color: #666;
        }

        .error {
          color: #dc3545;
        }

        .no-receipts {
          text-align: center;
          padding: 60px 20px;
        }

        .no-receipts p {
          font-size: 16px;
          color: #666;
          margin-bottom: 20px;
        }

        .add-receipt-button {
          padding: 12px 24px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .add-receipt-button:hover {
          background-color: #0056b3;
        }

        @media (max-width: 768px) {
          .summary-page {
            padding: 16px;
          }

          .header h1 {
            font-size: 22px;
          }

          .back-button {
            font-size: 13px;
            padding: 6px 12px;
          }

          .no-receipts {
            padding: 40px 16px;
          }

          .no-receipts p {
            font-size: 14px;
          }

          .add-receipt-button {
            font-size: 14px;
            padding: 10px 20px;
          }
        }
      `}</style>
    </div>
  )
}

export default SummaryPage
