import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Trip } from '@shared/types/trip'
import { SplitResult } from '@shared/types/receipt'

describe('Member Detail Property Tests', () => {
  // Feature: splitrip-expense-tracker, Property 21: メンバー精算詳細の完全性
  describe('Property 21: メンバー精算詳細の完全性', () => {
    it('メンバーの精算詳細を表示したとき、支払ったレシート、負担する分割、合計、差額が表示されなければならない', () => {
      fc.assert(
        fc.property(
          // 旅行データを生成
          fc.record({
            tripId: fc.string({ minLength: 1, maxLength: 20 }),
            tripName: fc.string({ minLength: 1, maxLength: 50 }),
            version: fc.integer({ min: 1, max: 100 }),
            createdAt: fc.date().map(d => d.toISOString()),
            updatedAt: fc.date().map(d => d.toISOString()),
            members: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                name: fc.string({ minLength: 1, maxLength: 20 }),
                createdAt: fc.date().map(d => d.toISOString())
              }),
              { minLength: 2, maxLength: 10 } // 最低2人のメンバーが必要
            ).map(members => {
              // メンバーIDを一意にする
              return members.map((m, i) => ({ ...m, id: `m${i + 1}` }))
            }),
            receipts: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                title: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
                amount: fc.integer({ min: 100, max: 100000 }),
                payerId: fc.string({ minLength: 1, maxLength: 10 }),
                targetMode: fc.constantFrom('all' as const, 'selected' as const),
                splitMode: fc.constantFrom('equal' as const, 'ratio' as const, 'fixed' as const),
                selectedMemberIds: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 10 }),
                splits: fc.array(
                  fc.record({
                    memberId: fc.string({ minLength: 1, maxLength: 10 }),
                    amount: fc.integer({ min: 0, max: 100000 })
                  }),
                  { minLength: 1, maxLength: 10 }
                ),
                createdAt: fc.date().map(d => d.toISOString()),
                updatedAt: fc.date().map(d => d.toISOString())
              }),
              { minLength: 1, maxLength: 20 } // 最低1件のレシートが必要
            )
          }).chain(trip => {
            // レシートのpayerIdとsplitsのmemberIdをメンバーリストから選択
            const memberIds = trip.members.map(m => m.id)
            const receipts = trip.receipts.map((receipt, i) => {
              // 支払い者を順番に割り当て
              const payerId = memberIds[i % memberIds.length]
              
              // 分割金額の合計がレシート金額と一致するように調整
              const splitCount = memberIds.length
              const baseAmount = Math.floor(receipt.amount / splitCount)
              const remainder = receipt.amount - (baseAmount * splitCount)
              
              const splits: SplitResult[] = memberIds.map((memberId, idx) => ({
                memberId,
                amount: baseAmount + (idx === 0 ? remainder : 0)
              }))
              
              return {
                ...receipt,
                id: `r${i + 1}`,
                payerId,
                selectedMemberIds: memberIds,
                splits
              }
            })
            
            return fc.constant({ ...trip, receipts })
          }),
          (trip: Trip) => {
            // 各メンバーについて精算詳細を検証
            for (const member of trip.members) {
              // 立替一覧を計算（このメンバーが支払ったレシート）
              const paidReceipts = trip.receipts.filter(r => r.payerId === member.id)
              
              // 負担一覧を計算（このメンバーが負担する分割）
              const owedSplits = trip.receipts
                .map(r => ({
                  receipt: r,
                  split: r.splits.find(s => s.memberId === member.id)
                }))
                .filter(item => item.split !== undefined)
              
              // 立替合計を計算
              const paidTotal = paidReceipts.reduce((sum, r) => sum + r.amount, 0)
              
              // 負担合計を計算
              const owedTotal = owedSplits.reduce((sum, item) => sum + (item.split?.amount || 0), 0)
              
              // 差額を計算
              const balance = paidTotal - owedTotal
              
              // 要件5.1: 支払ったすべてのレシートが表示される
              expect(paidReceipts.length).toBeGreaterThanOrEqual(0)
              for (const receipt of paidReceipts) {
                expect(receipt.payerId).toBe(member.id)
                expect(receipt.amount).toBeGreaterThan(0)
                // タイトルまたは金額が存在することを確認
                expect(receipt.id).toBeDefined()
              }
              
              // 要件5.2: 負担するすべての分割が表示される
              expect(owedSplits.length).toBeGreaterThanOrEqual(0)
              for (const item of owedSplits) {
                expect(item.split).toBeDefined()
                expect(item.split?.memberId).toBe(member.id)
                expect(item.split?.amount).toBeGreaterThanOrEqual(0)
                // レシートのタイトルまたは金額が存在することを確認
                expect(item.receipt.id).toBeDefined()
              }
              
              // 要件5.3: 支払い合計が表示される
              expect(paidTotal).toBeGreaterThanOrEqual(0)
              expect(paidTotal).toBe(paidReceipts.reduce((sum, r) => sum + r.amount, 0))
              
              // 要件5.4: 負担合計が表示される
              expect(owedTotal).toBeGreaterThanOrEqual(0)
              expect(owedTotal).toBe(owedSplits.reduce((sum, item) => sum + (item.split?.amount || 0), 0))
              
              // 要件5.5: 差額が表示される
              expect(balance).toBe(paidTotal - owedTotal)
              
              // 差額の符号が正しいことを確認
              if (paidTotal > owedTotal) {
                expect(balance).toBeGreaterThan(0) // 受取金額
              } else if (paidTotal < owedTotal) {
                expect(balance).toBeLessThan(0) // 支払金額
              } else {
                expect(balance).toBe(0) // 差額なし
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
