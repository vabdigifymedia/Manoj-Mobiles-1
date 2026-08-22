'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { FaArrowLeft, FaPen, FaMagnifyingGlass, FaTrashCan, FaStar, FaPlus, FaXmark, FaFilter } from 'react-icons/fa6'
import { apiClient, formatINR } from '@/lib/apiClient'
import { ProductListResponseDTO } from '@/lib/types'
import { CompanyFilter, CompanyOption } from '@/components/admin/company-filter'

const PAGE_SIZE = 20

export default function AdminProductsPage() {
  const [allProducts, setAllProducts] = useState<ProductListResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const loadProducts = async () => {
    try {
      setLoading(true)
      // Fetch products catalog with a large size to allow dynamic extraction & filtering
      const res = await apiClient.getProducts(0, 1000, true)
      if (res.data?.data?.content) {
        setAllProducts(res.data.data.content)
      } else {
        setAllProducts([])
      }
    } catch {
      // silently fail
      setAllProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Dynamically extract company counts and unique company names from actual product data
  const companyCountsMap = useMemo(() => {
    const map: Record<string, number> = {}
    allProducts.forEach(product => {
      const brand = product.brandName?.trim()
      if (brand) {
        map[brand] = (map[brand] || 0) + 1
      }
    })
    return map
  }, [allProducts])

  // Alphabetically sorted list of companies with counts
  const uniqueCompanies: CompanyOption[] = useMemo(() => {
    const names = Object.keys(companyCountsMap)
    names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    return names.map(name => ({
      name,
      count: companyCountsMap[name]
    }))
  }, [companyCountsMap])

  // Ensure selected company remains valid if products are added/deleted/edited
  useEffect(() => {
    if (selectedCompany !== 'ALL' && !uniqueCompanies.some(c => c.name === selectedCompany)) {
      setSelectedCompany('ALL')
    }
  }, [uniqueCompanies, selectedCompany])

  // Combined Search + Company Filter logic
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const brand = product.brandName?.trim() || ''
      const matchesCompany = selectedCompany === 'ALL' || brand === selectedCompany

      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        brand.toLowerCase().includes(query) ||
        (product.categoryName && product.categoryName.toLowerCase().includes(query))

      return matchesCompany && matchesSearch
    })
  }, [allProducts, selectedCompany, searchQuery])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))

  const paginatedProducts = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredProducts.slice(start, start + PAGE_SIZE)
  }, [filteredProducts, page])

  const handleCompanyChange = (company: string) => {
    setSelectedCompany(company)
    setPage(0)
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    setPage(0)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await apiClient.deleteProduct(id)
      loadProducts()
    } catch {
      alert('Failed to delete product')
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await apiClient.updateProductStatus(id, newStatus as 'ACTIVE' | 'INACTIVE')
      loadProducts()
    } catch {
      alert('Failed to update status')
    }
  }

  const isFiltered = selectedCompany !== 'ALL' || searchQuery.trim().length > 0

  return (
    <>
      <Link
        href="/admin"
        className="mb-6 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <FaArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex flex-col gap-4">
        {/* Header Title & Dynamic Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Products</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFiltered
                ? `Showing ${filteredProducts.length} of ${allProducts.length} products`
                : `Manage your store catalog (${allProducts.length} products)`}
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground whitespace-nowrap hover:bg-primary/90 transition-all shadow-sm active:scale-95 self-start sm:self-auto"
          >
            <FaPlus size={16} /> Add Product
          </Link>
        </div>

        {/* Professional Filter & Search Controls Bar */}
        <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Dynamic Company Filter Dropdown */}
              <CompanyFilter
                companies={uniqueCompanies}
                totalCount={allProducts.length}
                selectedCompany={selectedCompany}
                onSelectCompany={handleCompanyChange}
              />

              {/* Product Search Input */}
              <div className="relative flex-1 sm:w-72">
                <FaMagnifyingGlass
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search products, brands..."
                  className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-9 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    title="Clear search"
                  >
                    <FaXmark size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Clear All Filters Button if any filter active */}
            {isFiltered && (
              <button
                onClick={() => {
                  setSelectedCompany('ALL')
                  setSearchQuery('')
                  setPage(0)
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
              >
                <FaXmark size={13} /> Reset Filters
              </button>
            )}
          </div>

          {/* Active Filter Indicators */}
          {selectedCompany !== 'ALL' && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">Active Filter:</span>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                <FaFilter size={11} />
                <span>Company: {selectedCompany} ({companyCountsMap[selectedCompany] || 0})</span>
                <button
                  onClick={() => handleCompanyChange('ALL')}
                  className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                  title="Remove company filter"
                >
                  <FaXmark size={12} />
                </button>
              </div>
              <button
                onClick={() => handleCompanyChange('ALL')}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground underline transition-colors ml-1"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product List Table */}
      <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold">Brand</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Price</th>
                <th className="px-6 py-4 font-bold">Rating</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="font-semibold text-base">No products found</p>
                      <p className="text-xs text-muted-foreground">
                        {isFiltered
                          ? 'Try adjusting your company filter or search query.'
                          : 'Click "+ Add Product" to add your first product.'}
                      </p>
                      {isFiltered && (
                        <button
                          onClick={() => {
                            setSelectedCompany('ALL')
                            setSearchQuery('')
                            setPage(0)
                          }}
                          className="mt-2 text-xs font-bold text-primary hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(product => (
                  <tr key={product.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.primaryImageUrl ? (
                          <img
                            src={product.primaryImageUrl}
                            alt={product.name}
                            className="size-10 rounded-lg bg-muted object-contain p-1 border border-border"
                          />
                        ) : (
                          <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground font-semibold border border-border">
                            N/A
                          </div>
                        )}
                        <span className="font-bold text-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
                        {product.brandName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{product.categoryName}</td>
                    <td className="px-6 py-4 font-bold">{formatINR(product.startingPrice)}</td>
                    <td className="px-6 py-4">
                      {product.avgRating ? (
                        <span className="inline-flex items-center gap-1 text-sm font-bold">
                          <FaStar size={14} className="text-amber-500 fill-amber-500" />
                          {product.avgRating?.toFixed(1)}{' '}
                          <span className="text-xs text-muted-foreground font-normal">
                            ({product.totalReviews})
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No reviews</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(product.id, product.status)}
                        title="Click to toggle status"
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                          product.status === 'ACTIVE'
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/25'
                            : 'bg-gray-100 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500/25'
                        }`}
                      >
                        {product.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-blue-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FaPen size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <FaTrashCan size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border px-6 py-4 text-sm text-muted-foreground gap-3">
          <span>
            Showing {filteredProducts.length > 0 ? page * PAGE_SIZE + 1 : 0} to{' '}
            {Math.min((page + 1) * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length}{' '}
            products {isFiltered && `(Filtered from ${allProducts.length})`}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-border px-3 py-1.5 font-semibold text-xs disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-border px-3 py-1.5 font-semibold text-xs disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
