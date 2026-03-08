import type { Member } from '../../shared/types/member'

/**
 * メンバー選択コンポーネント
 * 要件: 2.3
 * 
 * Props:
 * - members: 選択可能なメンバーリスト
 * - selectedMemberIds: 選択済みメンバーID配列
 * - onChange: 選択変更時のコールバック
 */
interface MemberSelectorProps {
  members: Member[]
  selectedMemberIds: string[]
  onChange: (selectedIds: string[]) => void
}

function MemberSelector({ members, selectedMemberIds, onChange }: MemberSelectorProps) {
  const handleToggle = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      onChange(selectedMemberIds.filter(id => id !== memberId))
    } else {
      onChange([...selectedMemberIds, memberId])
    }
  }

  const handleSelectAll = () => {
    onChange(members.map(m => m.id))
  }

  const handleDeselectAll = () => {
    onChange([])
  }

  return (
    <div>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleSelectAll}
          style={{
            padding: '10px 16px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            minHeight: '44px', // タッチフレンドリーな最小高さ（要件: 10.2, 10.3）
            flex: '1 1 auto',
            minWidth: '120px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          全員選択
        </button>
        <button
          type="button"
          onClick={handleDeselectAll}
          style={{
            padding: '10px 16px',
            fontSize: '16px',
            backgroundColor: '#9E9E9E',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            minHeight: '44px', // タッチフレンドリーな最小高さ（要件: 10.2, 10.3）
            flex: '1 1 auto',
            minWidth: '120px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#757575'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9E9E9E'}
        >
          選択解除
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {members.map(member => (
          <label
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              backgroundColor: selectedMemberIds.includes(member.id) ? '#e3f2fd' : '#f5f5f5',
              borderRadius: '8px',
              cursor: 'pointer',
              border: selectedMemberIds.includes(member.id) ? '2px solid #2196F3' : '2px solid transparent',
              minHeight: '44px', // タッチフレンドリーな最小高さ（要件: 10.2, 10.3）
              transition: 'all 0.2s',
              boxShadow: selectedMemberIds.includes(member.id) ? '0 2px 8px rgba(33, 150, 243, 0.2)' : 'none'
            }}
          >
            <input
              type="checkbox"
              checked={selectedMemberIds.includes(member.id)}
              onChange={() => handleToggle(member.id)}
              style={{
                marginRight: '12px',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                flexShrink: 0
              }}
            />
            <span style={{ 
              fontSize: '16px', 
              fontWeight: selectedMemberIds.includes(member.id) ? 'bold' : 'normal' 
            }}>
              {member.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default MemberSelector
