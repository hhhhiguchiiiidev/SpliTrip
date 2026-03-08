import { Settlement } from '@shared/types/settlement'
import { useNavigate } from 'react-router-dom'

/**
 * 精算サマリー表示コンポーネント
 * 要件: 4.5
 */
interface SettlementSummaryProps {
  settlements: Settlement[]
  tripId: string
}

function SettlementSummary({ settlements, tripId }: SettlementSummaryProps) {
  const navigate = useNavigate()

  const handleMemberClick = (memberId: string) => {
    navigate(`/trip/${tripId}/summary/${memberId}`)
  }

  return (
    <div className="settlement-summary">
      <h2>精算サマリー</h2>
      <div className="settlement-list">
        {settlements.map((settlement) => (
          <div 
            key={settlement.memberId} 
            className="settlement-item clickable"
            onClick={() => handleMemberClick(settlement.memberId)}
          >
            <div className="settlement-header">
              <h3>{settlement.memberName}</h3>
              <span className="detail-link">詳細を見る →</span>
            </div>
            <div className="settlement-details">
              <div className="settlement-row">
                <span className="label">立替合計:</span>
                <span className="amount">¥{settlement.paidTotal.toLocaleString()}</span>
              </div>
              <div className="settlement-row">
                <span className="label">負担合計:</span>
                <span className="amount">¥{settlement.owedTotal.toLocaleString()}</span>
              </div>
              <div className="settlement-row balance">
                <span className="label">
                  {settlement.balance > 0 ? '受取金額:' : settlement.balance < 0 ? '支払金額:' : '差額:'}
                </span>
                <span className={`amount ${settlement.balance > 0 ? 'positive' : settlement.balance < 0 ? 'negative' : 'zero'}`}>
                  ¥{Math.abs(settlement.balance).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        .settlement-summary {
          padding: 20px;
        }
        
        .settlement-summary h2 {
          margin-bottom: 20px;
          font-size: 24px;
          color: #333;
        }
        
        .settlement-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .settlement-item {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          background-color: #fff;
          transition: all 0.2s ease;
        }
        
        .settlement-item.clickable {
          cursor: pointer;
        }
        
        .settlement-item.clickable:hover {
          border-color: #007bff;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
          transform: translateY(-2px);
        }
        
        .settlement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .settlement-header h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: #333;
        }
        
        .detail-link {
          color: #007bff;
          font-size: 14px;
          font-weight: 500;
        }
        
        .settlement-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .settlement-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
        }
        
        .settlement-row.balance {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 2px solid #eee;
          font-weight: bold;
        }
        
        .settlement-row .label {
          color: #666;
          font-size: 14px;
        }
        
        .settlement-row.balance .label {
          color: #333;
          font-size: 16px;
        }
        
        .settlement-row .amount {
          font-size: 16px;
          color: #333;
        }
        
        .settlement-row.balance .amount {
          font-size: 20px;
        }
        
        .settlement-row .amount.positive {
          color: #28a745;
        }
        
        .settlement-row .amount.negative {
          color: #dc3545;
        }
        
        .settlement-row .amount.zero {
          color: #6c757d;
        }
        
        @media (max-width: 768px) {
          .settlement-summary {
            padding: 16px;
          }
          
          .settlement-summary h2 {
            font-size: 20px;
          }
          
          .settlement-item {
            padding: 12px;
          }
          
          .settlement-header h3 {
            font-size: 16px;
          }
          
          .settlement-row .label {
            font-size: 13px;
          }
          
          .settlement-row .amount {
            font-size: 14px;
          }
          
          .settlement-row.balance .label {
            font-size: 14px;
          }
          
          .settlement-row.balance .amount {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  )
}

export default SettlementSummary
