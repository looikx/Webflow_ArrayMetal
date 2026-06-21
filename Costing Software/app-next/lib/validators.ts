import { z } from 'zod'

export const ItemsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  categoryId: z.string().optional(),
  series: z.string().optional(),
  productType: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['partNumber', 'artNo', 'widthMm', 'unitPrice']).default('partNumber'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
  distinct: z.enum(['productType']).optional(),
  countOnly: z.coerce.boolean().optional(),
  gradeCode: z.string().optional(),
})

export const CreateItemSchema = z.object({
  partNumber: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  series: z.string().min(1),
  productType: z.string().min(1),
  widthMm: z.number().positive().nullable(),
  heightMm: z.number().positive().nullable(),
  thicknessMm: z.number().positive(),
  lengthM: z.number().positive().nullable(),
  radiusMm: z.number().positive().nullable(),
  gradeCode: z.string().min(1),
})

export const UpdatePriceSchema = z.object({
  value: z.number().finite().positive(),
})

export const RecalculateSchema = z.object({
  categoryId: z.string().min(1),
})

export const ExportSchema = z.object({
  categoryId: z.string().optional(),
  series: z.string().optional(),
  selectedIds: z.array(z.number()).optional(),
})

export const CheckPartNumberSchema = z.object({
  partNumber: z.string().min(1),
})
