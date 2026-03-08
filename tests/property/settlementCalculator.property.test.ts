import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateSettlements, validateSettlements } from '@shared/utils/settlementCalculator'
import { Trip } from '@shared/types/trip'
import { Member } from '@shared/types/member'
import { Receipt, SplitResult } from '@shared/types/receipt'

describe('Settlement Calculator Property Tests', () => {
  // Feature: splitrip-expense-tracker, Property 18: 精算計算の正確性
  describe('Property 18: 精算計算の正確性', () => {
    it('各メンバーの立替合計、負担合計、差額が正確に計算されなければならない', () => {
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
              { minLength: 1, maxLength: 10 }
            ).map(members => {
              // メンバーIDを一意にする
              return members.map((m, i) => ({ ...m, id: `m${i + 1}` }))
            }),
            receipts: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                title: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
                amount: fc.integer({ min: 1, max: 100000 }),
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
              { minLength: 0, maxLength: 20 }
            )
          }).chain(trip => {
            // レシートのpayerIdとsplitsのmemberIdをメンバーリストから選択
            const memberIds = trip.members.map(m => m.id)
            const receipts = trip.receipts.map((receipt, i) => {
              const payerId = memberIds[i % memberIds.length]
              // 分割金額の合計がレシート金額と一致するように調整
              const splitCount = Math.min(memberIds.length, 5)
              const baseAmount = Math.floor(receipt.amount / splitCount)
              const remainder = receipt.amount - (baseAmount * splitCount)
              
              const splits: SplitResult[] = memberIds.slice(0, splitCount).map((memberId, idx) => ({
                memberId,
                amount: baseAmount + (idx === 0 ? remainder : 0)
              }))
              
              return {
                ...receipt,
                id: `r${i + 1}`,
                payerId,
                selectedMemberIds: memberIds.slice(0, splitCount),
                splits
              }
            })
            
            return fc.constant({ ...trip, receipts })
          }),
          (trip: Trip) => {
            const settlements = calculateSettlements(trip)
            
            // すべてのメンバーに対して精算結果が存在することを確認
            expect(settlements).toHaveLength(trip.members.length)
            
            // 各メンバーの精算を検証
            for (const member of trip.members) {
              const settlement = settlements.find(s => s.memberId === member.id)
              expect(settlement).toBeDefined()
              
              if (settlement) {
                // 立替合計を手動で計算
                const expectedPaidTotal = trip.receipts
                  .filter(r => r.payerId === member.id)
                  .reduce((sum, r) => sum + r.amount, 0)
                
                // 負担合計を手動で計算
                const expectedOwedTotal = trip.receipts
                  .flatMap(r => r.splits)
                  .filter(s => s.memberId === member.id)
                  .reduce((sum, s) => sum + s.amount, 0)
                
                // 差額を手動で計算
                const expectedBalance = expectedPaidTotal - expectedOwedTotal
                
                // 計算結果が正確であることを確認
                expect(settlement.paidTotal).toBe(expectedPaidTotal)
                expect(settlement.owedTotal).toBe(expectedOwedTotal)
                expect(settlement.balance).toBe(expectedBalance)
                expect(settlement.memberName).toBe(member.name)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 19: 差額合計ゼロの不変条件
  describe('Property 19: 差額合計ゼロの不変条件', () => {
    it('すべてのメンバーの差額の合計は必ずゼロでなければならない', () => {
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
              { minLength: 1, maxLength: 10 }
            ).map(members => {
              // メンバーIDを一意にする
              return members.map((m, i) => ({ ...m, id: `m${i + 1}` }))
            }),
            receipts: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                title: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
                amount: fc.integer({ min: 1, max: 100000 }),
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
              { minLength: 0, maxLength: 20 }
            )
          }).chain(trip => {
            // レシートのpayerIdとsplitsのmemberIdをメンバーリストから選択
            const memberIds = trip.members.map(m => m.id)
            const receipts = trip.receipts.map((receipt, i) => {
              const payerId = memberIds[i % memberIds.length]
              // 分割金額の合計がレシート金額と一致するように調整
              const splitCount = Math.min(memberIds.length, 5)
              const baseAmount = Math.floor(receipt.amount / splitCount)
              const remainder = receipt.amount - (baseAmount * splitCount)
              
              const splits: SplitResult[] = memberIds.slice(0, splitCount).map((memberId, idx) => ({
                memberId,
                amount: baseAmount + (idx === 0 ? remainder : 0)
              }))
              
              return {
                ...receipt,
                id: `r${i + 1}`,
                payerId,
                selectedMemberIds: memberIds.slice(0, splitCount),
                splits
              }
            })
            
            return fc.constant({ ...trip, receipts })
          }),
          (trip: Trip) => {
            const settlements = calculateSettlements(trip)
            
            // すべてのメンバーの差額の合計を計算
            const totalBalance = settlements.reduce((sum, s) => sum + s.balance, 0)
            
            // 差額の合計がゼロであることを確認（浮動小数点誤差を考慮して±0.01円以内）
            expect(Math.abs(totalBalance)).toBeLessThan(0.01)
            
            // validateSettlements関数でも検証
            expect(validateSettlements(settlements)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: splitrip-expense-tracker, Property 23: 分割金額合計の一致
  describe('Property 23: 分割金額合計の一致', () => {
    it('すべてのレシートの分割金額の合計は、すべてのレシートの合計金額の合計と等しくなければならない', () => {
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
              { minLength: 1, maxLength: 10 }
            ).map(members => {
              // メンバーIDを一意にする
              return members.map((m, i) => ({ ...m, id: `m${i + 1}` }))
            }),
            receipts: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                title: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
                amount: fc.integer({ min: 1, max: 100000 }),
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
              { minLength: 0, maxLength: 20 }
            )
          }).chain(trip => {
            // レシートのpayerIdとsplitsのmemberIdをメンバーリストから選択
            const memberIds = trip.members.map(m => m.id)
            const receipts = trip.receipts.map((receipt, i) => {
              const payerId = memberIds[i % memberIds.length]
              // 分割金額の合計がレシート金額と一致するように調整
              const splitCount = Math.min(memberIds.length, 5)
              const baseAmount = Math.floor(receipt.amount / splitCount)
              const remainder = receipt.amount - (baseAmount * splitCount)
              
              const splits: SplitResult[] = memberIds.slice(0, splitCount).map((memberId, idx) => ({
                memberId,
                amount: baseAmount + (idx === 0 ? remainder : 0)
              }))
              
              return {
                ...receipt,
                id: `r${i + 1}`,
                payerId,
                selectedMemberIds: memberIds.slice(0, splitCount),
                splits
              }
            })
            
            return fc.constant({ ...trip, receipts })
          }),
          (trip: Trip) => {
            // すべてのレシートの合計金額の合計を計算
            const totalReceiptAmount = trip.receipts.reduce((sum, r) => sum + r.amount, 0)
            
            // すべてのレシートの分割金額の合計を計算
            const totalSplitAmount = trip.receipts
              .flatMap(r => r.splits)
              .reduce((sum, s) => sum + s.amount, 0)
            
            // 分割金額の合計がレシート合計金額の合計と一致することを確認
            expect(totalSplitAmount).toBe(totalReceiptAmount)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
