import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTrip, updateTrip } from '../api/tripApi'
import { splitEvenly, splitByRatio, splitByFixed } from '../../shared/utils/splitCalculator'
import { generateReceiptId } from '../../shared/utils/idGenerator'
import type { Trip } from '../../shared/types/trip'
import type { Member } from '../../shared/types/member'
import type { Receipt, SplitRatioInput, SplitFixedInput } from '../../shared/types/receipt'
import MemberSelector from '../components/MemberSelector'
import SplitModeSelector from '../components/SplitModeSelector'
import RatioInput from '../components/RatioInput'
import FixedAmountInput from '../components/FixedAmountInput'
import SubgroupSelector from '../components/SubgroupSelector'

/**
 * レシート入力ページコンポーネント
 * 要件: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 * 
 * 3ステップのフロー:
 * Step1: 合計金額、用途、支払い者入力
 * Step2: 割り対象選択（全員割/メンバー選定）
 * Step3: 配分方法選択（一律割/比率配分/金額指定配分）
 */
function ReceiptInputPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // フォームステップ
  const [step, setStep] = useState(1)

  // Step1: 基本情報
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [payerId, setPayerId] = useState('')

  // Step2: 割り対象
  const [targetMode, setTargetMode] = useState<'all' | 'selected'>('all')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string | null>(null)

  // Step3: 配分方法
  const [splitMode, setSplitMode] = useState<'equal' | 'ratio' | 'fixed'>('equal')
  const [ratioInputs, setRatioInputs] = useState<SplitRatioInput[]>([])
  const [fixedInputs, setFixedInputs] = useState<SplitFixedInput[]>([])

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

        // 初期値設定
        if (data.members.length > 0) {
          setPayerId(data.members[0].id)
          setSelectedMemberIds(data.members.map(m => m.id))
          
          // 比率入力の初期化（メンバーのデフォルト配布比率を使用、要件: 3.5）
          setRatioInputs(data.members.map(m => ({ memberId: m.id, ratio: m.defaultRatio })))
          
          // 金額指定入力の初期化
          setFixedInputs(data.members.map(m => ({ memberId: m.id, amount: 0 })))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '旅行データの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrip()
  }, [tripId])

  // 対象メンバーの取得
  const getTargetMembers = (): Member[] => {
    if (!trip) return []
    
    if (targetMode === 'all') {
      return trip.members
    } else {
      return trip.members.filter(m => selectedMemberIds.includes(m.id))
    }
  }

  // Step1のバリデーション
  const validateStep1 = (): boolean => {
    const numAmount = parseFloat(amount)
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('合計金額は正の数を入力してください')
      return false
    }

    if (!payerId) {
      setError('支払い者を選択してください')
      return false
    }

    setError(null)
    return true
  }

  // Step2のバリデーション
  const validateStep2 = (): boolean => {
    if (targetMode === 'selected' && selectedMemberIds.length === 0) {
      setError('対象メンバーを選択してください')
      return false
    }

    setError(null)
    return true
  }

  // Step3のバリデーション
  const validateStep3 = (): boolean => {
    const targetMembers = getTargetMembers()
    const numAmount = parseFloat(amount)

    if (splitMode === 'ratio') {
      const targetRatios = ratioInputs.filter(r => 
        targetMembers.some(m => m.id === r.memberId)
      )
      
      if (targetRatios.some(r => r.ratio <= 0)) {
        setError('比率は正の数を入力してください')
        return false
      }
    }

    if (splitMode === 'fixed') {
      const targetFixed = fixedInputs.filter(f => 
        targetMembers.some(m => m.id === f.memberId)
      )
      
      const sum = targetFixed.reduce((s, f) => s + f.amount, 0)
      
      if (Math.abs(sum - numAmount) >= 0.01) {
        setError('金額指定の合計が合計金額と一致しません')
        return false
      }
    }

    setError(null)
    return true
  }

  // 次のステップへ
  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    
    setStep(step + 1)
  }

  // 前のステップへ
  const handleBack = () => {
    setError(null)
    setStep(step - 1)
  }

  // レシート保存
  const handleSave = async () => {
    if (!trip || !tripId) return
    if (!validateStep3()) return

    setIsSaving(true)
    setError(null)

    try {
      const targetMembers = getTargetMembers()
      const numAmount = parseFloat(amount)

      // 分割計算
      let splits
      if (splitMode === 'equal') {
        splits = splitEvenly(numAmount, targetMembers.map(m => m.id))
      } else if (splitMode === 'ratio') {
        const targetRatios = ratioInputs.filter(r => 
          targetMembers.some(m => m.id === r.memberId)
        )
        splits = splitByRatio(numAmount, targetRatios)
      } else {
        const targetFixed = fixedInputs.filter(f => 
          targetMembers.some(m => m.id === f.memberId)
        )
        splits = splitByFixed(numAmount, targetFixed)
      }

      // レシート作成
      const newReceipt: Receipt = {
        id: generateReceiptId(trip.receipts.length),
        title: title.trim() || undefined,
        amount: numAmount,
        payerId,
        targetMode,
        splitMode,
        selectedMemberIds: targetMode === 'all' ? trip.members.map(m => m.id) : selectedMemberIds,
        ratioInputs: splitMode === 'ratio' ? ratioInputs.filter(r => 
          targetMembers.some(m => m.id === r.memberId)
        ) : undefined,
        fixedInputs: splitMode === 'fixed' ? fixedInputs.filter(f => 
          targetMembers.some(m => m.id === f.memberId)
        ) : undefined,
        splits,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 旅行データ更新
      const updatedTrip: Trip = {
        ...trip,
        receipts: [...trip.receipts, newReceipt],
        updatedAt: new Date().toISOString()
      }

      await updateTrip(updatedTrip)

      // 旅行ページへ戻る
      navigate(`/trip/${tripId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'レシートの保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  // 対象モード変更時の処理
  const handleTargetModeChange = (mode: 'all' | 'selected') => {
    setTargetMode(mode)
    setSelectedSubgroupId(null) // サブグループ選択をリセット
    
    if (mode === 'all' && trip) {
      setSelectedMemberIds(trip.members.map(m => m.id))
    }
  }

  // サブグループ選択時の処理（要件: 6.1, 6.2, 6.3）
  const handleSubgroupSelect = (subgroupId: string | null) => {
    setSelectedSubgroupId(subgroupId)
    
    if (subgroupId && trip) {
      const subgroup = trip.subgroups.find(sg => sg.id === subgroupId)
      if (subgroup) {
        // サブグループのメンバーを事前選択（要件: 6.3）
        setSelectedMemberIds(subgroup.memberRatios.map(mr => mr.memberId))
        
        // 比率配分モードの場合、サブグループのデフォルト配布比率で比率入力を事前入力（要件: 6.4）
        if (splitMode === 'ratio') {
          const targetMembers = trip.members.filter(m => 
            subgroup.memberRatios.some(mr => mr.memberId === m.id)
          )
          setRatioInputs(targetMembers.map(m => {
            const memberRatio = subgroup.memberRatios.find(mr => mr.memberId === m.id)
            return { memberId: m.id, ratio: memberRatio?.ratio ?? m.defaultRatio }
          }))
        }
      }
    }
  }

  // 分割モード変更時の処理
  const handleSplitModeChange = (mode: 'equal' | 'ratio' | 'fixed') => {
    setSplitMode(mode)
    
    // 比率入力の初期化
    if (mode === 'ratio' && trip) {
      const targetMembers = getTargetMembers()
      
      // サブグループが選択されている場合、サブグループのデフォルト配布比率を使用（要件: 6.4）
      if (selectedSubgroupId) {
        const subgroup = trip.subgroups.find(sg => sg.id === selectedSubgroupId)
        if (subgroup) {
          setRatioInputs(targetMembers.map(m => {
            const memberRatio = subgroup.memberRatios.find(mr => mr.memberId === m.id)
            return { memberId: m.id, ratio: memberRatio?.ratio ?? m.defaultRatio }
          }))
          return
        }
      }
      
      // サブグループが選択されていない場合、メンバーのデフォルト配布比率を使用（要件: 3.5）
      setRatioInputs(targetMembers.map(m => ({ memberId: m.id, ratio: m.defaultRatio })))
    }
    
    // 金額指定入力の初期化
    if (mode === 'fixed' && trip) {
      const targetMembers = getTargetMembers()
      setFixedInputs(targetMembers.map(m => ({ memberId: m.id, amount: 0 })))
    }
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
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>レシート入力</h1>
      <p style={{ fontSize: '14px', color: '#666' }}>旅行: {trip.tripName}</p>

      {/* ステップインジケーター */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}>
        {[1, 2, 3].map(s => (
          <div
            key={s}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px',
              backgroundColor: step >= s ? '#2196F3' : '#e0e0e0',
              color: step >= s ? 'white' : '#666',
              borderRadius: '4px',
              margin: '0 5px',
              fontWeight: 'bold'
            }}
          >
            Step {s}
          </div>
        ))}
      </div>

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

      {/* Step1: 基本情報 */}
      {step === 1 && (
        <div>
          <h2>Step1: 基本情報</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              合計金額 <span style={{ color: '#c00' }}>*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例: 10000"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              用途（任意）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: スーパー買い出し"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              支払い者 <span style={{ color: '#c00' }}>*</span>
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              {trip.members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

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
              キャンセル
            </button>
            <button
              onClick={handleNext}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* Step2: 割り対象選択 */}
      {step === 2 && (
        <div>
          <h2>Step2: 割り対象選択</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              誰で割りますか？
            </label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: targetMode === 'all' ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: targetMode === 'all' ? '2px solid #2196F3' : '2px solid transparent'
                }}
              >
                <input
                  type="radio"
                  name="targetMode"
                  value="all"
                  checked={targetMode === 'all'}
                  onChange={() => handleTargetModeChange('all')}
                  style={{
                    marginRight: '10px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '16px' }}>全員で割る</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: targetMode === 'selected' ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: targetMode === 'selected' ? '2px solid #2196F3' : '2px solid transparent'
                }}
              >
                <input
                  type="radio"
                  name="targetMode"
                  value="selected"
                  checked={targetMode === 'selected'}
                  onChange={() => handleTargetModeChange('selected')}
                  style={{
                    marginRight: '10px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '16px' }}>メンバーを選択</span>
              </label>

              {/* サブグループ選択肢（要件: 6.1） */}
              {trip.subgroups.length > 0 && (
                <SubgroupSelector
                  subgroups={trip.subgroups}
                  selectedSubgroupId={selectedSubgroupId}
                  onSelect={handleSubgroupSelect}
                />
              )}
            </div>

            {targetMode === 'selected' && (
              <MemberSelector
                members={trip.members}
                selectedMemberIds={selectedMemberIds}
                onChange={setSelectedMemberIds}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleBack}
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
            <button
              onClick={handleNext}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* Step3: 配分方法選択 */}
      {step === 3 && (
        <div>
          <h2>Step3: 配分方法選択</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              どのように分割しますか？
            </label>
            
            <SplitModeSelector
              splitMode={splitMode}
              onChange={handleSplitModeChange}
            />
          </div>

          {splitMode === 'ratio' && (
            <div style={{ marginBottom: '20px' }}>
              <RatioInput
                members={getTargetMembers()}
                ratioInputs={ratioInputs}
                onChange={setRatioInputs}
              />
            </div>
          )}

          {splitMode === 'fixed' && (
            <div style={{ marginBottom: '20px' }}>
              <FixedAmountInput
                members={getTargetMembers()}
                fixedInputs={fixedInputs}
                totalAmount={parseFloat(amount) || 0}
                onChange={setFixedInputs}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleBack}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                backgroundColor: isSaving ? '#ccc' : '#9E9E9E',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              戻る
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                backgroundColor: isSaving ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReceiptInputPage
