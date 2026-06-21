import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { SeriesDetailClient } from '@/components/series/SeriesDetailClient'

interface Props {
  params: { category: string }
}

export default async function SeriesPage({ params }: Props) {
  const { data: cat } = await supabase
    .from('product_categories')
    .select('id,displayName,finish,description')
    .eq('id', params.category)
    .single()

  if (!cat) notFound()

  const { count } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('categoryId', cat.id)
    .eq('isActive', true)

  return (
    <SeriesDetailClient
      categoryId={cat.id}
      displayName={cat.displayName}
      finish={cat.finish}
      description={cat.description ?? ''}
      skuCount={count ?? 0}
    />
  )
}
