# SpliTrip 詳細設計書
Target: Kiro AI Coding Agent

---

# 1. 概要

## 1.1 アプリ名
**SpliTrip**

## 1.2 目的
旅行やイベント時の立替精算を、スマホから簡単に記録・確認できる軽量Webアプリを提供する。

## 1.3 解決したい課題
既存の割り勘アプリでは以下が弱い。

- レシート単位で対象者を柔軟に選びたい
- 子供や一部参加者に対して比率で調整したい
- 金額指定で直接配分したい
- 誰が誰に払うかの最適化までは不要
- 認証や複雑な運用なしでURL共有だけで使いたい

## 1.4 コンセプト

- 小規模・短期利用
- URL共有型
- 認証なし
- 旅行単位で単一JSONを軽量DBとする
- 同時更新は厳密には扱わない
- スマホ最適化
- 機能を絞る

---

# 2. スコープ

## 2.1 MVPに含む

- 管理ページ
- 旅行作成
- メンバー登録
- 旅行URL発行
- レシート入力
- レシート修正
- 精算確認
- 精算詳細確認
- JSON保存
- 旅行単位データ管理

## 2.2 スコープ外

- 認証
- 権限管理
- 誰が誰に払うかの最適化
- 支払い完了ステータス
- LINE連携
- レシートOCR
- リアルタイム同期保証
- 厳密な競合解決
- 通知機能

---

# 3. システム構成


GitHub Repository
├─ Frontend source
├─ Cloudflare Pages Functions
└─ Config files

Cloudflare Pages
├─ Static frontend hosting
├─ Functions API
└─ Workers KV binding

Workers KV
└─ trip:{tripId} => Trip JSON


---

# 4. 技術スタック

## Frontend

- React
- TypeScript
- Vite

## Hosting

- Cloudflare Pages

## API

- Cloudflare Pages Functions

## Storage

- Cloudflare Workers KV

保存形式


key: trip:{tripId}
value: JSON


---

# 5. URL設計

## 管理ページ


/admin


## 旅行ページ


/trip/:tripId


## レシート入力


/trip/:tripId/receipt/new


## レシート修正一覧


/trip/:tripId/receipts


## レシート編集


/trip/:tripId/receipt/:receiptId/edit


## 精算確認


/trip/:tripId/summary


## 精算詳細


/trip/:tripId/summary/:memberId


---

# 6. ユーザーストーリー

## 管理者

- 管理者は旅行を作成したい
- 管理者はメンバーを登録したい
- 管理者は旅行URLを共有したい

## メンバー

- メンバーは認証なしでアクセスしたい
- メンバーは立替入力をしたい
- メンバーは割り対象を選びたい
- メンバーは配分方法を選びたい
- メンバーは精算状況を見たい

## グループ

- 精算合計は必ずゼロ
- 誰が誰に払うかはアプリで管理しない

---

# 7. 画面設計

---

## 管理ページ `/admin`

### UI

- 旅行一覧
- 新規旅行作成
- メンバー登録
- 旅行URL表示

### 新規旅行作成

入力

- 旅行名

出力


tripId


URL


/trip/{tripId}


---

## 旅行トップ `/trip/:tripId`

### メニュー

- レシート入力
- レシート修正
- 精算確認

---

# 8. レシート入力フロー

## Step1

入力

- 合計金額
- 用途（任意）
- 支払い者

支払い者

- 登録メンバーから選択

---

## Step2

割り対象

- 全員割
- メンバー選定

メンバー選定

- メンバー一覧表示
- 複数選択

---

## Step3

配分方法

- 一律割
- 比率配分
- 金額指定配分

---

# 9. 配分仕様

## 一律割


amount / 人数


---

## 比率配分

入力


％


デフォルト


100%


例


A 100
B 100
C 50


分母


250


30000円


A 12000
B 12000
C 6000


計算


share = total * (ratio / ratioSum)


---

## 金額指定配分

入力


member amount


条件


sum(amounts) == totalAmount


不一致


登録不可


---

# 10. レシート修正


/trip/:tripId/receipts


一覧

- 用途
- 金額
- 支払い者
- 編集

編集は入力フローと同じ。

---

# 11. 精算確認


/trip/:tripId/summary


表示

- メンバー
- 立替合計
- 負担合計
- 差額

差額


受取

支払


条件


sum(balance) = 0


---

# 12. 精算詳細


/trip/:tripId/summary/:memberId


表示

立替一覧


用途
金額


負担一覧


用途
金額


---

# 13. データモデル

## Trip


type Trip = {
tripId: string
tripName: string
version: number
createdAt: string
updatedAt: string
members: Member[]
receipts: Receipt[]
}


---

## Member


type Member = {
id: string
name: string
createdAt: string
}


---

## Receipt


type Receipt = {
id: string
title?: string
amount: number
payerId: string
targetMode: "all" | "selected"
splitMode: "equal" | "ratio" | "fixed"
selectedMemberIds: string[]
ratioInputs?: SplitRatioInput[]
fixedInputs?: SplitFixedInput[]
splits: SplitResult[]
createdAt: string
updatedAt: string
}


---

## SplitRatioInput


type SplitRatioInput = {
memberId: string
ratio: number
}


---

## SplitFixedInput


type SplitFixedInput = {
memberId: string
amount: number
}


---

## SplitResult


type SplitResult = {
memberId: string
amount: number
}


---

# 14. JSON例


{
"tripId": "trip_20260308_abc123",
"tripName": "伊豆旅行",
"version": 3,
"members": [
{"id":"m1","name":"山田"},
{"id":"m2","name":"鈴木"},
{"id":"m3","name":"田中"}
],
"receipts":[
{
"id":"r1",
"title":"スーパー買い出し",
"amount":30000,
"payerId":"m1",
"splitMode":"ratio",
"splits":[
{"memberId":"m1","amount":12000},
{"memberId":"m2","amount":12000},
{"memberId":"m3","amount":6000}
]
}
]
}


---

# 15. API

## 作成


POST /api/trips


## 取得


GET /api/trips/:tripId


## 保存


PUT /api/trips/:tripId


保存方式


Trip JSON丸ごと更新


---

# 16. 同時更新ポリシー

- 同時更新は稀
- 厳密競合制御なし
- JSON破損だけ防ぐ
- version保持

---

# 17. ディレクトリ構成


splitrip
├ src
│ ├ pages
│ ├ components
│ ├ types
│ ├ utils
│ └ api
├ functions
│ └ api
│ └ trips
├ public
├ package.json
├ vite.config.ts
└ wrangler.toml


---

# 18. 計算ロジック

## 一律割


splitEvenly(total, members)


## 比率


splitByRatio(total, ratios)


## 金額指定


splitByFixed(total, fixed)


---

# 19. 精算計算


balance = paidTotal - owedTotal


条件


sum(balance) = 0


---

# 20. UX方針

対象


ITリテラシー低いユーザー


UI

- スマホ最適
- 操作少ない
- エラー明確

---

# 21. 完成条件

以下が実装されたら MVP 完了

- 旅行作成
- メンバー登録
- URL共有
- レシート入力
- レシート修正
- 精算確認
- 精算詳細
- 合計ゼロ成立
- 誰が誰に払うか管理しない

---

# END