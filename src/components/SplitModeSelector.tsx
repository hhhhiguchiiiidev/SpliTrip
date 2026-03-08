/**
 * 分割モード選択コンポーネント
 * 要件: 2.4, 2.5, 2.6
 * 
 * Props:
 * - splitMode: 現在の分割モード
 * - onChange: 分割モード変更時のコールバック
 */
interface SplitModeSelectorProps {
  splitMode: 'equal' | 'ratio' | 'fixed'
  onChange: (mode: 'equal' | 'ratio' | 'fixed') => void
}

function SplitModeSelector({ splitMode, onChange }: SplitModeSelectorProps) {
  const modes = [
    { value: 'equal' as const, label: '一律割', description: '全員で均等に分割' },
    { value: 'ratio' as const, label: '比率配分', description: '比率に応じて分割' },
    { value: 'fixed' as const, label: '金額指定配分', description: '各自の金額を指定' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {modes.map(mode => (
        <label
          key={mode.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: splitMode === mode.value ? '#e3f2fd' : '#f5f5f5',
            borderRadius: '8px',
            cursor: 'pointer',
            border: splitMode === mode.value ? '2px solid #2196F3' : '2px solid transparent',
            minHeight: '44px', // タッチフレンドリーな最小高さ（要件: 10.2, 10.3）
            transition: 'all 0.2s',
            boxShadow: splitMode === mode.value ? '0 2px 8px rgba(33, 150, 243, 0.2)' : 'none'
          }}
        >
          <input
            type="radio"
            name="splitMode"
            value={mode.value}
            checked={splitMode === mode.value}
            onChange={() => onChange(mode.value)}
            style={{
              marginRight: '12px',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
              {mode.label}
            </div>
            <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
              {mode.description}
            </div>
          </div>
        </label>
      ))}
    </div>
  )
}

export default SplitModeSelector
