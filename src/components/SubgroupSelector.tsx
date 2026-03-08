import type { Subgroup } from '../../shared/types/subgroup'

type SubgroupSelectorProps = {
  subgroups: Subgroup[]
  selectedSubgroupId: string | null
  onSelect: (subgroupId: string | null) => void
}

/**
 * サブグループ選択コンポーネント
 * 要件: 6.1, 6.2, 6.3
 * 
 * レシート入力時にサブグループを選択するためのコンポーネント
 * 「全員で割る」「メンバーを選択」の下にサブグループ選択肢を表示
 */
function SubgroupSelector({ subgroups, selectedSubgroupId, onSelect }: SubgroupSelectorProps) {
  if (subgroups.length === 0) {
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {subgroups.map(subgroup => (
        <label
          key={subgroup.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: selectedSubgroupId === subgroup.id ? '#e3f2fd' : '#f5f5f5',
            borderRadius: '4px',
            cursor: 'pointer',
            border: selectedSubgroupId === subgroup.id ? '2px solid #2196F3' : '2px solid transparent'
          }}
        >
          <input
            type="radio"
            name="subgroupSelector"
            value={subgroup.id}
            checked={selectedSubgroupId === subgroup.id}
            onChange={() => onSelect(subgroup.id)}
            style={{
              marginRight: '10px',
              width: '18px',
              height: '18px',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '16px' }}>{subgroup.name}</span>
        </label>
      ))}
    </div>
  )
}

export default SubgroupSelector
