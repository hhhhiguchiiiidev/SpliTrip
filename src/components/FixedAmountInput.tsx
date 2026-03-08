import { useState } from 'react'
import type { Member } from '../../shared/types/member'
import type { SplitFixedInput } from '../../shared/types/receipt'

/**
 * 金額指定入力コンポーネント
 * 要件: 2.6, 2.7
 * 
 * Props:
 * - members: 対象メンバーリスト
 * - fixedInputs: 現在の金額指定入力配列
 * - totalAmount: レシートの合計金額
 * - onChange: 金額変更時のコールバック
 */
interface FixedAmountInputProps {
  members: Member[]
  fixedInputs: SplitFixedInput[]
  totalAmount: number
  onChange: (fixedInputs: SplitFixedInput[]) => void
}

function FixedAmountInput({ members, fixedInputs, totalAmount, onChange }: FixedAmountInputProps) {
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({})

  const handleAmountChange = (memberId: string, value: string) => {
    // 表示用の値を更新
    setDisplayValues(prev => ({ ...prev, [memberId]: value }))
    
    // 数値に変換して親に通知
    const numValue = parseFloat(value) || 0
    const updated = fixedInputs.map(input =>
      input.memberId === memberId
        ? { ...input, amount: numValue }
        : input
    )
    
    onChange(updated)
  }

  const handleFocus = (memberId: string) => {
    const amount = getAmountForMember(memberId)
    // フォーカス時、0なら空欄にする
    if (amount === 0) {
      setDisplayValues(prev => ({ ...prev, [memberId]: '' }))
    } else {
      setDisplayValues(prev => ({ ...prev, [memberId]: String(amount) }))
    }
  }

  const handleBlur = (memberId: string) => {
    const currentValue = displayValues[memberId]
    // ブラー時、空欄なら0に戻す
    if (!currentValue || currentValue.trim() === '') {
      const updated = fixedInputs.map(input =>
        input.memberId === memberId
          ? { ...input, amount: 0 }
          : input
      )
      onChange(updated)
      setDisplayValues(prev => ({ ...prev, [memberId]: '' }))
    } else {
      // 表示値をクリア（実際の値を表示）
      setDisplayValues(prev => {
        const newValues = { ...prev }
        delete newValues[memberId]
        return newValues
      })
    }
  }

  const getAmountForMember = (memberId: string): number => {
    const input = fixedInputs.find(f => f.memberId === memberId)
    return input?.amount ?? 0
  }

  const getDisplayValue = (memberId: string): string => {
    // フォーカス中の表示値があればそれを使用
    if (memberId in displayValues) {
      return displayValues[memberId]
    }
    // それ以外は実際の値を表示
    const amount = getAmountForMember(memberId)
    return String(amount)
  }

  const totalFixed = fixedInputs.reduce((sum, input) => sum + input.amount, 0)
  const difference = totalAmount - totalFixed
  const isValid = Math.abs(difference) < 0.01

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 12px 0', lineHeight: '1.5' }}>
          各メンバーの負担金額を入力してください
        </p>
        <div style={{
          padding: '14px 16px',
          backgroundColor: isValid ? '#e8f5e9' : '#ffebee',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            合計金額: {totalAmount}円
          </p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            入力合計: {totalFixed}円
          </p>
          <p style={{
            fontSize: '16px',
            fontWeight: 'bold',
            margin: 0,
            color: isValid ? '#2e7d32' : '#c62828'
          }}>
            差額: {difference}円 {isValid ? '✓' : '✗'}
          </p>
        </div>
        {!isValid && (
          <p style={{ fontSize: '14px', color: '#c62828', margin: 0, lineHeight: '1.5' }}>
            入力合計が合計金額と一致していません
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {members.map(member => (
          <div
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              minHeight: '44px', // タッチフレンドリーな最小高さ（要件: 10.2, 10.3）
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '16px', flex: '1 1 auto', minWidth: '100px' }}>
              {member.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                min="0"
                step="1"
                value={getDisplayValue(member.id)}
                onChange={(e) => handleAmountChange(member.id, e.target.value)}
                onFocus={() => handleFocus(member.id)}
                onBlur={() => handleBlur(member.id)}
                placeholder="0"
                style={{
                  width: '120px',
                  padding: '10px 12px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  textAlign: 'right',
                  minHeight: '44px' // タッチフレンドリーな最小高さ（要件: 10.2, 10.3）
                }}
              />
              <span style={{ fontSize: '16px' }}>円</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FixedAmountInput
