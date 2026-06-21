import { create } from 'zustand'

export interface PriceEntry {
  id: number
  key: string
  displayName: string
  value: number
  unit: string
  sortOrder: number
  updatedAt: string
}

interface PriceStore {
  // Material rates — keyed by finish (e.g. 'HDG')
  prices: Record<string, PriceEntry[]>
  dirtyPrices: Record<string, Record<string, number>>
  setPrices: (finish: string, prices: PriceEntry[]) => void
  setDirtyPrice: (finish: string, key: string, value: number) => void
  clearDirtyPrices: (finish: string) => void

  // Galv + markup — keyed by categoryId (e.g. 'HDG_CABLE_LADDER')
  categorySettings: Record<string, PriceEntry[]>
  dirtyCategorySettings: Record<string, Record<string, number>>
  setCategorySettings: (categoryId: string, settings: PriceEntry[]) => void
  setDirtyCategorySetting: (categoryId: string, key: string, value: number) => void
  clearDirtyCategorySettings: (categoryId: string) => void

  hasDirty: (finish: string, categoryId: string) => boolean
}

export const usePriceStore = create<PriceStore>()((set, get) => ({
  prices: {},
  dirtyPrices: {},

  setPrices: (finish, prices) =>
    set(s => ({ prices: { ...s.prices, [finish]: prices } })),

  setDirtyPrice: (finish, key, value) =>
    set(s => ({
      dirtyPrices: {
        ...s.dirtyPrices,
        [finish]: { ...(s.dirtyPrices[finish] ?? {}), [key]: value },
      },
    })),

  clearDirtyPrices: (finish) =>
    set(s => ({ dirtyPrices: { ...s.dirtyPrices, [finish]: {} } })),

  categorySettings: {},
  dirtyCategorySettings: {},

  setCategorySettings: (categoryId, settings) =>
    set(s => ({ categorySettings: { ...s.categorySettings, [categoryId]: settings } })),

  setDirtyCategorySetting: (categoryId, key, value) =>
    set(s => ({
      dirtyCategorySettings: {
        ...s.dirtyCategorySettings,
        [categoryId]: { ...(s.dirtyCategorySettings[categoryId] ?? {}), [key]: value },
      },
    })),

  clearDirtyCategorySettings: (categoryId) =>
    set(s => ({ dirtyCategorySettings: { ...s.dirtyCategorySettings, [categoryId]: {} } })),

  hasDirty: (finish, categoryId) => {
    const { dirtyPrices, dirtyCategorySettings } = get()
    return (
      Object.keys(dirtyPrices[finish] ?? {}).length > 0 ||
      Object.keys(dirtyCategorySettings[categoryId] ?? {}).length > 0
    )
  },
}))
