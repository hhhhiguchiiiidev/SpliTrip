/**
 * 使い方ガイドモーダルコンポーネント
 * 要件: 7.2, 7.3, 7.4
 * 
 * 機能:
 * - レシート入力、レシート編集、精算確認の手順を表示
 * - 閉じるボタンを提供
 */

type UsageGuideModalProps = {
  isOpen: boolean
  onClose: () => void
}

function UsageGuideModal({ isOpen, onClose }: UsageGuideModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '30px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* タイトル */}
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px' }}>
          使い方ガイド
        </h2>

        {/* レシート入力の手順 */}
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '10px', fontSize: '20px' }}>
            📝 レシート入力
          </h3>
          <ol style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>「レシート入力」ボタンをクリック</li>
            <li>レシート情報（金額、支払い者、メモ）を入力</li>
            <li>割り振り対象を選択（全員で割る / メンバーを選択 / サブグループ）</li>
            <li>配分方法を選択（均等割り / 比率配分 / 固定金額）</li>
            <li>「保存」ボタンで登録完了</li>
          </ol>
        </section>

        {/* レシート編集の手順 */}
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#FF9800', marginBottom: '10px', fontSize: '20px' }}>
            ✏️ レシート編集
          </h3>
          <ol style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>「レシート修正」ボタンをクリック</li>
            <li>編集したいレシートを選択</li>
            <li>レシート情報を修正</li>
            <li>「保存」ボタンで変更を保存</li>
            <li>削除する場合は「削除」ボタンをクリック</li>
          </ol>
        </section>

        {/* 精算確認の手順 */}
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2196F3', marginBottom: '10px', fontSize: '20px' }}>
            💰 精算確認
          </h3>
          <ol style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>「精算確認」ボタンをクリック</li>
            <li>各メンバーの支払い額と負担額を確認</li>
            <li>精算方法（誰が誰にいくら支払うか）を確認</li>
            <li>メンバー詳細をクリックすると個別の明細を表示</li>
          </ol>
        </section>

        {/* 閉じるボタン */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 40px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

export default UsageGuideModal
