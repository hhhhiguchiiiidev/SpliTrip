export type Member = {
  id: string              // 一意のメンバーID（例: m1, m2, m3）
  name: string            // メンバー名
  defaultRatio: number    // デフォルト配布比率（デフォルト値: 100）
  createdAt: string       // 作成日時（ISO 8601形式）
}
