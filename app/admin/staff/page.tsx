'use client'

import { useEffect, useState } from 'react'
import { FaShield, FaUserPlus, FaEllipsis, FaTrashCan, FaMagnifyingGlass, FaTruckFast, FaPlus } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import { UserResponseDTO, CreateStaffRequestDTO } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminStaffPage() {
  const [users, setUsers] = useState<UserResponseDTO[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateStaffRequestDTO>({
    name: '', email: '', phone: '', password: '', role: 'ADMIN'
  })
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadUsers = async () => {
    try {
      setPageLoading(true)
      const res = await apiClient.getUsers(0, 100)
      const staffMembers = res.data.data.content.filter(u => u.role !== 'CUSTOMER')
      setUsers(staffMembers)
    } catch {
      setError('Failed to load users')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiClient.createStaff(form)
      setForm({ name: '', email: '', phone: '', password: '', role: 'ADMIN' })
      setShowForm(false)
      loadUsers()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to create staff')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteUser(id)
      setDeleteConfirm(null)
      loadUsers()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to delete user')
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400"><FaShield size={12} /> Admin</span>
      case 'DELIVERY_AGENT': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400"><FaTruckFast size={12} /> Delivery Agent</span>
      default: return <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400">{role}</span>
    }
  }

  const getStatusBadge = (status: string) => {
    return status === 'ACTIVE'
      ? <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Active</span>
      : <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400">Blocked</span>
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Staff Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create & manage Admins and Delivery Agents</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative flex-1">
            <FaMagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search users..." className="w-full sm:w-64 rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <button onClick={() => setShowForm(true)} className="flex shrink-0 whitespace-nowrap items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
            <FaPlus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Create Staff Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2"><FaUserPlus size={20} /> Create New Staff</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Full Name</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Ramesh Kumar" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Email</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Phone (10 digits)</label>
                <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} pattern="[0-9]{10}" className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="9876543210" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Password</label>
                <input required type="password" minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Role</label>
                <Select value={form.role} onValueChange={val => setForm({...form, role: val as CreateStaffRequestDTO['role']})}>
                  <SelectTrigger className="w-full h-10 rounded-xl border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="DELIVERY_AGENT">Delivery Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold border border-border rounded-xl hover:bg-muted/50 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors">
                {loading ? 'Creating...' : 'Create Staff'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-500">Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Are you sure you want to delete this user? This action cannot be undone.</p>
          <DialogFooter>
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-bold border border-border rounded-xl">Cancel</button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-500 text-white font-bold px-6 py-2 rounded-xl hover:bg-red-600">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No users found.</td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-bold">{u.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.phone}</td>
                  <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                  <td className="px-6 py-4">{getStatusBadge(u.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setDeleteConfirm(u.id)} className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete User">
                      <FaTrashCan size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
