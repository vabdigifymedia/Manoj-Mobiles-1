'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaFilter, FaUser, FaArrowLeft, FaMagnifyingGlass } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import { UserResponseDTO } from '@/lib/types'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<UserResponseDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await apiClient.getUsers(0, 100)
        // FaFilter only customers
        setCustomers(res.data.data.content.filter(u => u.role === 'CUSTOMER'))
      } catch (err) {
        // Handle error gracefully
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  return (
    <>
      <Link href="/admin" className="mb-6 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <FaArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage customer profiles</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative flex-1">
            <FaMagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search customers..." className="w-full sm:w-64 rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <button className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">
            <FaFilter size={16} /> Filter
          </button>
        </div>
      </div>
      
      <div className="mt-8 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No customers found.</td>
                </tr>
              ) : customers.map(customer => (
                <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-full bg-primary/10 font-bold text-primary">
                        {customer.name ? customer.name.charAt(0).toUpperCase() : <FaUser size={16} />}
                      </div>
                      <div>
                        <p className="font-bold">{customer.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">ID: {customer.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{customer.email}</p>
                    <p className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                      month: 'short', year: 'numeric', day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                      customer.status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                      'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!loading && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4 text-sm text-muted-foreground">
            <span>Showing {customers.length} entries</span>
            <div className="flex gap-2">
              <button className="rounded-lg border border-border px-3 py-1 font-semibold disabled:opacity-50" disabled>Previous</button>
              <button className="rounded-lg border border-border px-3 py-1 font-semibold disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
