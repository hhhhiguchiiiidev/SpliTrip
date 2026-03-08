import { useState } from 'react'
import type { Member } from '../../shared/types/member'
import type { SplitRatioInput } from '../../shared/types/receipt'

/**
 * 比率入力コンポーネント
 * 要件: 2.5, 11.1, 11.2
 * 
 * Props:
 * - members: 対象メンバーリスト
 * - ratioInputs: 現在の比率入力配列
 * - onChange: 比率変更時のコールバック
 */
interface RatioInputProps {
  members: Member[]
  ratioInputs: SplitRatioInput[]
  onChange: (ratioInputs: SplitRatioInput[]) => void
}

function RatioInput({ members, ratioInputs, onChange }: RatioInputProps) {
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({})

  const handleRatioChange = (memberId: string, value: string) => {
    // 表示用の値を更新
    setDisplayValues(prev => ({ ...prev, [memberId]: value }))
    
    // 数値に変換して親に通知
    const numValue = parseFloat(value) || 0
    const updated = ratioInputs.map(input =>
      input.memberId === memberId
        ? { ...input, ratio: numValue }
        : input
    )
    
    onChange(updated)
  }

  const handleFocus = (memberId: string) => {
    const ratio = getRatioForMember(memberId)
    // フォーカス時、デフォルト値（100）なら空欄にする
    if (ratio === 100) {
      setDisplayValues(prev => ({ ...prev, [memberId]: '' }))
    } else {
      setDisplayValues(prev => ({ ...prev, [memberId]: String(ratio) }))
    }
  }

  const handleBlur = (memberId: string) => {
    const currentValue = displayValues[memberId]
    // ブラー時、空欄ならデフォルト値（100）に戻す
    if (!currentValue || currentValue.trim() === '') {
      const updated = ratioInputs.map(input =>
        input.memberId === memberId
          ? { ...input, ratio: 100 }
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

  const getRatioForMember = (memberId: string): number => {
    const input = ratioInputs.find(r => r.memberId === memberId)
    return input?.ratio ?? 100
  }

  const getDisplayValue = (memberId: string): string => {
    // フォーカス中の表示値があればそれを使用
    if (memberId in displayValues) {
      return displayValues[memberId]
    }
    // それ以外は実際の値を表示
    const ratio = getRatioForMember(memberId)
    return String(ratio)
  }

  const totalRatio = ratioInputs.reduce((sum, input) => sum + input.ratio, 0)

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0', lineHeight: '1.5' }}>
          各メンバーの比率を入力してください（デフォルト: 100）
        </p>
        <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
          合計比率: {totalRatio}
        </p>
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
                onChange={(e) => handleRatioChange(member.id, e.target.value)}
                onFocus={() => handleFocus(member.id)}
                onBlur={() => handleBlur(member.id)}
                placeholder="100"
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
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RatioInput
