export type SubgroupMemberRatio = {
  memberId: string        // メンバーID
  ratio: number           // サブグループ用デフォルト配布比率
}

export type Subgroup = {
  id: string                          // 一意のサブグループID（例: sg1, sg2, sg3）
  name: string                        // サブグループ名
  memberRatios: SubgroupMemberRatio[] // メンバーと比率のマッピング
  createdAt: string                   // 作成日時（ISO 8601形式）
  updatedAt: string                   // 更新日時（ISO 8601形式）
}
