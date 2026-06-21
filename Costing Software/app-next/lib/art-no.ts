import type { PrismaClient } from '@prisma/client'

export async function getNextArtNo(blockPrefix: string, prisma: PrismaClient): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ last_art_no: number; max_art_no: number; id: number }[]>`
      SELECT id, last_art_no, max_art_no
      FROM art_no_blocks
      WHERE block_prefix = ${blockPrefix}
      FOR UPDATE
    `

    if (rows.length === 0) throw new Error(`ART NO block not found for prefix: ${blockPrefix}`)

    const block = rows[0]
    const next = block.last_art_no + 1

    if (next > block.max_art_no) {
      throw new Error(`ART NO block exhausted for prefix: ${blockPrefix}`)
    }

    if (next >= block.max_art_no - 1000) {
      console.warn(`[art-no] WARNING: Block ${blockPrefix} is within 1000 of its limit (${next}/${block.max_art_no})`)
    }

    await tx.$executeRaw`
      UPDATE art_no_blocks SET last_art_no = ${next} WHERE id = ${block.id}
    `

    return next
  })
}

// Bulk assignment: reserve N art numbers in one transaction, returns the starting number
export async function reserveArtNoRange(
  blockPrefix: string,
  count: number,
  prisma: PrismaClient
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ last_art_no: number; max_art_no: number; id: number }[]>`
      SELECT id, last_art_no, max_art_no
      FROM art_no_blocks
      WHERE block_prefix = ${blockPrefix}
      FOR UPDATE
    `

    if (rows.length === 0) throw new Error(`ART NO block not found for prefix: ${blockPrefix}`)

    const block = rows[0]
    const firstNext = block.last_art_no + 1
    const lastNext = block.last_art_no + count

    if (lastNext > block.max_art_no) {
      throw new Error(`ART NO block has insufficient capacity for ${count} items (prefix: ${blockPrefix})`)
    }

    await tx.$executeRaw`
      UPDATE art_no_blocks SET last_art_no = ${lastNext} WHERE id = ${block.id}
    `

    return firstNext
  })
}
