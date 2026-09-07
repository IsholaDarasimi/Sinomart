import { SearchBar } from '@/components/search/SearchBar'

export function SearchPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-xl font-bold text-ink-900">Search Sinomart</h1>
      <SearchBar />
    </div>
  )
}
