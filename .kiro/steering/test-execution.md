---
inclusion: always
---

# テスト実行ガイドライン

## 重要：コンテキスト消費を最小化

Kiroでの仕様駆動開発では、コンテキスト消費が致命的な問題になります。
以下のルールを**必ず守ること**：

### 絶対に守ること

1. **watchモードを使用しない**: `vitest` コマンドは使用禁止
2. **必ず `vitest run` を使用**: テストは1回実行して終了する
3. **bail: 1 が標準設定**: 最初のエラーで即座に停止（vitest.config.tsで設定済み）
4. **正しいコマンド**:
   - ✅ `npm run test:property` (package.jsonで `vitest run` が設定済み)
   - ✅ `npm run test:integration`
   - ✅ `npx vitest run tests/unit/[ファイル名].test.tsx` (個別ファイル実行)
   - ❌ `npm run test:unit` (全ファイル実行でコンテキスト消費が大きい - 禁止)
   - ❌ `npm test` (watchモードになる)
   - ❌ `vitest` (watchモードになる)

### プロセスがブロックされた場合

もし `Waiting for file changes...` というメッセージが表示された場合：

1. **即座にエラーとして報告**
2. ユーザーに手動で `q` を押してプロセスを終了するよう依頼
3. 次回は正しいコマンドを使用

### タスク実行時

- プロパティテストを実行する際は、必ず `npm run test:property` を使用
- **ユニットテストを実行する際は、必ず個別ファイルを指定**: `npx vitest run tests/unit/[ファイル名].test.tsx`
  - 理由: `npm run test:unit` は全ファイルを実行し、大量のコンテキストを消費する
  - 複数ファイルを実行する場合も個別に指定: `npx vitest run tests/unit/File1.test.tsx tests/unit/File2.test.tsx`
- 統合テストを実行する際は、必ず `npm run test:integration` を使用

### Windows環境での文字化け対策

PowerShellで日本語が文字化けする場合、コマンドの前にエンコーディング設定を追加：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; npx vitest run tests/unit/[ファイル名].test.tsx
```

または、出力の最後の部分だけを表示してコンテキスト消費を削減：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; npx vitest run tests/unit/[ファイル名].test.tsx 2>&1 | Select-Object -Last 20
```

### テスト実行の原則

1. **最初のエラーで停止**: `bail: 1` により、最初の失敗で即座に停止
2. **1つずつ修正**: エラーを1つ修正したら再実行
3. **全テスト実行は最後**: すべての修正が完了してから全体を実行
4. **出力を最小化**: 冗長なログやエラーメッセージを抑制（vitest.config.ts、tests/setup.tsで設定済み）

### コンテキスト消費対策：テスト実行の戦略的アプローチ

**CRITICAL**: テスト実行時は以下の順序を厳守すること（コンテキスト爆発を防ぐため）：

#### ステップ1: 標準出力を抑えて全体を実行

```powershell
# 最後の20-30行のみ表示してエラーの有無を確認
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; npm run test:property 2>&1 | Select-Object -Last 30
```

#### ステップ2: エラーが見つかったら即座に停止

- エラーが1つでも見つかったら、**残りのテストを実行する前に**そのエラーを修正
- 全体実行を続けてはいけない（コンテキストを無駄に消費する）

#### ステップ3: 失敗したテストファイルを個別に実行

```powershell
# 失敗したファイルのみを個別実行してエラー詳細を確認
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; npx vitest run tests/property/[失敗したファイル].test.ts 2>&1 | Select-Object -Last 25
```

#### ステップ4: エラーを修正

- エラーの原因を特定して修正
- 修正内容を記録（他のファイルにも同じ問題がある可能性）

#### ステップ5: 修正を他のファイルに適用

- 発見した原因が他のテストファイルにも適用できる場合、**テストを再実行する前に**同じ修正を適用
- 例: 順序依存の問題、モックの問題、型の問題など

#### ステップ6: 再度全体を実行

- すべての修正を適用した後、再度標準出力を抑えて全体を実行
- エラーが残っている場合はステップ2に戻る

#### 実行例

```powershell
# ステップ1: 全体実行（出力抑制）
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; npm run test:property 2>&1 | Select-Object -Last 30

# エラー発見: subgroup.property.test.ts が失敗

# ステップ3: 個別実行
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; npx vitest run tests/property/subgroup.property.test.ts 2>&1 | Select-Object -Last 25

# ステップ4: エラー修正（例: memberRatiosの順序依存問題）

# ステップ5: 同じ問題が他のファイルにないか確認して修正

# ステップ6: 再度全体実行
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; npm run test:property 2>&1 | Select-Object -Last 30
```

#### 禁止事項

- ❌ エラーを見つけたのに全体実行を続ける
- ❌ 個別実行せずにエラーを推測で修正
- ❌ 標準出力を抑制せずに全体実行
- ❌ 修正後に個別実行だけして全体実行をスキップ

## Run All Tasks モード

「Run all tasks」実行時：

1. **途中で止まらない**: エラー以外は最後まで自動実行
2. **進捗は簡潔に**: 各タスク完了時は「✅ Task X completed」のみ
3. **質問しない**: 「Would you like to continue?」などの質問は禁止
4. **最終報告のみ詳細**: すべて完了後に1回だけサマリーを表示

## ユニットテスト作成ガイドライン

### トーストメッセージのモック化

トーストメッセージがテストに干渉するのを防ぐため、useToastを必ずモック化：

```typescript
// Mock useToast to prevent toast messages from interfering with tests
vi.mock('../../src/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    toasts: []
  })
}))
```

### エラーメッセージのテスト

トーストで表示されるエラーメッセージは直接テストせず、副作用（API呼び出しの有無など）で確認：

```typescript
// ❌ 悪い例：トーストメッセージを直接確認
expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()

// ✅ 良い例：API呼び出しが行われなかったことを確認
expect(tripApi.createTrip).not.toHaveBeenCalled()
```
## プロパティベーステスト作成ガイドライン

### fast-check Arbitrary選択

**数値生成**:
- 正の数が必要な場合: `fc.integer({ min: 1, max: N })`
- `fc.float()`は避ける（精度問題・32ビット制約違反の可能性）

**ランダム値の禁止**:
- `Math.random()`, `Math.floor()` 等は使用禁止
- すべての値はfast-checkのArbitraryから生成（再現性確保）

**一意なID生成**:
- `Date.now()`と固定文字列の組み合わせ推奨
- 例: `tripId: \`test_${Date.now()}_${uniqueStr}\``
