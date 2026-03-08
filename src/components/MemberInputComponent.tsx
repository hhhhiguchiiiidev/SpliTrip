import { useState } from 'react'
import type { Member } from '../../shared/types/member'
import { generateMemberId } from '../../shared/utils/idGenerator'
import FormError from './FormError'

/**
 * MemberInputComponentのProps
 */
export type MemberInputComponentProps = {
  existingMemberCount: number
  onAddMember: (member: Member) => void
}

/**
 * メンバー入力コンポーネント
 * 要件: 3.1, 3.2, 3.3, 3.4
 * 
 * 機能:
 * - メンバー名入力フィールド
 * - デフォルト配布比率入力フィールド（初期値100）
 * - バリデーション（名前が空でない、比率が正の数）
 * - 追加成功後のフォームリセット
 */
function MemberInputComponent({ existingMemberCount, onAddMember }: MemberInputComponentProps) {
  const [name, setName] = useState('')
  const [defaultRatio, setDefaultRatio] = useState('100')
  const [nameError, setNameError] = useState('')
  const [ratioError, setRatioError] = useState('')

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    // バリデーション
    let hasError = false

    if (!name.trim()) {
      setNameError('メンバー名を入力してください')
      hasError = true
    } else {
      setNameError('')
    }

    const ratio = parseFloat(defaultRatio)
    if (isNaN(ratio) || ratio <= 0) {
      setRatioError('比率は0より大きい値を入力してください')
      hasError = true
    } else {
      setRatioError('')
    }

    if (hasError) {
      return
    }

    // メンバーを作成
    const member: Member = {
      id: generateMemberId(existingMemberCount),
      name: name.trim(),
      defaultRatio: ratio,
      createdAt: new Date().toISOString()
    }

    onAddMember(member)

    // フォームをリセット
    setName('')
    setDefaultRatio('100')
    setNameError('')
    setRatioError('')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (e.target.value.trim()) {
                setNameError('')
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit()
              }
            }}
            placeholder="メンバー名"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: nameError ? '2px solid #f44336' : '1px solid #ccc',
              minHeight: '44px'
            }}
            aria-label="メンバー名"
            aria-invalid={!!nameError}
          />
          <FormError message={nameError} />
        </div>

        <div style={{ flex: '0 1 120px' }}>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={defaultRatio}
            onChange={(e) => {
              setDefaultRatio(e.target.value)
              if (parseFloat(e.target.value) > 0) {
                setRatioError('')
              }
            }}
            placeholder="比率"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: ratioError ? '2px solid #f44336' : '1px solid #ccc',
              minHeight: '44px'
            }}
            aria-label="デフォルト比率"
            aria-invalid={!!ratioError}
          />
          <FormError message={ratioError} />
        </div>

        <button
          onClick={() => handleSubmit()}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            minHeight: '44px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          追加
        </button>
      </div>

      <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
        デフォルト比率: レシート入力時の初期値（通常は100）
      </p>
    </div>
  )
}

export default MemberInputComponent
