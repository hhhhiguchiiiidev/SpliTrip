import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, updateTrip } from '../api/tripApi'
import { generateSubgroupId } from '../../shared/utils/idGenerator'
import type { Trip } from '../../shared/types/trip'
import type { Subgroup, SubgroupMemberRatio } from '../../shared/types/subgroup'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

/**
 * サブグループ管理ページコンポーネント
 * 要件: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * 機能:
 * - サブグループ一覧表示
 * - 新規サブグループ作成フォーム
 * - サブグループ編集フォーム
 * - サブグループ削除（確認ダイアログ付き）
 */
function SubgroupManagementPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingSubgroupId, setEditingSubgroupId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // フォーム状態
  const [formName, setFormName] = useState('')
  const [formMemberRatios, setFormMemberRatios] = useState<SubgroupMemberRatio[]>([])
  const [formErrors, setFormErrors] = useState<{ name?: string; members?: string; ratios?: string }>({})
  
  const { toasts, showError, showSuccess, hideToast } = useToast()

  // 旅行データを取得
  useEffect(() => {
    if (!tripId) {
      setError('旅行IDが指定されていません')
      setIsLoading(false)
      return
    }

    const fetchTrip = async () => {
      try {
        const tripData = await getTrip(tripId)
        setTrip(tripData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'サーバーエラーが発生しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrip()
  }, [tripId])

  // フォームをリセット
  const resetForm = () => {
    setFormName('')
    setFormMemberRatios([])
    setFormErrors({})
    setEditingSubgroupId(null)
    setIsCreating(false)
  }

  // 新規作成フォームを開く
  const handleStartCreate = () => {
    resetForm()
    setIsCreating(true)
    // すべてのメンバーを初期値100で追加
    if (trip) {
      setFormMemberRatios(trip.members.map(member => ({
        memberId: member.id,
        ratio: 100
      })))
    }
  }

  // 編集フォームを開く
  const handleStartEdit = (subgroup: Subgroup) => {
    resetForm()
    setEditingSubgroupId(subgroup.id)
    setFormName(subgroup.name)
    setFormMemberRatios([...subgroup.memberRatios])
  }

  // メンバー比率の変更
  const handleRatioChange = (memberId: string, value: string) => {
    const ratio = parseFloat(value)
    setFormMemberRatios(prev =>
      prev.map(mr => mr.memberId === memberId ? { ...mr, ratio: isNaN(ratio) ? 0 : ratio } : mr)
    )
  }

  // メンバーの選択/選択解除
  const handleMemberToggle = (memberId: string) => {
    const exists = formMemberRatios.some(mr => mr.memberId === memberId)
    if (exists) {
      setFormMemberRatios(prev => prev.filter(mr => mr.memberId !== memberId))
    } else {
      setFormMemberRatios(prev => [...prev, { memberId, ratio: 100 }])
    }
  }

  // バリデーション
  const validateForm = (): boolean => {
    const errors: { name?: string; members?: string; ratios?: string } = {}

    // 名前のバリデーション（要件: 4.2, 10.2）
    if (!formName.trim()) {
      errors.name = 'サブグループ名を入力してください'
    }

    // メンバーのバリデーション（要件: 4.3, 10.3）
    if (formMemberRatios.length === 0) {
      errors.members = '少なくとも1人のメンバーを選択してください'
    }

    // 比率のバリデーション（要件: 4.5, 10.4）
    const hasInvalidRatio = formMemberRatios.some(mr => mr.ratio <= 0)
    if (hasInvalidRatio) {
      errors.ratios = 'すべての配布比率は正の数である必要があります'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // サブグループを保存（作成または更新）
  const handleSave = async () => {
    if (!trip) return

    if (!validateForm()) {
      showError('入力内容を確認してください')
      return
    }

    try {
      let updatedSubgroups: Subgroup[]

      if (editingSubgroupId) {
        // 編集モード（要件: 5.2）
        updatedSubgroups = trip.subgroups.map(sg =>
          sg.id === editingSubgroupId
            ? {
                ...sg,
                name: formName.trim(),
                memberRatios: formMemberRatios,
                updatedAt: new Date().toISOString()
              }
            : sg
        )
      } else {
        // 新規作成モード（要件: 4.6）
        const newSubgroup: Subgroup = {
          id: generateSubgroupId(trip.subgroups.length),
          name: formName.trim(),
          memberRatios: formMemberRatios,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        updatedSubgroups = [...trip.subgroups, newSubgroup]
      }

      const updatedTrip: Trip = {
        ...trip,
        subgroups: updatedSubgroups,
        updatedAt: new Date().toISOString()
      }

      const savedTrip = await updateTrip(updatedTrip)
      setTrip(savedTrip)
      resetForm()
      showSuccess(editingSubgroupId ? 'サブグループを更新しました' : 'サブグループを作成しました')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'サーバーエラーが発生しました')
    }
  }

  // サブグループを削除（要件: 5.3, 5.4, 5.5）
  const handleDelete = async (subgroupId: string) => {
    if (!trip) return

    // 確認ダイアログ（要件: 5.4）
    if (!window.confirm('このサブグループを削除してもよろしいですか？')) {
      return
    }

    try {
      const updatedSubgroups = trip.subgroups.filter(sg => sg.id !== subgroupId)
      const updatedTrip: Trip = {
        ...trip,
        subgroups: updatedSubgroups,
        updatedAt: new Date().toISOString()
      }

      const savedTrip = await updateTrip(updatedTrip)
      setTrip(savedTrip)
      showSuccess('サブグループを削除しました')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'サーバーエラーが発生しました')
    }
  }

  // ローディング中
  if (isLoading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  // エラー表示
  if (error || !trip) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px'
        }}>
          {error || '旅行が見つかりません'}
        </div>
        <Link
          to={`/trip/${tripId}`}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          旅行ページへ戻る
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <ToastContainer toasts={toasts} onClose={hideToast} />
      
      <h1>サブグループ管理</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>旅行: {trip.tripName}</p>

      {/* サブグループ一覧（要件: 4.7） */}
      <div style={{ marginBottom: '30px' }}>
        <h2>登録済みサブグループ</h2>
        {trip.subgroups.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>サブグループが登録されていません</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {trip.subgroups.map(subgroup => (
              <div
                key={subgroup.id}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0 }}>{subgroup.name}</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {/* 編集ボタン（要件: 5.1） */}
                    <button
                      onClick={() => handleStartEdit(subgroup)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      編集
                    </button>
                    {/* 削除ボタン（要件: 5.3） */}
                    <button
                      onClick={() => handleDelete(subgroup.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <p style={{ margin: '5px 0' }}>メンバー数: {subgroup.memberRatios.length}人</p>
                  <div style={{ marginTop: '10px' }}>
                    {subgroup.memberRatios.map(mr => {
                      const member = trip.members.find(m => m.id === mr.memberId)
                      return (
                        <div key={mr.memberId} style={{ marginBottom: '5px' }}>
                          {member?.name}: 比率 {mr.ratio}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新規作成ボタン */}
      {!isCreating && !editingSubgroupId && (
        <button
          onClick={handleStartCreate}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '30px'
          }}
        >
          新規サブグループ作成
        </button>
      )}

      {/* 作成/編集フォーム */}
      {(isCreating || editingSubgroupId) && (
        <div style={{
          padding: '20px',
          border: '2px solid #2196F3',
          borderRadius: '4px',
          backgroundColor: '#f5f9ff',
          marginBottom: '30px'
        }}>
          <h2>{editingSubgroupId ? 'サブグループ編集' : '新規サブグループ作成'}</h2>

          {/* サブグループ名入力（要件: 4.2） */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              サブグループ名 <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="例: 男性グループ"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: formErrors.name ? '2px solid #f44336' : '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
            {formErrors.name && (
              <div style={{ color: '#f44336', fontSize: '14px', marginTop: '5px' }}>
                {formErrors.name}
              </div>
            )}
          </div>

          {/* メンバー選択と比率入力（要件: 4.3, 4.4, 4.5） */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              メンバーと配布比率 <span style={{ color: 'red' }}>*</span>
            </label>
            {formErrors.members && (
              <div style={{ color: '#f44336', fontSize: '14px', marginBottom: '10px' }}>
                {formErrors.members}
              </div>
            )}
            {formErrors.ratios && (
              <div style={{ color: '#f44336', fontSize: '14px', marginBottom: '10px' }}>
                {formErrors.ratios}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {trip.members.map(member => {
                const memberRatio = formMemberRatios.find(mr => mr.memberId === member.id)
                const isSelected = !!memberRatio
                return (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '10px',
                      backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleMemberToggle(member.id)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1, fontSize: '16px' }}>{member.name}</span>
                    {isSelected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontSize: '14px' }}>比率:</label>
                        <input
                          type="number"
                          value={memberRatio.ratio}
                          onChange={(e) => handleRatioChange(member.id, e.target.value)}
                          min="0"
                          step="0.01"
                          style={{
                            width: '100px',
                            padding: '8px',
                            fontSize: '16px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* アクションボタン */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {editingSubgroupId ? '更新' : '作成'}
            </button>
            <button
              onClick={resetForm}
              style={{
                padding: '12px 24px',
                backgroundColor: '#9e9e9e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 旅行ページへ戻るリンク */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link
          to={`/trip/${tripId}`}
          style={{
            color: '#666',
            textDecoration: 'underline'
          }}
        >
          旅行ページへ戻る
        </Link>
      </div>
    </div>
  )
}

export default SubgroupManagementPage
