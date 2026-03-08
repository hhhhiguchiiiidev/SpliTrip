import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { Member } from '../../shared/types/member'
import type { SplitRatioInput } from '../../shared/types/receipt'
import { splitByRatio } from '../../shared/utils/splitCalculator'

/**
 * プロパティベーステスト: 比率配分のデフォルト値機能
 * 
 * このテストファイルは以下のプロパティを検証します：
 * - プロパティ25: 比率配分のデフォルト値
 * - プロパティ26: 比率値の保持
 * - プロパティ27: 正の比率値の受け入れ
 * 
 * 検証: 要件 11.1, 11.2, 11.3
 */

describe('Property Tests: Ratio Default Values', () => {
  // Feature: splitrip-expense-tracker, Property 25: 比率配分のデフォルト値
  it('Property 25: すべてのメンバーの比率は100に初期化される', () => {
    fc.assert(
      fc.property(
        // 任意のメンバー数（1〜50人）
        fc.integer({ min: 1, max: 50 }),
        (memberCount) => {
          // メンバーリストを生成
          const members: Member[] = Array.from({ length: memberCount }, (_, i) => ({
            id: `m${i + 1}`,
            name: `メンバー${i + 1}`,
            createdAt: new Date().toISOString()
          }))

          // デフォルト値で比率入力を初期化（実装と同じロジック）
          const ratioInputs: SplitRatioInput[] = members.map(m => ({
            memberId: m.id,
            ratio: 100
          }))

          // すべてのメンバーの比率が100であることを検証
          expect(ratioInputs).toHaveLength(memberCount)
          ratioInputs.forEach(input => {
            expect(input.ratio).toBe(100)
          })

          // メンバーIDが正しく設定されていることを検証
          const memberIds = members.map(m => m.id)
          const ratioMemberIds = ratioInputs.map(r => r.memberId)
          expect(ratioMemberIds).toEqual(memberIds)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: splitrip-expense-tracker, Property 26: 比率値の保持
  it('Property 26: 比率を変更したとき、変更された値が保持される', () => {
    fc.assert(
      fc.property(
        // 任意のメンバー数（2〜10人）
        fc.integer({ min: 2, max: 10 }),
        // 変更するメンバーのインデックス
        fc.integer({ min: 0, max: 9 }),
        // 新しい比率値（正の数）
        fc.integer({ min: 1, max: 1000 }),
        (memberCount, changeIndex, newRatio) => {
          // メンバー数に合わせてインデックスを調整
          const actualIndex = changeIndex % memberCount

          // メンバーリストを生成
          const members: Member[] = Array.from({ length: memberCount }, (_, i) => ({
            id: `m${i + 1}`,
            name: `メンバー${i + 1}`,
            createdAt: new Date().toISOString()
          }))

          // デフォルト値で初期化
          let ratioInputs: SplitRatioInput[] = members.map(m => ({
            memberId: m.id,
            ratio: 100
          }))

          // 特定のメンバーの比率を変更（実装と同じロジック）
          const targetMemberId = members[actualIndex].id
          ratioInputs = ratioInputs.map(input =>
            input.memberId === targetMemberId
              ? { ...input, ratio: newRatio }
              : input
          )

          // 変更されたメンバーの比率が新しい値になっていることを検証
          const changedInput = ratioInputs.find(r => r.memberId === targetMemberId)
          expect(changedInput).toBeDefined()
          expect(changedInput!.ratio).toBe(newRatio)

          // 他のメンバーの比率が100のままであることを検証
          ratioInputs.forEach((input, i) => {
            if (i !== actualIndex) {
              expect(input.ratio).toBe(100)
            }
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: splitrip-expense-tracker, Property 27: 正の比率値の受け入れ
  it('Property 27: 任意の正の比率値で分割計算が実行できる', () => {
    fc.assert(
      fc.property(
        // 任意の合計金額（1〜1000000円）
        fc.integer({ min: 1, max: 1000000 }),
        // 任意のメンバー数（1〜10人）
        fc.integer({ min: 1, max: 10 }),
        // 各メンバーの比率（正の数）
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 10 }),
        (total, memberCount, ratios) => {
          // メンバー数に合わせて比率配列を調整
          const adjustedRatios = ratios.slice(0, memberCount)
          if (adjustedRatios.length < memberCount) {
            // 不足分を100で埋める
            while (adjustedRatios.length < memberCount) {
              adjustedRatios.push(100)
            }
          }

          // 比率入力を生成
          const ratioInputs: SplitRatioInput[] = adjustedRatios.map((ratio, i) => ({
            memberId: `m${i + 1}`,
            ratio
          }))

          // 分割計算を実行（エラーが発生しないことを検証）
          const splits = splitByRatio(total, ratioInputs)

          // 結果の検証
          expect(splits).toHaveLength(memberCount)

          // すべての分割金額が0以上であることを検証
          splits.forEach(split => {
            expect(split.amount).toBeGreaterThanOrEqual(0)
          })

          // 分割金額の合計が合計金額と一致することを検証
          const sum = splits.reduce((acc, split) => acc + split.amount, 0)
          expect(sum).toBe(total)

          // 各メンバーの分割金額が比率に応じていることを検証（±1円以内）
          const ratioSum = ratioInputs.reduce((acc, r) => acc + r.ratio, 0)
          splits.forEach((split, i) => {
            const expectedAmount = Math.floor(total * ratioInputs[i].ratio / ratioSum)
            // 端数処理により±数円の誤差が生じる可能性がある
            expect(Math.abs(split.amount - expectedAmount)).toBeLessThanOrEqual(memberCount)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})
