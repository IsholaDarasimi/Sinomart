import * as React from 'react'

import {
  Search,
  X,
  ArrowUpRight,
  Package,
  Tag,
  Layers3,
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSearchSuggestions } from '@/hooks/useAccount'

export function SearchBar({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  const [query, setQuery] = React.useState('')
  const [focused, setFocused] = React.useState(false)

  const {
    data: suggestions,
    isLoading,
  } = useSearchSuggestions(query)

  const navigate = useNavigate()

  const inputRef =
    React.useRef<HTMLInputElement>(null)

  function closeSearch() {
    setQuery('')
    setFocused(false)
    onNavigate?.()
  }

  function go(term: string) {
    const cleanTerm = term.trim()

    if (!cleanTerm) return

    navigate(
      `/shop?search=${encodeURIComponent(cleanTerm)}`,
    )

    closeSearch()
  }

  function goToProduct(slug: string) {
    if (!slug) return

    navigate(`/product/${slug}`)

    closeSearch()
  }

  const trimmedQuery = query.trim()
  const hasQuery = trimmedQuery.length >= 1

  return (
    <div className="relative w-full">
      {/* Search input */}
      <div
        className={[
          'group relative flex h-11 items-center overflow-hidden rounded-xl border bg-white transition-all duration-200',
          focused
            ? 'border-brand-500 shadow-[0_0_0_3px_rgba(13,94,111,0.08),0_8px_25px_rgba(13,94,111,0.08)]'
            : 'border-brand-900/10 shadow-sm hover:border-brand-900/20',
        ].join(' ')}
      >
        <Search
          className={[
            'pointer-events-none absolute left-3.5 z-10 h-[18px] w-[18px] transition-colors duration-200',
            focused
              ? 'text-brand-500'
              : 'text-ink-500 group-hover:text-brand-500',
          ].join(' ')}
        />

        <input
          ref={inputRef}
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(
              () => setFocused(false),
              180,
            )
          }}
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              trimmedQuery
            ) {
              go(trimmedQuery)
            }

            if (e.key === 'Escape') {
              setQuery('')
              setFocused(false)
              inputRef.current?.blur()
            }
          }}
          placeholder="Search products, brands, categories..."
          className="h-full w-full bg-transparent pl-11 pr-11 text-sm font-medium text-ink-900 outline-none placeholder:text-ink-500"
          aria-label="Search products"
          aria-expanded={focused}
          aria-autocomplete="list"
        />

        {/* Clear button */}
        <AnimatePresence>
          {query && (
            <motion.button
              type="button"
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
              }}
              transition={{
                duration: 0.12,
              }}
              onMouseDown={(e) =>
                e.preventDefault()
              }
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition-all duration-150 hover:bg-brand-50 hover:text-brand-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.985,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -4,
              scale: 0.99,
            }}
            transition={{
              duration: 0.14,
              ease: 'easeOut',
            }}
            className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-2xl border border-brand-900/10 bg-white shadow-[0_20px_60px_rgba(13,94,111,0.16)]"
          >
            {!hasQuery ? (
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Search className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-ink-900">
                      Search Sinomart
                    </p>

                    <p className="mt-0.5 text-xs text-ink-500">
                      Start typing to find products,
                      brands, or categories.
                    </p>
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              /* Loading state */
              <div className="p-3">
                <div className="mb-2 px-2 py-1">
                  <div className="h-3 w-28 animate-pulse rounded bg-surface-muted" />
                </div>

                <div className="space-y-1">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl px-3 py-3"
                    >
                      <div className="h-9 w-9 animate-pulse rounded-lg bg-surface-muted" />

                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-surface-muted" />

                        <div className="h-2.5 w-1/3 animate-pulse rounded bg-surface-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : suggestions &&
              suggestions.length > 0 ? (
              /* Search results */
              <div className="p-3">
                <div className="mb-2 flex items-center justify-between px-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
                    Suggestions
                  </p>

                  <span className="text-[10px] font-medium text-ink-500">
                    {suggestions.length} result
                    {suggestions.length === 1
                      ? ''
                      : 's'}
                  </span>
                </div>

                <ul className="space-y-1">
                  {suggestions.map(
                    (suggestion) => {
                      const isProduct =
                        suggestion.suggestion_type ===
                        'product'

                      return (
                        <li
                          key={`${suggestion.suggestion_type}-${suggestion.target_id}`}
                        >
                          <button
                            type="button"
                            onMouseDown={(e) =>
                              e.preventDefault()
                            }
                            onClick={() =>
                              isProduct
                                ? goToProduct(
                                    suggestion.target_slug,
                                  )
                                : go(
                                    suggestion.label,
                                  )
                            }
                            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-brand-50"
                          >
                            {/* Type icon */}
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-brand-600 transition-all duration-150 group-hover:bg-white group-hover:text-brand-700 group-hover:shadow-sm">
                              {isProduct ? (
                                <Package className="h-4 w-4" />
                              ) : suggestion.suggestion_type ===
                                'category' ? (
                                <Layers3 className="h-4 w-4" />
                              ) : (
                                <Tag className="h-4 w-4" />
                              )}
                            </span>

                            {/* Label */}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink-900 transition-colors group-hover:text-brand-700">
                                {suggestion.label}
                              </span>

                              <span className="mt-0.5 block text-[11px] capitalize text-ink-500">
                                {
                                  suggestion.suggestion_type
                                }
                              </span>
                            </span>

                            {/* Arrow */}
                            <ArrowUpRight className="h-4 w-4 shrink-0 translate-x-[-3px] text-brand-500 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
                          </button>
                        </li>
                      )
                    },
                  )}
                </ul>

                {/* Search all */}
                <button
                  type="button"
                  onMouseDown={(e) =>
                    e.preventDefault()
                  }
                  onClick={() =>
                    go(trimmedQuery)
                  }
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-t border-brand-900/8 px-3 py-3 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <Search className="h-3.5 w-3.5" />

                  Search all for "{trimmedQuery}"

                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              /* No results */
              <div className="p-5 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-ink-500">
                  <Search className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-bold text-ink-900">
                  No suggestions found
                </p>

                <p className="mx-auto mt-1 max-w-[280px] text-xs leading-relaxed text-ink-500">
                  No matching products, brands, or
                  categories were found yet.
                </p>

                <button
                  type="button"
                  onMouseDown={(e) =>
                    e.preventDefault()
                  }
                  onClick={() =>
                    go(trimmedQuery)
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 hover:shadow-md"
                >
                  Search store

                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}