import { Header } from '@/components/layout/Header'
import { ItemRegistry } from '@/components/items/ItemRegistry'

export default function ItemsPage() {
  return (
    <>
      <Header title="Item Registry" subtitle="All SKUs across all product lines" />
      <main className="flex-1 flex flex-col min-h-0">
        <ItemRegistry />
      </main>
    </>
  )
}
