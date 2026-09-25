import { describe, expect, it } from 'vitest'
import { getCategoryLabel, getPriorityLabel, getStatusLabel } from './labels'

describe('Vietnamese ticket labels', () => {
  it('translates internal status values for display', () => {
    expect((['New', 'Investigating', 'Waiting', 'Resolved', 'Closed'] as const).map(getStatusLabel)).toEqual([
      'Mới',
      'Đang kiểm tra',
      'Đang chờ',
      'Đã xử lý',
      'Đã đóng',
    ])
  })

  it('translates internal priority values for display', () => {
    expect((['Low', 'Medium', 'High', 'Critical'] as const).map(getPriorityLabel)).toEqual([
      'Thấp',
      'Trung bình',
      'Cao',
      'Khẩn cấp',
    ])
  })

  it('translates category labels and keeps technical product names', () => {
    expect(getCategoryLabel('Clover / Payment')).toBe('Clover / Thanh toán')
    expect(getCategoryLabel('Nail360 / POS')).toBe('Nail360 / POS')
    expect(getCategoryLabel('Printer / Hardware')).toBe('Máy in / Phần cứng')
  })
})
