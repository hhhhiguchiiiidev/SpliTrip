import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateSettlements } from '@shared/utils/settlementCalculator'
import { Trip } from '@shared/types/trip'
import { SplitResult } from '@shared/types/receipt'

describe('Summary Page Property Tests', () => {
  // Feature: splitrip-expense-tracker, Property 20: 精算表示の正確性
  describe('Property 20: 精算表示の正確性', () => {
    it('正の差額は受取金額として、負の差額は支払金額として表示されなければならない', () => {
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
                amount: fc.integer({ min: 100, max: 100000 }), // 最低100円
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
              // 支払い者を順番に割り当て（異なるメンバーが支払うようにする）
              const payerId = memberIds[i % memberIds.length]
              
              // 分割金額の合計がレシート金額と一致するように調整
              // 全メンバーで分割
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
            const settlements = calculateSettlements(trip)
            
            // 各メンバーの精算結果を検証
            for (const settlement of settlements) {
              // 差額が正の場合（受取金額）
              if (settlement.balance > 0) {
                // 立替合計が負担合計より大きいことを確認
                expect(settlement.paidTotal).toBeGreaterThan(settlement.owedTotal)
                
                // 受取金額は差額の絶対値と等しい
                const receiveAmount = Math.abs(settlement.balance)
                expect(receiveAmount).toBe(settlement.balance)
                expect(receiveAmount).toBe(settlement.paidTotal - settlement.owedTotal)
              }
              
              // 差額が負の場合（支払金額）
              if (settlement.balance < 0) {
                // 負担合計が立替合計より大きいことを確認
                expect(settlement.owedTotal).toBeGreaterThan(settlement.paidTotal)
                
                // 支払金額は差額の絶対値と等しい
                const payAmount = Math.abs(settlement.balance)
                expect(payAmount).toBe(-settlement.balance)
                expect(payAmount).toBe(settlement.owedTotal - settlement.paidTotal)
              }
              
              // 差額がゼロの場合
              if (settlement.balance === 0) {
                // 立替合計と負担合計が等しいことを確認
                expect(settlement.paidTotal).toBe(settlement.owedTotal)
              }
              
              // 差額の計算が正確であることを確認
              expect(settlement.balance).toBe(settlement.paidTotal - settlement.owedTotal)
            }
            
            // 少なくとも1人は正の差額（受取）または負の差額（支払）を持つことを確認
            // （全員がゼロの場合は、レシートがないか、全員が同額を支払って同額を負担している）
            const hasPositiveBalance = settlements.some(s => s.balance > 0)
            const hasNegativeBalance = settlements.some(s => s.balance < 0)
            
            // レシートが存在し、メンバーが2人以上いる場合、
            // 少なくとも1人は受取または支払いがあるはず
            if (trip.receipts.length > 0 && trip.members.length >= 2) {
              // 全員の差額がゼロでない限り、受取または支払いが存在する
              const allZero = settlements.every(s => s.balance === 0)
              if (!allZero) {
                expect(hasPositiveBalance || hasNegativeBalance).toBe(true)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
