# SpliTrip

旅行経費精算アプリ

## 概要

SpliTripは、旅行やイベント時の立替精算を管理する軽量Webアプリケーションです。認証なしで旅行の作成、メンバー登録、柔軟な分割オプションでのレシート記録、精算サマリーの表示が可能です。

## 主な機能

- **旅行管理**: 旅行名とメンバーを登録し、一意のURLで共有
- **レシート入力**: 合計金額、支払い者、用途を記録
- **柔軟な分割オプション**:
  - 一律割: 全員で均等に分割
  - 比率配分: パーセンテージ比率で分割
  - 金額指定配分: 各メンバーに個別の金額を指定
- **精算サマリー**: 各メンバーの立替合計、負担合計、差額を表示
- **メンバー詳細**: 個別のメンバーの立替一覧と負担一覧を確認
- **レシート編集**: 既存のレシートを修正可能
- **モバイル最適化**: スマートフォンでの使用に最適化されたUI

## 使い方

### 1. 旅行の作成

1. 管理ページ（`/admin`）にアクセス
2. 旅行名を入力
3. メンバーを追加
4. 生成された旅行URLをメンバーに共有

### 2. レシートの入力

1. 旅行ページから「レシート入力」を選択
2. 合計金額、用途、支払い者を入力
3. 割り対象を選択（全員割/メンバー選定）
4. 配分方法を選択（一律割/比率配分/金額指定配分）
5. 保存

### 3. 精算の確認

1. 旅行ページから「精算確認」を選択
2. 各メンバーの立替合計、負担合計、差額を確認
3. メンバー名をクリックして詳細を表示

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **ルーティング**: React Router v6
- **バックエンド**: Cloudflare Pages Functions
- **ストレージ**: Cloudflare Workers KV
- **テスト**: Vitest + fast-check (Property-Based Testing)

## プロジェクト構造

```
splitrip/
├── src/                    # フロントエンドソースコード
│   ├── pages/             # ページコンポーネント
│   ├── components/        # 共通コンポーネント
│   ├── api/               # APIクライアント
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── shared/                 # フロントエンドとバックエンドで共有
│   ├── types/             # 共有型定義
│   ├── utils/             # 共有ユーティリティ
│   └── repository/        # データアクセス層
├── functions/              # Cloudflare Pages Functions
│   └── api/               # APIエンドポイント
├── tests/                  # テストコード
│   ├── unit/              # ユニットテスト
│   ├── property/          # プロパティベーステスト
│   └── integration/       # 統合テスト
├── config/                 # 環境設定ファイル
├── docs/                   # ドキュメント
└── public/                 # 静的ファイル
```

## セットアップ

詳細なセットアップ手順は [docs/SETUP.md](docs/SETUP.md) を参照してください。

### 基本的なセットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. 環境変数の設定:
`.env.local` ファイルを作成し、必要な環境変数を設定してください。

3. 開発サーバーの起動:
```bash
npm run dev
```

## スクリプト

- `npm run dev` - フロントエンド開発サーバー起動
- `npm run dev:functions` - Pages Functions開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run preview` - ビルドのプレビュー
- `npm test` - すべてのテスト実行
- `npm run test:unit` - ユニットテスト実行
- `npm run test:property` - プロパティベーステスト実行
- `npm run test:integration` - 統合テスト実行

## デプロイ

デプロイ手順は [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) を参照してください。

## ライセンス

Private
