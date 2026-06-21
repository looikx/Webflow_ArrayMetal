import { describe, it, expect } from 'vitest'
import { parsePart, generatePartNumber } from '@/lib/part-number'

describe('parsePart', () => {
  it('parses AML100 straight', () => {
    const result = parsePart('AML100-ST-100-1.5-2.4-G')
    expect(result).toMatchObject({
      series: 'AML100',
      productType: 'ST',
      widthMm: 100,
      heightMm: 100,
      thicknessMm: 1.5,
      lengthM: 2.4,
      radiusMm: null,
      gradeCode: 'G',
      categoryId: 'HDG_CABLE_LADDER',
      blockPrefix: '113',
    })
  })

  it('parses AML100 elbow with radius', () => {
    const result = parsePart('AML100-E90-100-1.5-R300-G')
    expect(result).toMatchObject({
      series: 'AML100',
      productType: 'E90',
      widthMm: 100,
      thicknessMm: 1.5,
      lengthM: null,
      radiusMm: 300,
      gradeCode: 'G',
    })
  })

  it('parses AML150 straight', () => {
    const result = parsePart('AML150-ST-300-2-6-G')
    expect(result).toMatchObject({
      series: 'AML150',
      productType: 'ST',
      widthMm: 300,
      heightMm: 150,
      thicknessMm: 2,
      lengthM: 6,
      blockPrefix: '115',
    })
  })

  it('parses APO100 straight (SS316)', () => {
    const result = parsePart('APO100-ST-300-1.5-2.4-A4')
    expect(result).toMatchObject({
      series: 'APO100',
      productType: 'ST',
      widthMm: 300,
      thicknessMm: 1.5,
      lengthM: 2.4,
      gradeCode: 'A4',
      categoryId: 'SS316_CABLE_LADDER',
      blockPrefix: '122',
    })
  })

  it('parses APO125 elbow with radius', () => {
    const result = parsePart('APO125-E90-150-1.5-R300-A4')
    expect(result).toMatchObject({
      series: 'APO125',
      productType: 'E90',
      widthMm: 150,
      thicknessMm: 1.5,
      radiusMm: 300,
      lengthM: null,
    })
  })

  it('returns null for unknown series', () => {
    expect(parsePart('ZZZ100-ST-100-1.5-2.4-G')).toBeNull()
  })

  it('returns null for too-short input', () => {
    expect(parsePart('AML100-ST')).toBeNull()
  })
})

describe('generatePartNumber', () => {
  it('generates AML straight part number', () => {
    const parsed = parsePart('AML100-ST-100-1.5-2.4-G')!
    expect(generatePartNumber(parsed)).toBe('AML100-ST-100-1.5-2.4-G')
  })

  it('generates AML elbow part number', () => {
    const parsed = parsePart('AML100-E90-100-1.5-R300-G')!
    expect(generatePartNumber(parsed)).toBe('AML100-E90-100-1.5-R300-G')
  })

  it('round-trips: parsePart(generatePartNumber(parsed)) deep-equals parsed', () => {
    const originals = [
      'AML100-ST-100-1.5-2.4-G',
      'AML125-E90-200-2-R450-G',
      'AML150-OR90-300-1.5-R600-G',
      'APO100-ST-300-1.5-2.4-A4',
      'APO125-E90-150-1.5-R300-A4',
    ]
    for (const pn of originals) {
      const parsed = parsePart(pn)!
      expect(parsePart(generatePartNumber(parsed))).toEqual(parsed)
    }
  })
})
