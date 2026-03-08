import { useState } from 'react'
import { createTrip } from '../api/tripApi'
import type { Trip } from '../../shared/types/trip'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'
import FormError from '../components/FormError'

/**
 * 管理ページコンポーネント
 * 要件: 1.1, 1.3, 7.1
 * 
 * 機能:
 * - 旅行作成フォーム
 * - メンバー登録フォーム
 * - 旅行URL表示
 */
function AdminPage() {
  const [tripName, setTripName] = useState('')
  const [memberName, setMemberName] = useState('')
  const [members, setMembers] = useState<{ name: string }[]>([])
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null)
  const [tripNameError, setTripNameError] = useState<string>('')
  const [memberNameError, setMemberNameError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  
  // トースト通知フック（要件: 10.5）
  const { toasts, showError, showSuccess, hideToast } = useToast()

  // メンバー追加ハンドラー
  const handleAddMember = () => {
    if (!memberName.trim()) {
      setMemberNameError('メンバー名を入力してください')
      return
    }

    setMembers([...members, { name: memberName.trim() }])
    setMemberName('')
    setMemberNameError('')
    showSuccess(`${memberName.trim()} を追加しました`)
  }

  // メンバー削除ハンドラー
  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  // 旅行作成ハンドラー
  const handleCreateTrip = async () => {
    // バリデーション
    let hasError = false
    
    if (!tripName.trim()) {
      setTripNameError('旅行名を入力してください')
      hasError = true
    } else {
      setTripNameError('')
    }

    if (members.length === 0) {
      showError('少なくとも1人のメンバーを追加してください')
      hasError = true
    }
    
    if (hasError) {
      return
    }

    setIsLoading(true)

    try {
      const trip = await createTrip({
        tripName: tripName.trim(),
        members
      })

      setCreatedTrip(trip)
      showSuccess('旅行が作成されました！')
      // フォームをリセット
      setTripName('')
      setMembers([])
      setTripNameError('')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'サーバーエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 旅行URL生成
  const getTripUrl = (tripId: string) => {
    return `${window.location.origin}/trip/${tripId}`
  }

  // URLをクリップボードにコピー
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showSuccess('URLをクリップボードにコピーしました')
    } catch (err) {
      showError('URLのコピーに失敗しました')
    }
  }

  // 新しい旅行を作成
  const handleCreateNewTrip = () => {
    setCreatedTrip(null)
    setTripNameError('')
    setMemberNameError('')
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* トースト通知コンテナ（要件: 10.5） */}
      <ToastContainer toasts={toasts} onClose={hideToast} />
      
      <h1>SpliTrip - 管理ページ</h1>

      {!createdTrip ? (
        <>
          {/* 旅行作成フォーム */}
          <div style={{ marginBottom: '30px' }}>
            <h2>旅行を作成</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                旅行名
              </label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => {
                  setTripName(e.target.value)
                  if (e.target.value.trim()) {
                    setTripNameError('')
                  }
                }}
                placeholder="例: 伊豆旅行"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: tripNameError ? '2px solid #f44336' : '1px solid #ccc',
                  minHeight: '44px' // タッチフレンドリーな最小高さ
                }}
                aria-invalid={!!tripNameError}
                aria-describedby={tripNameError ? 'tripName-error' : undefined}
              />
              {/* フォームエラー表示（要件: 10.5） */}
              <FormError message={tripNameError} />
            </div>
          </div>

          {/* メンバー登録フォーム */}
          <div style={{ marginBottom: '30px' }}>
            <h2>メンバーを追加</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => {
                    setMemberName(e.target.value)
                    if (e.target.value.trim()) {
                      setMemberNameError('')
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddMember()
                    }
                  }}
                  placeholder="メンバー名"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: memberNameError ? '2px solid #f44336' : '1px solid #ccc',
                    minHeight: '44px' // タッチフレンドリーな最小高さ
                  }}
                  aria-invalid={!!memberNameError}
                />
                {/* フォームエラー表示（要件: 10.5） */}
                <FormError message={memberNameError} />
              </div>
              <button
                onClick={handleAddMember}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  minHeight: '44px', // タッチフレンドリーな最小高さ
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
              >
                追加
              </button>
            </div>

            {/* メンバーリスト */}
            {members.length > 0 && (
              <div>
                <h3>登録済みメンバー ({members.length}人)</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {members.map((member, index) => (
                    <li
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        marginBottom: '8px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        minHeight: '44px' // タッチフレンドリーな最小高さ
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{member.name}</span>
                      <button
                        onClick={() => handleRemoveMember(index)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          minHeight: '36px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
                      >
                        削除
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 旅行作成ボタン */}
          <button
            onClick={handleCreateTrip}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '18px',
              backgroundColor: isLoading ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              minHeight: '52px', // タッチフレンドリーな最小高さ
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#1976D2'
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#2196F3'
            }}
          >
            {isLoading ? '作成中...' : '旅行を作成'}
          </button>
        </>
      ) : (
        <>
          {/* 旅行URL表示 */}
          <div style={{
            padding: '24px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2>旅行が作成されました！</h2>
            <p><strong>旅行名:</strong> {createdTrip.tripName}</p>
            <p><strong>メンバー数:</strong> {createdTrip.members.length}人</p>
            
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                旅行URL
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={getTripUrl(createdTrip.tripId)}
                  readOnly
                  style={{
                    flex: '1 1 200px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    backgroundColor: '#fff',
                    minHeight: '44px' // タッチフレンドリーな最小高さ
                  }}
                />
                <button
                  onClick={() => handleCopyUrl(getTripUrl(createdTrip.tripId))}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    minHeight: '44px', // タッチフレンドリーな最小高さ
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F57C00'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF9800'}
                >
                  コピー
                </button>
              </div>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px', lineHeight: '1.5' }}>
                このURLをメンバーに共有してください
              </p>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`/trip/${createdTrip.tripId}`}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  minHeight: '44px', // タッチフレンドリーな最小高さ
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: '1 1 auto',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
              >
                旅行ページへ
              </a>
              <button
                onClick={handleCreateNewTrip}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  minHeight: '44px', // タッチフレンドリーな最小高さ
                  flex: '1 1 auto',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
              >
                新しい旅行を作成
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminPage
