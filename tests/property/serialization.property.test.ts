import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { serializeTrip, deserializeTrip } from '@shared/utils/serialization'
import { Trip } from '@shared/types/trip'
import { Member } from '@shared/types/member'
import { Receipt } from '@shared/types/receipt'
import { Subgroup, SubgroupMemberRatio } from '@shared/types/subgroup'

describe('Serialization Property Tests', () => {
  // Feature: splitrip-expense-tracker, Property 3: データ永続化のラウンドトリップ
  describe('Property 3: データ永続化のラウンドトリップ', () => {
    it('任意の旅行データに対して、シリアライズ→デシリアライズで元のデータと等価なデータが得られなければならない', () => {
      // メンバージェネレータ
      const memberArbitrary = fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        defaultRatio: fc.integer({ min: 1, max: 1000 }),
        createdAt: fc.date().map(d => d.toISOString())
      }) as fc.Arbitrary<Member>

      // 分割結果ジェネレータ
      const splitResultArbitrary = fc.record({
        memberId: fc.string({ minLength: 1, maxLength: 20 }),
        amount: fc.integer({ min: 0, max: 1000000 })
      })

      // 比率入力ジェネレータ（オプショナル）
      const ratioInputArbitrary = fc.record({
        memberId: fc.string({ minLength: 1, maxLength: 20 }),
        ratio: fc.integer({ min: 1, max: 1000 })
      })

      // 金額指定入力ジェネレータ（オプショナル）
      const fixedInputArbitrary = fc.record({
        memberId: fc.string({ minLength: 1, maxLength: 20 }),
        amount: fc.integer({ min: 0, max: 1000000 })
      })

      // レシートジェネレータ
      const receiptArbitrary = fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        title: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
        amount: fc.integer({ min: 1, max: 1000000 }),
        payerId: fc.string({ minLength: 1, maxLength: 20 }),
        targetMode: fc.constantFrom('all' as const, 'selected' as const),
        splitMode: fc.constantFrom('equal' as const, 'ratio' as const, 'fixed' as const),
        selectedMemberIds: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 50 }),
        ratioInputs: fc.option(fc.array(ratioInputArbitrary, { minLength: 1, maxLength: 50 }), { nil: undefined }),
        fixedInputs: fc.option(fc.array(fixedInputArbitrary, { minLength: 1, maxLength: 50 }), { nil: undefined }),
        splits: fc.array(splitResultArbitrary, { minLength: 1, maxLength: 50 }),
        createdAt: fc.date().map(d => d.toISOString()),
        updatedAt: fc.date().map(d => d.toISOString())
      }) as fc.Arbitrary<Receipt>

      // サブグループメンバー比率ジェネレータ
      const subgroupMemberRatioArbitrary = fc.record({
        memberId: fc.string({ minLength: 1, maxLength: 20 }),
        ratio: fc.integer({ min: 1, max: 1000 })
      }) as fc.Arbitrary<SubgroupMemberRatio>

      // サブグループジェネレータ
      const subgroupArbitrary = fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        memberRatios: fc.array(subgroupMemberRatioArbitrary, { minLength: 1, maxLength: 10 }),
        createdAt: fc.date().map(d => d.toISOString()),
        updatedAt: fc.date().map(d => d.toISOString())
      }) as fc.Arbitrary<Subgroup>

      // 旅行ジェネレータ
      const tripArbitrary = fc.record({
        tripId: fc.string({ minLength: 1, maxLength: 50 }),
        tripName: fc.string({ minLength: 1, maxLength: 100 }),
        version: fc.integer({ min: 1, max: 1000 }),
        createdAt: fc.date().map(d => d.toISOString()),
        updatedAt: fc.date().map(d => d.toISOString()),
        members: fc.array(memberArbitrary, { minLength: 0, maxLength: 50 }),
        receipts: fc.array(receiptArbitrary, { minLength: 0, maxLength: 500 }),
        subgroups: fc.array(subgroupArbitrary, { minLength: 0, maxLength: 20 })
      }) as fc.Arbitrary<Trip>

      fc.assert(
        fc.property(
          tripArbitrary,
          (originalTrip) => {
            // シリアライズ
            const json = serializeTrip(originalTrip)
            
            // JSON文字列であることを確認
            expect(typeof json).toBe('string')
            
            // デシリアライズ
            const deserializedTrip = deserializeTrip(json)
            
            // 元のデータと等価であることを確認
            expect(deserializedTrip).toEqual(originalTrip)
            
            // 各フィールドの詳細な検証
            expect(deserializedTrip.tripId).toBe(originalTrip.tripId)
            expect(deserializedTrip.tripName).toBe(originalTrip.tripName)
            expect(deserializedTrip.version).toBe(originalTrip.version)
            expect(deserializedTrip.createdAt).toBe(originalTrip.createdAt)
            expect(deserializedTrip.updatedAt).toBe(originalTrip.updatedAt)
            expect(deserializedTrip.members).toHaveLength(originalTrip.members.length)
            expect(deserializedTrip.receipts).toHaveLength(originalTrip.receipts.length)
            
            // メンバーの検証
            deserializedTrip.members.forEach((member, index) => {
              expect(member.id).toBe(originalTrip.members[index].id)
              expect(member.name).toBe(originalTrip.members[index].name)
              expect(member.defaultRatio).toBe(originalTrip.members[index].defaultRatio)
              expect(member.createdAt).toBe(originalTrip.members[index].createdAt)
            })
            
            // レシートの検証
            deserializedTrip.receipts.forEach((receipt, index) => {
              const originalReceipt = originalTrip.receipts[index]
              expect(receipt.id).toBe(originalReceipt.id)
              expect(receipt.title).toBe(originalReceipt.title)
              expect(receipt.amount).toBe(originalReceipt.amount)
              expect(receipt.payerId).toBe(originalReceipt.payerId)
              expect(receipt.targetMode).toBe(originalReceipt.targetMode)
              expect(receipt.splitMode).toBe(originalReceipt.splitMode)
              expect(receipt.selectedMemberIds).toEqual(originalReceipt.selectedMemberIds)
              expect(receipt.ratioInputs).toEqual(originalReceipt.ratioInputs)
              expect(receipt.fixedInputs).toEqual(originalReceipt.fixedInputs)
              expect(receipt.splits).toEqual(originalReceipt.splits)
              expect(receipt.createdAt).toBe(originalReceipt.createdAt)
              expect(receipt.updatedAt).toBe(originalReceipt.updatedAt)
            })
            
            // サブグループの検証
            expect(deserializedTrip.subgroups).toHaveLength(originalTrip.subgroups.length)
            deserializedTrip.subgroups.forEach((subgroup, index) => {
              const originalSubgroup = originalTrip.subgroups[index]
              expect(subgroup.id).toBe(originalSubgroup.id)
              expect(subgroup.name).toBe(originalSubgroup.name)
              expect(subgroup.memberRatios).toEqual(originalSubgroup.memberRatios)
              expect(subgroup.createdAt).toBe(originalSubgroup.createdAt)
              expect(subgroup.updatedAt).toBe(originalSubgroup.updatedAt)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
