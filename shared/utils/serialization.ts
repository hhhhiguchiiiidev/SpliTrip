import { Trip } from '../types/trip'
import { Member } from '../types/member'
import { Receipt, SplitRatioInput, SplitFixedInput, SplitResult } from '../types/receipt'

/**
 * シリアライゼーション: TypeScriptオブジェクト → JSON文字列
 */
export function serializeTrip(trip: Trip): string {
  return JSON.stringify(trip)
}

/**
 * デシリアライゼーション: JSON文字列 → TypeScriptオブジェクト（型検証付き）
 */
export function deserializeTrip(json: string): Trip {
  const data = JSON.parse(json)
  return validateAndConvertTrip(data)
}

/**
 * 型検証と変換
 */
export function validateAndConvertTrip(data: any): Trip {
  // 必須フィールドの検証
  if (!data.tripId || typeof data.tripId !== 'string') {
    throw new Error('Invalid trip data: tripId is required')
  }
  if (!data.tripName || typeof data.tripName !== 'string') {
    throw new Error('Invalid trip data: tripName is required')
  }
  if (typeof data.version !== 'number') {
    throw new Error('Invalid trip data: version must be a number')
  }
  if (!data.createdAt || typeof data.createdAt !== 'string') {
    throw new Error('Invalid trip data: createdAt is required')
  }
  if (!data.updatedAt || typeof data.updatedAt !== 'string') {
    throw new Error('Invalid trip data: updatedAt is required')
  }
  if (!Array.isArray(data.members)) {
    throw new Error('Invalid trip data: members must be an array')
  }
  if (!Array.isArray(data.receipts)) {
    throw new Error('Invalid trip data: receipts must be an array')
  }
  
  // メンバーの変換と検証
  const members: Member[] = data.members.map((m: any, index: number) => {
    if (!m.id || typeof m.id !== 'string') {
      throw new Error(`Invalid member at index ${index}: id is required`)
    }
    if (!m.name || typeof m.name !== 'string') {
      throw new Error(`Invalid member at index ${index}: name is required`)
    }
    if (!m.createdAt || typeof m.createdAt !== 'string') {
      throw new Error(`Invalid member at index ${index}: createdAt is required`)
    }
    
    return {
      id: m.id,
      name: m.name,
      createdAt: m.createdAt
    }
  })
  
  // レシートの変換と検証
  const receipts: Receipt[] = data.receipts.map((r: any, index: number) => {
    if (!r.id || typeof r.id !== 'string') {
      throw new Error(`Invalid receipt at index ${index}: id is required`)
    }
    if (typeof r.amount !== 'number' || r.amount <= 0) {
      throw new Error(`Invalid receipt at index ${index}: amount must be a positive number`)
    }
    if (!r.payerId || typeof r.payerId !== 'string') {
      throw new Error(`Invalid receipt at index ${index}: payerId is required`)
    }
    if (!['all', 'selected'].includes(r.targetMode)) {
      throw new Error(`Invalid receipt at index ${index}: targetMode must be 'all' or 'selected'`)
    }
    if (!['equal', 'ratio', 'fixed'].includes(r.splitMode)) {
      throw new Error(`Invalid receipt at index ${index}: splitMode must be 'equal', 'ratio', or 'fixed'`)
    }
    if (!Array.isArray(r.selectedMemberIds)) {
      throw new Error(`Invalid receipt at index ${index}: selectedMemberIds must be an array`)
    }
    if (!Array.isArray(r.splits)) {
      throw new Error(`Invalid receipt at index ${index}: splits must be an array`)
    }
    if (!r.createdAt || typeof r.createdAt !== 'string') {
      throw new Error(`Invalid receipt at index ${index}: createdAt is required`)
    }
    if (!r.updatedAt || typeof r.updatedAt !== 'string') {
      throw new Error(`Invalid receipt at index ${index}: updatedAt is required`)
    }
    
    // 分割結果の検証
    const splits: SplitResult[] = r.splits.map((s: any, sIndex: number) => {
      if (!s.memberId || typeof s.memberId !== 'string') {
        throw new Error(`Invalid split at receipt ${index}, split ${sIndex}: memberId is required`)
      }
      if (typeof s.amount !== 'number') {
        throw new Error(`Invalid split at receipt ${index}, split ${sIndex}: amount must be a number`)
      }
      
      return {
        memberId: s.memberId,
        amount: s.amount
      }
    })
    
    // オプショナルフィールドの処理
    const ratioInputs: SplitRatioInput[] | undefined = r.ratioInputs
      ? r.ratioInputs.map((ri: any, riIndex: number) => {
          if (!ri.memberId || typeof ri.memberId !== 'string') {
            throw new Error(`Invalid ratioInput at receipt ${index}, ratioInput ${riIndex}: memberId is required`)
          }
          if (typeof ri.ratio !== 'number') {
            throw new Error(`Invalid ratioInput at receipt ${index}, ratioInput ${riIndex}: ratio must be a number`)
          }
          return {
            memberId: ri.memberId,
            ratio: ri.ratio
          }
        })
      : undefined
    
    const fixedInputs: SplitFixedInput[] | undefined = r.fixedInputs
      ? r.fixedInputs.map((fi: any, fiIndex: number) => {
          if (!fi.memberId || typeof fi.memberId !== 'string') {
            throw new Error(`Invalid fixedInput at receipt ${index}, fixedInput ${fiIndex}: memberId is required`)
          }
          if (typeof fi.amount !== 'number') {
            throw new Error(`Invalid fixedInput at receipt ${index}, fixedInput ${fiIndex}: amount must be a number`)
          }
          return {
            memberId: fi.memberId,
            amount: fi.amount
          }
        })
      : undefined
    
    return {
      id: r.id,
      title: r.title,
      amount: r.amount,
      payerId: r.payerId,
      targetMode: r.targetMode,
      splitMode: r.splitMode,
      selectedMemberIds: r.selectedMemberIds,
      ratioInputs,
      fixedInputs,
      splits,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }
  })
  
  // Tripオブジェクトの構築
  return {
    tripId: data.tripId,
    tripName: data.tripName,
    version: data.version,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    members,
    receipts
  }
}
