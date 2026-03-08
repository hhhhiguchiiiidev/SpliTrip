# SpliTrip - デプロイ手順

## 前提条件

- 環境セットアップが完了していること（[SETUP.md](./SETUP.md)参照）
- GitHubリポジトリが作成されていること
- Cloudflareアカウントが設定されていること

## デプロイ方法

SpliTripは以下の2つの方法でデプロイできます：

1. **自動デプロイ（推奨）**: GitHubとCloudflare Pagesを連携
2. **手動デプロイ**: Wrangler CLIを使用

## 方法1: 自動デプロイ（GitHubとの連携）

### 1.1 GitHubリポジトリへのプッシュ

```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 1.2 Cloudflare Pagesプロジェクトの作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. 「Workers & Pages」→「Create application」→「Pages」→「Connect to Git」を選択
3. GitHubアカウントを接続
4. リポジトリ「hhhhiguchiiiidev/SpliTrip」を選択
5. 「Begin setup」をクリック

### 1.3 ビルド設定の構成

以下の設定を入力します：

- **Project name**: `splitrip`
- **Production branch**: `main`
- **Build command**: `npm run build`
- **Build output directory**: `dist`

### 1.4 環境変数の設定

「Environment variables」セクションで以下を追加：

| 変数名 | 値 |
|--------|-----|
| `NODE_VERSION` | `18` |

### 1.5 KVバインディングの設定

1. プロジェクトが作成されたら、「Settings」→「Functions」に移動
2. 「KV namespace bindings」セクションで「Add binding」をクリック
3. 以下を設定：
   - **Variable name**: `TRIPS_KV`
   - **KV namespace**: 作成したKVネームスペースを選択

### 1.6 デプロイの確認

1. 「Deployments」タブで最新のデプロイを確認
2. デプロイが成功したら、提供されたURLにアクセス
3. アプリケーションが正常に動作することを確認

### 1.7 自動デプロイの動作

以降、`main`ブランチへのプッシュで自動的にデプロイされます：

```bash
git add .
git commit -m "Update feature"
git push origin main
```

## 方法2: 手動デプロイ（Wrangler CLI）

### 2.1 ビルド

```bash
npm run build
```

### 2.2 デプロイ

```bash
npx wrangler pages deploy dist
```

初回デプロイ時は、プロジェクト名を指定します：

```bash
npx wrangler pages deploy dist --project-name=splitrip
```

### 2.3 KVバインディングの設定

手動デプロイの場合も、Cloudflare Dashboardで以下を設定する必要があります：

1. 「Workers & Pages」→「splitrip」→「Settings」→「Functions」
2. 「KV namespace bindings」で`TRIPS_KV`を追加

## プレビュー環境

### ブランチベースのプレビュー

`main`以外のブランチにプッシュすると、自動的にプレビュー環境が作成されます：

```bash
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

プレビューURLは「Deployments」タブで確認できます。

### ローカルプレビュー

ローカルでビルド結果をプレビューする場合：

```bash
npm run build
npm run preview
```

## デプロイ後の確認事項

### 1. 基本動作の確認

- [ ] トップページが表示される
- [ ] 旅行を作成できる
- [ ] メンバーを追加できる
- [ ] レシートを入力できる
- [ ] 精算サマリーが表示される

### 2. KV接続の確認

- [ ] 旅行データが保存される
- [ ] 旅行URLで再アクセスできる
- [ ] データが正しく取得される

### 3. パフォーマンスの確認

- [ ] ページの読み込みが速い
- [ ] APIレスポンスが速い

## カスタムドメインの設定（オプション）

### 1. ドメインの追加

1. Cloudflare Dashboardで「Workers & Pages」→「splitrip」→「Custom domains」に移動
2. 「Set up a custom domain」をクリック
3. ドメイン名を入力（例: `splitrip.example.com`）
4. DNSレコードが自動的に設定されます

### 2. HTTPSの有効化

Cloudflareは自動的にHTTPSを有効化します。証明書の発行には数分かかる場合があります。

## ロールバック

問題が発生した場合、以前のデプロイにロールバックできます：

1. 「Deployments」タブで以前のデプロイを選択
2. 「Rollback to this deployment」をクリック

または、Gitで以前のコミットに戻してプッシュ：

```bash
git revert HEAD
git push origin main
```

## トラブルシューティング

### ビルドエラー

**症状**: デプロイ時にビルドが失敗する

**解決策**:
1. ローカルで`npm run build`を実行してエラーを確認
2. `NODE_VERSION`環境変数が正しく設定されているか確認
3. 依存関係が`package.json`に正しく記載されているか確認

### KV接続エラー

**症状**: アプリケーションがKVに接続できない

**解決策**:
1. KVバインディングが正しく設定されているか確認
2. `wrangler.toml`のKVネームスペースIDが正しいか確認
3. Cloudflare Dashboardで「Functions」→「KV namespace bindings」を確認

### 404エラー

**症状**: デプロイ後にページが見つからない

**解決策**:
1. ビルド出力ディレクトリが`dist`に設定されているか確認
2. `vite.config.ts`の設定を確認
3. デプロイログでビルド成功を確認

## モニタリング

### アクセスログの確認

Cloudflare Dashboardで「Analytics」タブからアクセス状況を確認できます。

### エラーログの確認

「Logs」タブでエラーログをリアルタイムで確認できます：

```bash
npx wrangler pages deployment tail
```

## 本番環境の最適化

### 1. キャッシュ設定

Cloudflareは自動的に静的ファイルをキャッシュします。追加の設定は不要です。

### 2. パフォーマンス監視

Cloudflare Analyticsでパフォーマンスメトリクスを確認できます。

### 3. セキュリティ

- HTTPSは自動的に有効化されます
- DDoS保護はCloudflareが提供します
- 追加のセキュリティ設定は「Security」タブで行えます

## 次のステップ

デプロイが完了したら：

1. チームメンバーにURLを共有
2. フィードバックを収集
3. 機能の改善とバグ修正を継続

問題が発生した場合は、[SETUP.md](./SETUP.md)を参照するか、Cloudflareのドキュメントを確認してください。
