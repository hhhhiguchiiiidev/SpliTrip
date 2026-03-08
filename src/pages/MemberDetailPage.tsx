import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trip } from '@shared/types/trip'
import { getTrip } from '../api/tripApi'

/**
 * メンバー精算詳細ページコンポーネント
 * 特定メンバーの立替一覧と負担一覧を表示
 * 要件: 5.1, 5.2, 5.3, 5.4, 5.5
 */

interface PaymentDetail {
  receiptId: string
  title: string
  amount: number
}

interface OwedDetail {
  receiptId: string
  title: string
  amount: number
}

function MemberDetailPage() {
  const { tripId, memberId } = useParams<{ tripId: string; memberId: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [memberName, setMemberName] = useState<string>('')
  const [payments, setPayments] = useState<PaymentDetail[]>([])
  const [owedItems, setOwedItems] = useState<OwedDetail[]>([])
  const [paidTotal, setPaidTotal] = useState<number>(0)
  const [owedTotal, setOwedTotal] = useState<number>(0)
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tripId || !memberId) {
      setError('旅行IDまたはメンバーIDが指定されていません')
      setLoading(false)
      return
    }

    loadMemberDetails()
  }, [tripId, memberId])

  const loadMemberDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const tripData = await getTrip(tripId!)
      setTrip(tripData)

      // メンバーを検索
      const member = tripData.members.find(m => m.id === memberId)
      if (!member) {
        setError('メンバーが見つかりません')
        setLoading(false)
        return
      }
      setMemberName(member.name)

      // 立替一覧を計算（このメンバーが支払ったレシート）
      const paymentList: PaymentDetail[] = tripData.receipts
        .filter(r => r.payerId === memberId)
        .map(r => ({
          receiptId: r.id,
          title: r.title || '（用途なし）',
          amount: r.amount
        }))
      setPayments(paymentList)

      // 負担一覧を計算（このメンバーが負担する分割）
      const owedList: OwedDetail[] = []
      for (const receipt of tripData.receipts) {
        const split = receipt.splits.find(s => s.memberId === memberId)
        if (split) {
          owedList.push({
            receiptId: receipt.id,
            title: receipt.title || '（用途なし）',
            amount: split.amount
          })
        }
      }
      setOwedItems(owedList)

      // 合計を計算
      const totalPaid = paymentList.reduce((sum, p) => sum + p.amount, 0)
      const totalOwed = owedList.reduce((sum, o) => sum + o.amount, 0)
      const calculatedBalance = totalPaid - totalOwed

      setPaidTotal(totalPaid)
      setOwedTotal(totalOwed)
      setBalance(calculatedBalance)
    } catch (err) {
      console.error('メンバー詳細の読み込みエラー:', err)
      setError('メンバー詳細の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(`/trip/${tripId}/summary`)
  }

  if (loading) {
    return (
      <div className="member-detail-page">
        <div className="loading">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="member-detail-page">
        <div className="error">{error}</div>
        <button onClick={handleBack} className="back-button">
          精算ページに戻る
        </button>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="member-detail-page">
        <div className="error">旅行が見つかりません</div>
        <button onClick={handleBack} className="back-button">
          精算ページに戻る
        </button>
      </div>
    )
  }

  return (
    <div className="member-detail-page">
      <div className="header">
        <button onClick={handleBack} className="back-button">
          ← 戻る
        </button>
        <h1>{memberName}さんの精算詳細</h1>
      </div>

      <div className="summary-section">
        <div className="summary-card">
          <div className="summary-row">
            <span className="label">立替合計:</span>
            <span className="amount">¥{paidTotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span className="label">負担合計:</span>
            <span className="amount">¥{owedTotal.toLocaleString()}</span>
          </div>
          <div className="summary-row balance">
            <span className="label">
              {balance > 0 ? '受取金額:' : balance < 0 ? '支払金額:' : '差額:'}
            </span>
            <span className={`amount ${balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'zero'}`}>
              ¥{Math.abs(balance).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <div className="detail-card">
          <h2>立替一覧</h2>
          {payments.length === 0 ? (
            <p className="empty-message">立替はありません</p>
          ) : (
            <div className="detail-list">
              {payments.map((payment, index) => (
                <div key={`payment-${payment.receiptId}-${index}`} className="detail-item">
                  <span className="detail-title">{payment.title}</span>
                  <span className="detail-amount">¥{payment.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-card">
          <h2>負担一覧</h2>
          {owedItems.length === 0 ? (
            <p className="empty-message">負担はありません</p>
          ) : (
            <div className="detail-list">
              {owedItems.map((owed, index) => (
                <div key={`owed-${owed.receiptId}-${index}`} className="detail-item">
                  <span className="detail-title">{owed.title}</span>
                  <span className="detail-amount">¥{owed.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .member-detail-page {
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

        .summary-section {
          margin-bottom: 32px;
        }

        .summary-card {
          border: 2px solid #007bff;
          border-radius: 8px;
          padding: 20px;
          background-color: #f8f9fa;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .summary-row.balance {
          margin-top: 12px;
          padding-top: 16px;
          border-top: 2px solid #dee2e6;
          font-weight: bold;
        }

        .summary-row .label {
          color: #666;
          font-size: 16px;
        }

        .summary-row.balance .label {
          color: #333;
          font-size: 18px;
        }

        .summary-row .amount {
          font-size: 18px;
          color: #333;
        }

        .summary-row.balance .amount {
          font-size: 24px;
        }

        .summary-row .amount.positive {
          color: #28a745;
        }

        .summary-row .amount.negative {
          color: #dc3545;
        }

        .summary-row .amount.zero {
          color: #6c757d;
        }

        .details-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .detail-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background-color: #fff;
        }

        .detail-card h2 {
          margin: 0 0 16px 0;
          font-size: 20px;
          color: #333;
        }

        .empty-message {
          color: #999;
          font-size: 14px;
          text-align: center;
          padding: 20px 0;
        }

        .detail-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }

        .detail-title {
          color: #333;
          font-size: 15px;
        }

        .detail-amount {
          color: #007bff;
          font-size: 16px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .member-detail-page {
            padding: 16px;
          }

          .header h1 {
            font-size: 22px;
          }

          .back-button {
            font-size: 13px;
            padding: 6px 12px;
          }

          .summary-card {
            padding: 16px;
          }

          .summary-row .label {
            font-size: 14px;
          }

          .summary-row .amount {
            font-size: 16px;
          }

          .summary-row.balance .label {
            font-size: 16px;
          }

          .summary-row.balance .amount {
            font-size: 20px;
          }

          .detail-card {
            padding: 16px;
          }

          .detail-card h2 {
            font-size: 18px;
          }

          .detail-item {
            padding: 10px;
          }

          .detail-title {
            font-size: 14px;
          }

          .detail-amount {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  )
}

export default MemberDetailPage
