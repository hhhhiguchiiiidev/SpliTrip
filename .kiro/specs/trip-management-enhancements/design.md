# デザインドキュメント

## 概要

本ドキュメントは、SpliTrip旅行管理機能拡張の技術設計を定義します。既存のReact + TypeScript + Cloudflare Pagesアーキテクチャに対して、以下の機能を追加します：

- 管理ページでの旅行一覧表示と削除機能
- メンバーのデフォルト配布比率設定
- サブグループ機能（登録、編集、削除、レシート入力時の選択）
- 使い方ガイド表示
- UI改善（管理ページリンクの削除）

## アーキテクチャ

### システム構成

既存のアーキテクチャを維持し、以下のレイヤーで機能を拡張します：

```
┌─────────────────────────────────────┐
│     フロントエンド (React)          │
│  - AdminPage (拡張)                 │
│    - 旅行一覧表示                   │
│    - 旅行削除                       │
│    - 既存旅行へのメンバー追加       │
│  - TripPage (拡張)                  │
│  - ReceiptInputPage (拡張)          │
│  - 新規コンポーネント                │
└─────────────────────────────────────┘
              ↓ HTTP
┌─────────────────────────────────────┐
│   API Layer (Cloudflare Functions)  │
│  - GET /api/trips (新規)            │
│  - DELETE /api/trips/:id (新規)     │
│  - 既存エンドポイント                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Repository Layer                  │
│  - TripRepository (拡張)            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Storage (Cloudflare KV)           │
│  - trip:{tripId} (JSON拡張)         │
└─────────────────────────────────────┘
```

### データフロー

1. **旅行一覧表示**
   - AdminPage → GET /api/trips → TripRepository.list() → KV
   - KVの`list()`メソッドで`trip:`プレフィックスを持つすべてのキーを取得
   - 各キーから旅行データを取得し、TripListItemに変換

2. **旅行削除**
   - AdminPage → DELETE /api/trips/:id → TripRepository.delete() → KV
   - 旅行データをKVから削除

3. **デフォルト配布比率設定**
   - AdminPage → Member型にdefaultRatioフィールド追加 → 旅行作成時に保存
   - ReceiptInputPage → メンバーのdefaultRatioを読み込んで比率入力に事前入力

4. **サブグループ機能**
   - TripPage → SubgroupManagementPage → PUT /api/trips/:id → Trip型にsubgroupsフィールド追加
   - ReceiptInputPage → サブグループ選択 → サブグループのメンバーと比率を使用

## コンポーネントとインターフェース

### 型定義の拡張

#### Member型の拡張

```typescript
export type Member = {
  id: string              // 一意のメンバーID
  name: string            // メンバー名
  defaultRatio: number    // デフォルト配布比率（新規追加）
  createdAt: string       // 作成日時
}
```

#### Subgroup型の定義

```typescript
export type SubgroupMemberRatio = {
  memberId: string        // メンバーID
  ratio: number           // サブグループ用デフォルト配布比率
}

export type Subgroup = {
  id: string                          // 一意のサブグループID
  name: string                        // サブグループ名
  memberRatios: SubgroupMemberRatio[] // メンバーと比率のマッピング
  createdAt: string                   // 作成日時
  updatedAt: string                   // 更新日時
}
```

#### Trip型の拡張

```typescript
export type Trip = {
  tripId: string          // 一意の旅行ID
  tripName: string        // 旅行名
  version: number         // バージョン番号
  createdAt: string       // 作成日時
  updatedAt: string       // 更新日時
  members: Member[]       // メンバー配列（Member型が拡張される）
  receipts: Receipt[]     // レシート配列
  subgroups: Subgroup[]   // サブグループ配列（新規追加）
}
```

#### TripListItem型の定義

```typescript
export type TripListItem = {
  tripId: string          // 旅行ID
  tripName: string        // 旅行名
  memberCount: number     // メンバー数
  createdAt: string       // 作成日時
}
```

### API拡張

#### GET /api/trips

すべての旅行のリストを取得します。

**レスポンス:**
```typescript
{
  trips: TripListItem[]
}
```

#### DELETE /api/trips/:tripId

指定された旅行を削除します。

**レスポンス:**
```typescript
{
  success: boolean
}
```

### 拡張コンポーネント

#### AdminPage

管理ページコンポーネントを拡張し、以下の機能を追加：

**新機能:**
1. **旅行一覧表示と削除**
   - TripListComponentを統合
   - 削除ボタンで旅行を削除
   - 削除成功時にリストを更新

2. **既存旅行へのメンバー追加**
   - 旅行選択ドロップダウン
   - 選択した旅行のメンバー管理画面
   - メンバーの追加・削除
   - 更新ボタンで変更を保存
   - キャンセルボタンで編集を中止

**状態管理:**
```typescript
{
  selectedTripForEdit: Trip | null  // 編集中の旅行
  isLoadingTrip: boolean            // 旅行読み込み中フラグ
  // ... 既存の状態
}
```

**新規ハンドラー:**
- `handleSelectTripForEdit(tripId: string)`: 旅行を選択してメンバー管理画面に切り替え
- `handleUpdateTripMembers()`: メンバーの変更を保存
- `handleCancelEdit()`: 編集をキャンセル

### 新規コンポーネント

#### TripListComponent

管理ページで旅行一覧を表示するコンポーネント。

**Props:**
```typescript
type TripListComponentProps = {
  trips: TripListItem[]
  onDelete: (tripId: string) => Promise<void>
}
```

**機能:**
- 旅行リストを作成日時降順で表示
- 各旅行に旅行ページへのリンクと削除ボタンを表示
- 削除時に確認ダイアログを表示

#### MemberInputComponent

メンバー追加時にデフォルト配布比率を入力するコンポーネント。

**Props:**
```typescript
type MemberInputComponentProps = {
  onAddMember: (member: Member) => void
}
```

**内部状態:**
```typescript
{
  name: string              // メンバー名（初期値: ''）
  defaultRatio: string      // デフォルト配布比率（初期値: '100'）
  error: string             // エラーメッセージ（初期値: ''）
}
```

**機能:**
- メンバー名入力フィールド
- デフォルト配布比率入力フィールド（初期値100）
- 追加ボタン
- バリデーション:
  - 名前が空でないこと
  - 比率が正の数であること
- 追加成功後にフォームをリセット

#### SubgroupManagementPage

サブグループの登録、編集、削除を行うページ。

**機能:**
- サブグループ一覧表示
- 新規サブグループ作成フォーム
- サブグループ編集フォーム
- サブグループ削除（確認ダイアログ付き）

#### SubgroupSelector

レシート入力時にサブグループを選択するコンポーネント。

**Props:**
```typescript
type SubgroupSelectorProps = {
  subgroups: Subgroup[]
  selectedSubgroupId: string | null
  onSelect: (subgroupId: string | null) => void
}
```

**機能:**
- 「全員で割る」「メンバーを選択」の下にサブグループ選択肢を表示
- サブグループ選択時にメンバーと比率を返す

#### UsageGuideModal

使い方ガイドを表示するモーダルコンポーネント。

**Props:**
```typescript
type UsageGuideModalProps = {
  isOpen: boolean
  onClose: () => void
}
```

**機能:**
- レシート入力、レシート編集、精算確認の手順を表示
- 閉じるボタン

### Repository拡張

#### TripRepository

```typescript
export class TripRepository {
  constructor(private kv: KVNamespace) {}
  
  // 既存メソッド
  async save(trip: Trip): Promise<void>
  async get(tripId: string): Promise<Trip | null>
  async delete(tripId: string): Promise<void>
  
  // 新規メソッド
  async list(): Promise<TripListItem[]>
}
```

**list()の実装:**
- KVの`list()`メソッドで`trip:`プレフィックスを持つすべてのキーを取得
- 各キーから旅行データを取得
- TripListItemに変換（tripId, tripName, memberCount, createdAt）
- 作成日時降順でソートして返す

## データモデル

### Member型の変更

既存のMember型に`defaultRatio`フィールドを追加：

```typescript
export type Member = {
  id: string
  name: string
  defaultRatio: number    // 新規追加（デフォルト値: 100）
  createdAt: string
}
```

**データ移行:**
既存の旅行データでdefaultRatioフィールドが存在しない場合、読み込み時に自動的に100を設定します。これにより後方互換性を保ちます。

```typescript
// Repository層での読み込み時の処理例
function normalizeMember(member: any): Member {
  return {
    ...member,
    defaultRatio: member.defaultRatio ?? 100
  }
}
```

### Subgroup型

```typescript
export type SubgroupMemberRatio = {
  memberId: string
  ratio: number
}

export type Subgroup = {
  id: string
  name: string
  memberRatios: SubgroupMemberRatio[]
  createdAt: string
  updatedAt: string
}
```

### Trip型の変更

既存のTrip型に`subgroups`フィールドを追加：

```typescript
export type Trip = {
  tripId: string
  tripName: string
  version: number
  createdAt: string
  updatedAt: string
  members: Member[]       // Member型が拡張される
  receipts: Receipt[]
  subgroups: Subgroup[]   // 新規追加（デフォルト値: []）
}
```

**データ移行:**
既存の旅行データでsubgroupsフィールドが存在しない場合、読み込み時に自動的に空配列を設定します。

```typescript
// Repository層での読み込み時の処理例
function normalizeTrip(trip: any): Trip {
  return {
    ...trip,
    subgroups: trip.subgroups ?? [],
    members: trip.members.map(normalizeMember)
  }
}
```

### TripListItem型

```typescript
export type TripListItem = {
  tripId: string
  tripName: string
  memberCount: number
  createdAt: string
}
```

### KVストレージ構造

#### 旅行データ: `trip:{tripId}`

```json
{
  "tripId": "trip_20260308_abc123",
  "tripName": "伊豆旅行",
  "version": 1,
  "createdAt": "2026-03-08T10:00:00.000Z",
  "updatedAt": "2026-03-08T10:00:00.000Z",
  "members": [
    {
      "id": "m1",
      "name": "太郎",
      "defaultRatio": 100,
      "createdAt": "2026-03-08T10:00:00.000Z"
    }
  ],
  "receipts": [],
  "subgroups": [
    {
      "id": "sg1",
      "name": "男性グループ",
      "memberRatios": [
        { "memberId": "m1", "ratio": 100 },
        { "memberId": "m2", "ratio": 100 }
      ],
      "createdAt": "2026-03-08T11:00:00.000Z",
      "updatedAt": "2026-03-08T11:00:00.000Z"
    }
  ]
}
```

旅行一覧を取得する際は、KVの`list({ prefix: 'trip:' })`メソッドを使用してすべての旅行キーを取得し、各旅行データを取得します。

## 正確性プロパティ


プロパティとは、システムのすべての有効な実行において真であるべき特性または動作です。本質的には、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証の橋渡しとなります。

### プロパティ1: 旅行リスト表示の完全性

*For any* 旅行リスト、表示される各旅行には旅行名、作成日時、メンバー数が含まれている必要があります。

**検証: 要件 1.2**

### プロパティ2: 旅行リストへのリンク提供

*For any* 旅行リスト、表示される各旅行には旅行ページへのリンクが含まれている必要があります。

**検証: 要件 1.3**

### プロパティ3: 旅行リストのソート順序

*For any* 旅行リスト、旅行は作成日時の降順で並べられている必要があります。

**検証: 要件 1.5**

### プロパティ4: 削除ボタンの提供

*For any* 旅行リスト、表示される各旅行には削除ボタンが含まれている必要があります。

**検証: 要件 2.1**

### プロパティ5: 旅行削除のラウンドトリップ

*For any* 旅行、旅行を作成してストレージに保存し、その後削除した場合、ストレージから旅行が削除されている必要があります。

**検証: 要件 2.3**

### プロパティ6: 配布比率のバリデーション

*For any* 入力された配布比率（メンバーのデフォルト配布比率またはサブグループの配布比率）、それが正の数である場合のみ受け入れられる必要があります。

**検証: 要件 3.3, 10.1, 10.4**

### プロパティ7: メンバーデータのラウンドトリップ

*For any* メンバー（デフォルト配布比率を含む）、メンバーを作成してストレージに保存し、その後取得した場合、取得したデータは元のデータと一致する必要があります。

**検証: 要件 3.4, 9.1**

### プロパティ8: デフォルト配布比率の事前入力

*For any* メンバーリスト、レシート入力時の比率配分画面で、各メンバーの比率入力フィールドはそのメンバーのデフォルト配布比率で事前入力されている必要があります。

**検証: 要件 3.5**

### プロパティ9: サブグループデータのラウンドトリップ

*For any* サブグループ、サブグループを作成してストレージに保存し、その後取得した場合、取得したデータは元のデータと一致する必要があります。

**検証: 要件 4.6, 9.2**

### プロパティ10: サブグループリスト表示の完全性

*For any* サブグループリスト、旅行に登録されたすべてのサブグループが表示される必要があります。

**検証: 要件 4.7**

### プロパティ11: サブグループ編集の永続化

*For any* サブグループ、サブグループを編集して保存した場合、取得したデータは編集後のデータと一致する必要があります。

**検証: 要件 5.2**

### プロパティ12: サブグループ削除の完了

*For any* サブグループ、サブグループを削除した場合、旅行データからそのサブグループが削除されている必要があります。

**検証: 要件 5.5**

### プロパティ13: サブグループ選択肢の表示

*For any* サブグループリスト、割り振り対象選択画面で、すべてのサブグループが選択肢として表示される必要があります。

**検証: 要件 6.1**

### プロパティ14: サブグループメンバーの表示

*For any* サブグループ、サブグループを選択した場合、そのサブグループのすべてのメンバーがチェックボックス付きで表示される必要があります。

**検証: 要件 6.2**

### プロパティ15: サブグループメンバーの事前選択

*For any* サブグループ、サブグループを選択した場合、そのサブグループのすべてのメンバーがデフォルトで事前選択されている必要があります。

**検証: 要件 6.3**

### プロパティ16: サブグループ配布比率の事前入力

*For any* サブグループ、サブグループを選択して比率配分に進んだ場合、各メンバーの比率入力フィールドはサブグループに設定されたデフォルト配布比率で事前入力されている必要があります。

**検証: 要件 6.4**

### プロパティ17: 旅行データのラウンドトリップ

*For any* 旅行（メンバー、サブグループを含む）、旅行を作成してストレージに保存し、アプリケーションをリロードして取得した場合、取得したデータは元のデータと一致する必要があります。

**検証: 要件 9.3, 9.4**

### プロパティ18: エラーメッセージの表示

*For any* 無効なデータ入力、システムは検証失敗を示す明確なエラーメッセージを表示する必要があります。

**検証: 要件 10.5**

## エラーハンドリング

### API エラー

すべてのAPIエラーは以下の形式で返されます：

```typescript
type ApiErrorResponse = {
  error: string              // エラーメッセージ
  code: string               // エラーコード
  details?: Record<string, unknown>  // 追加の詳細情報（オプション）
}
```

**エラーコード:**
- **旅行が見つからない**: 404エラー、code: 'TRIP_NOT_FOUND'
- **バリデーションエラー**: 400エラー、code: 'VALIDATION_ERROR'、details: { field: string, message: string }
- **サーバーエラー**: 500エラー、code: 'INTERNAL_ERROR'
- **権限エラー**: 403エラー、code: 'FORBIDDEN'

### フロントエンドエラー

- **ネットワークエラー**: トースト通知でエラーメッセージを表示
- **バリデーションエラー**: フォームフィールドの下にエラーメッセージを表示
- **削除確認**: 確認ダイアログで誤削除を防止

### データ整合性

- **バージョン管理**: Trip型のversionフィールドを使用して楽観的ロックを実装
- **トランザクション**: KV操作は原子的に実行されるため、部分的な更新は発生しない

## テスト戦略

### ユニットテスト

以下の具体的なケースとエッジケースをテストします：

1. **旅行一覧表示 (TripListComponent)**
   - 空のリストの表示
   - 単一の旅行の表示
   - 複数の旅行のソート順序
   - 旅行名、作成日時、メンバー数の表示
   - 旅行ページへのリンクの存在
   - 削除ボタンの存在

2. **旅行削除 (TripListComponent)**
   - 削除確認ダイアログの表示
   - 削除成功時のリスト更新
   - 削除失敗時のエラー表示
   - 削除キャンセル時の動作

3. **メンバー入力 (MemberInputComponent)**
   - 初期値100の表示
   - 正の数のバリデーション
   - 負の数とゼロの拒否
   - 名前が空の場合のエラー
   - 追加成功後のフォームリセット
   - 小数点を含む比率の受け入れ

4. **デフォルト配布比率の事前入力 (RatioInput)**
   - メンバーのdefaultRatioで初期化
   - 手動変更が可能
   - 複数メンバーの比率が正しく設定される

5. **サブグループ管理 (SubgroupManagementPage)**
   - 名前なしでの作成拒否
   - メンバーなしでの作成拒否
   - 編集と削除の動作
   - サブグループ一覧の表示
   - メンバー比率のバリデーション

6. **サブグループ選択 (SubgroupSelector)**
   - サブグループ選択肢の表示
   - サブグループ選択時のメンバー表示
   - メンバーの事前選択
   - 比率の事前入力

7. **使い方ガイド (UsageGuideModal)**
   - モーダルの開閉
   - ガイド内容の表示
   - 閉じるボタンの動作

8. **UI改善**
   - 管理ページリンクの非表示（TripPage、ReceiptInputPage等）

9. **データ永続化 (TripRepository)**
   - 旅行の保存と取得
   - 旅行の削除
   - 旅行一覧の取得
   - データ移行（defaultRatio、subgroupsのデフォルト値）

10. **エラーハンドリング**
    - APIエラーのトースト表示
    - バリデーションエラーのフォーム表示
    - ネットワークエラーの処理

### プロパティベーステスト

プロパティベーステストライブラリとして**fast-check**（TypeScript/JavaScript用）を使用します。各テストは最低100回の反復で実行します。

各プロパティテストには、以下の形式でコメントを付けます：
```typescript
// Feature: trip-management-enhancements, Property 1: 旅行リスト表示の完全性
```

1. **プロパティ1**: ランダムな旅行リストを生成し、表示される各旅行に旅行名、作成日時、メンバー数が含まれることを確認
2. **プロパティ2**: ランダムな旅行リストを生成し、表示される各旅行に旅行ページへのリンクが含まれることを確認
3. **プロパティ3**: ランダムな旅行リストを生成し、作成日時の降順でソートされることを確認
4. **プロパティ4**: ランダムな旅行リストを生成し、表示される各旅行に削除ボタンが含まれることを確認
5. **プロパティ5**: ランダムな旅行を生成し、作成→削除のラウンドトリップで削除されることを確認
6. **プロパティ6**: ランダムな数値を生成し、正の数のみが受け入れられることを確認
7. **プロパティ7**: ランダムなメンバー（デフォルト配布比率を含む）を生成し、保存→取得のラウンドトリップでデータが一致することを確認
8. **プロパティ8**: ランダムなメンバーリストを生成し、比率入力がデフォルト配布比率で事前入力されることを確認
9. **プロパティ9**: ランダムなサブグループを生成し、保存→取得のラウンドトリップでデータが一致することを確認
10. **プロパティ10**: ランダムなサブグループリストを生成し、すべてのサブグループが表示されることを確認
11. **プロパティ11**: ランダムなサブグループを生成し、編集→保存→取得のラウンドトリップでデータが一致することを確認
12. **プロパティ12**: ランダムなサブグループを生成し、削除後に旅行データから削除されることを確認
13. **プロパティ13**: ランダムなサブグループリストを生成し、すべてのサブグループが選択肢として表示されることを確認
14. **プロパティ14**: ランダムなサブグループを生成し、選択時にすべてのメンバーがチェックボックス付きで表示されることを確認
15. **プロパティ15**: ランダムなサブグループを生成し、選択時にすべてのメンバーが事前選択されることを確認
16. **プロパティ16**: ランダムなサブグループを生成し、比率入力がサブグループのデフォルト配布比率で事前入力されることを確認
17. **プロパティ17**: ランダムな旅行（メンバー、サブグループを含む）を生成し、保存→リロード→取得のラウンドトリップでデータが一致することを確認
18. **プロパティ18**: ランダムな無効データを生成し、エラーメッセージが表示されることを確認

### テストの補完性

- **ユニットテスト**: 具体的な例、エッジケース、エラー条件を検証
- **プロパティテスト**: すべての入力にわたる普遍的なプロパティを検証
- 両方を組み合わせることで、包括的なカバレッジを実現（ユニットテストは具体的なバグを捕捉し、プロパティテストは一般的な正確性を検証）
