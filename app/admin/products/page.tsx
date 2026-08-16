'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Plus, Trash2, Star, Edit } from 'lucide-react'
import { apiClient, formatINR } from '@/lib/apiClient'
import { ProductListResponseDTO } from '@/lib/types'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductListResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const loadProducts = async (p: number) => {
    try {
      setLoading(true)
      const res = await apiClient.getProducts(p, 20, true)
      setProducts(res.data.data.content)
      setTotalPages(res.data.data.totalPages)
      setTotalElements(res.data.data.totalElements)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts(page) }, [page])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await apiClient.deleteProduct(id)
      loadProducts(page)
    } catch {
      alert('Failed to delete product')
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await apiClient.updateProductStatus(id, newStatus as 'ACTIVE' | 'INACTIVE')
      loadProducts(page)
    } catch {
      alert('Failed to update status')
    }
  }

  return (
    <>
      <Link href="/admin" className="mb-6 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your store catalog ({totalElements} products)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search products..." className="w-full sm:w-64 rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <Link href="/admin/products/new" className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground whitespace-nowrap hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>
      
      <div className="mt-8 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Brand</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Rating</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No products found.</td>
                </tr>
              ) : products.map(product => (
                <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.primaryImageUrl ? (
                        <img src={product.primaryImageUrl} alt={product.name} className="size-10 rounded-lg bg-muted object-contain p-1" />
                      ) : (
                        <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                      )}
                      <span className="font-bold">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold">{product.brandName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{product.categoryName}</td>
                  <td className="px-6 py-4 font-bold">{formatINR(product.startingPrice)}</td>
                  <td className="px-6 py-4">
                    {product.avgRating ? (
                      <span className="inline-flex items-center gap-1 text-sm font-bold">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        {product.avgRating?.toFixed(1)} <span className="text-xs text-muted-foreground font-normal">({product.totalReviews})</span>
                      </span>
                    ) : <span className="text-xs text-muted-foreground">No reviews</span>}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(product.id, product.status)}
                      title="Click to toggle status"
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                      product.status === 'ACTIVE' 
                        ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/25' 
                        : 'bg-gray-100 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500/25'
                    }`}>
                      {product.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${product.id}/edit`} className="text-blue-500 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Edit">
                        <Edit size={16} />
                      </Link>
                      <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between border-t border-border px-6 py-4 text-sm text-muted-foreground">
          <span>Page {page + 1} of {totalPages || 1}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border border-border px-3 py-1 font-semibold disabled:opacity-50">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="rounded-lg border border-border px-3 py-1 font-semibold disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </>
  )
}
