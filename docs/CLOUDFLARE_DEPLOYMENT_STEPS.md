# Cloudflare Pages デプロイ手順

このドキュメントは、SpliTripアプリケーションをCloudflare Pagesにデプロイするための詳細な手順を説明します。

## 前提条件

- ✅ GitHubリポジトリにコードがプッシュされていること
- ✅ Cloudflareアカウントが作成されていること
- ✅ KVネームスペースが作成されていること（ID: 75ccea0ca72a4c838bdffee5c0797631）

## デプロイ手順

### ステップ1: Cloudflare Pagesプロジェクトの作成

1. **Cloudflare Dashboardにアクセス**
   - ブラウザで https://dash.cloudflare.com/ を開く
   - Cloudflareアカウントにログイン

2. **Pagesプロジェクトの作成を開始**
   - 左サイドバーから「Workers & Pages」をクリック
   - 「Create application」ボタンをクリック
   - 「Pages」タブを選択
   - 「Connect to Git」をクリック

3. **GitHubアカウントの接続**
   - 「GitHub」を選択
   - GitHubの認証画面が表示されたら、ログイン
   - Cloudflareにリポジトリへのアクセスを許可

4. **リポジトリの選択**
   - リポジトリ一覧から「hhhhiguchiiiidev/SpliTrip」を選択
   - 「Begin setup」ボタンをクリック

### ステップ2: ビルド設定の構成

プロジェクト設定画面で以下の情報を入力します：

1. **基本設定**
   - **Project name**: `splitrip`
   - **Production branch**: `main`

2. **ビルド設定**
   - **Framework preset**: None（または「None」を選択）
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

3. **デプロイの開始**
   - 「Save and Deploy」ボタンをクリック
   - 初回ビルドが開始されます（数分かかる場合があります）

### ステップ3: 環境変数の設定

ビルドが完了したら、環境変数を設定します：

1. **環境変数ページへ移動**
   - プロジェクトダッシュボードで「Settings」タブをクリック
   - 左サイドバーから「Environment variables」を選択

2. **NODE_VERSIONの追加**
   - 「Add variable」ボタンをクリック
   - **Variable name**: `NODE_VERSION`
   - **Value**: `18`
   - **Environment**: Production（本番環境）にチェック
   - 「Save」ボタンをクリック

### ステップ4: KVバインディングの設定

KVネームスペースをPages Functionsにバインドします：

1. **Functions設定ページへ移動**
   - プロジェクトダッシュボードで「Settings」タブをクリック
   - 左サイドバーから「Functions」を選択

2. **KVバインディングの追加**
   - 「KV namespace bindings」セクションまでスクロール
   - 「Add binding」ボタンをクリック
   - **Variable name**: `TRIPS_KV`
   - **KV namespace**: ドロップダウンから既存のKVネームスペースを選択
     - ID: `75ccea0ca72a4c838bdffee5c0797631` のネームスペースを選択
   - 「Save」ボタンをクリック

3. **再デプロイ**
   - 設定変更後、自動的に再デプロイが開始されます
   - または、「Deployments」タブから「Retry deployment」をクリック

### ステップ5: デプロイの確認とテスト

1. **デプロイ状況の確認**
   - 「Deployments」タブをクリック
   - 最新のデプロイが「Success」ステータスになっていることを確認

2. **アプリケーションへのアクセス**
   - デプロイ成功後、提供されたURLをクリック
   - 例: `https://splitrip.pages.dev`
   - または、カスタムドメインを設定している場合はそのURLにアクセス

3. **機能テスト**
   以下の機能が正常に動作することを確認します：

   a. **旅行の作成**
      - 管理ページ（`/admin`）にアクセス
      - 旅行名を入力（例: "テスト旅行"）
      - メンバーを追加（例: "太郎", "花子", "次郎"）
      - 「旅行を作成」ボタンをクリック
      - 旅行URLが表示されることを確認

   b. **レシートの入力**
      - 旅行URLにアクセス
      - 「レシート入力」をクリック
      - 合計金額、用途、支払い者を入力
      - 割り対象と配分方法を選択
      - レシートが保存されることを確認

   c. **精算サマリーの確認**
      - 「精算確認」をクリック
      - メンバー別の立替合計、負担合計、差額が表示されることを確認
      - 差額の合計がゼロになっていることを確認

   d. **データの永続化確認**
      - ブラウザをリロード
      - 入力したデータが保持されていることを確認
      - 別のブラウザやデバイスから同じURLにアクセス
      - データが正しく表示されることを確認

## トラブルシューティング

### ビルドエラーが発生する場合

1. **ビルドログの確認**
   - 「Deployments」タブで失敗したデプロイをクリック
   - ビルドログを確認してエラーメッセージを特定

2. **よくあるエラーと対処法**
   - **Node.jsバージョンエラー**: 環境変数`NODE_VERSION`が正しく設定されているか確認
   - **依存関係エラー**: `package.json`と`package-lock.json`が最新か確認
   - **ビルドコマンドエラー**: ローカルで`npm run build`が成功するか確認

### KVバインディングエラーが発生する場合

1. **バインディング設定の確認**
   - Variable nameが`TRIPS_KV`であることを確認
   - 正しいKVネームスペースが選択されているか確認

2. **KVネームスペースの確認**
   - 「Workers & Pages」→「KV」でネームスペースが存在するか確認
   - ネームスペースIDが`75ccea0ca72a4c838bdffee5c0797631`であることを確認

### データが保存されない場合

1. **ブラウザのコンソールを確認**
   - F12キーを押して開発者ツールを開く
   - Consoleタブでエラーメッセージを確認

2. **APIエンドポイントの確認**
   - Network タブでAPI呼び出しを確認
   - `/api/trips`へのPOST/GET/PUTリクエストが成功しているか確認

3. **KVストレージの確認**
   - Cloudflare Dashboardで「Workers & Pages」→「KV」を開く
   - 該当のKVネームスペースを選択
   - `trip:`で始まるキーが作成されているか確認

## デプロイ完了

すべてのテストが成功したら、デプロイは完了です！

次のステップ：
- カスタムドメインの設定（オプション）
- アクセス解析の設定（オプション）
- 本番環境での運用開始

## 参考リンク

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers KV ドキュメント](https://developers.cloudflare.com/kv/)
- [Cloudflare Pages Functions ドキュメント](https://developers.cloudflare.com/pages/functions/)
