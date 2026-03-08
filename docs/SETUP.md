# SpliTrip - 環境セットアップ手順

## 前提条件

- Node.js 18以上
- npm または yarn
- Cloudflareアカウント
- Gitがインストールされていること

## 1. リポジトリのクローン

```bash
git clone https://github.com/hhhhiguchiiiidev/SpliTrip.git
cd SpliTrip
```

## 2. 依存関係のインストール

```bash
npm install
```

## 3. Cloudflareアカウントのセットアップ

### 3.1 Cloudflareにログイン

[Cloudflare Dashboard](https://dash.cloudflare.com/)にアクセスしてログインします。

### 3.2 Account IDの取得

1. ダッシュボードの右側にある「Account ID」をコピー
2. `.env.local`ファイルの`CLOUDFLARE_ACCOUNT_ID`に設定

### 3.3 API Tokenの生成

1. ダッシュボードで「My Profile」→「API Tokens」に移動
2. 「Create Token」をクリック
3. 「Edit Cloudflare Workers」テンプレートを選択
4. 必要な権限を設定：
   - Account: Workers KV Storage (Edit)
   - Zone: Workers Routes (Edit)
5. トークンを生成してコピー
6. `.env.local`ファイルの`CLOUDFLARE_API_TOKEN`に設定

### 3.4 KVネームスペースの作成

Wrangler CLIを使用してKVネームスペースを作成します：

```bash
# 本番用KVネームスペース
npx wrangler kv:namespace create "TRIPS_KV"

# プレビュー用KVネームスペース
npx wrangler kv:namespace create "TRIPS_KV" --preview
```

出力されたIDを以下に設定：
- `.env.local`の`TRIPS_KV_ID`と`TRIPS_KV_PREVIEW_ID`
- `wrangler.toml`の該当箇所

## 4. 環境変数の設定

`.env.example`ファイルをコピーして`.env.local`ファイルを作成します：

```bash
cp .env.example .env.local
```

`.env.local`ファイルを編集して、以下の値を設定します：

```env
# Cloudflare認証情報
CLOUDFLARE_ACCOUNT_ID=your-actual-account-id
CLOUDFLARE_API_TOKEN=your-actual-api-token

# KVネームスペースID
TRIPS_KV_ID=your-actual-kv-namespace-id
TRIPS_KV_PREVIEW_ID=your-actual-preview-kv-namespace-id

# 管理ユーザー情報（開発用）
ADMIN_EMAIL=your-email@example.com
ADMIN_NAME=Your Name
```

**注意**: `.env.local`ファイルは`.gitignore`に含まれており、Gitで管理されません。機密情報を含むため、絶対にコミットしないでください。

## 5. wrangler.tomlの設定

`wrangler.toml`ファイルを作成し、KVネームスペースIDを設定します：

```toml
name = "splitrip"
compatibility_date = "2024-01-01"

pages_build_output_dir = "dist"

[[kv_namespaces]]
binding = "TRIPS_KV"
id = "your-actual-kv-namespace-id"
preview_id = "your-actual-preview-kv-namespace-id"

[vars]
ENVIRONMENT = "production"
```

## 6. ローカル開発サーバーの起動

### フロントエンド開発サーバー（Vite）

```bash
npm run dev
```

ブラウザで http://localhost:5173 にアクセスします。

### Pages Functions開発サーバー（Wrangler）

```bash
npm run dev:functions
```

## 7. KV接続のテスト

Wrangler CLIを使用してKVへの読み書きをテストします：

```bash
# テストデータの書き込み
npx wrangler kv:key put --namespace-id=your-kv-namespace-id "test:key" "test value"

# テストデータの読み込み
npx wrangler kv:key get --namespace-id=your-kv-namespace-id "test:key"

# テストデータの削除
npx wrangler kv:key delete --namespace-id=your-kv-namespace-id "test:key"
```

## トラブルシューティング

### Wranglerの認証エラー

```bash
npx wrangler login
```

を実行してCloudflareアカウントに再ログインしてください。

### KVネームスペースが見つからない

`wrangler.toml`と`.env.local`のKVネームスペースIDが正しいか確認してください。

### ビルドエラー

依存関係を再インストールしてみてください：

```bash
rm -rf node_modules
npm install
```

## 次のステップ

環境セットアップが完了したら、[デプロイ手順](./DEPLOYMENT.md)を参照してCloudflare Pagesにデプロイしてください。
