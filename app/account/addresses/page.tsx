'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { AddressResponseDTO } from '@/lib/types'
import { FaMapLocationDot, FaPlus, FaPen, FaTrashCan } from 'react-icons/fa6'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/components/store-provider'

export default function AddressesPage() {
  const { showToast } = useStore()
  const [addresses, setAddresses] = useState<AddressResponseDTO[]>([])
  const [loading, setLoading] = useState(true)

  // Add/Edit Address Form State
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [label, setLabel] = useState('Home')
  const [addressLine, setAddressLine] = useState('')
  const [pincode, setPincode] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [checkingPincode, setCheckingPincode] = useState(false)
  const [pincodeError, setPincodeError] = useState('')

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = () => {
    apiClient.getUserAddresses(0, 50)
      .then(res => setAddresses(res.data.data.content || []))
      .finally(() => setLoading(false))
  }

  // Pincode Validator
  useEffect(() => {
    if (pincode.length === 6) {
      setCheckingPincode(true)
      setPincodeError('')
      apiClient.checkPincode(pincode)
        .then(res => {
          const data = res.data.data
          if (data.cityName && data.state) {
            setCity(data.cityName)
            setState(data.state)
          } else {
            setPincodeError('No delivery to this Pincode')
          }
        })
        .catch(() => setPincodeError('Invalid Pincode'))
        .finally(() => setCheckingPincode(false))
    }
  }, [pincode])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressLine || !city || !state || !pincode) return
    setSaving(true)
    try {
      if (editingId) {
        await apiClient.updateAddress(editingId, {
          label, addressLine, city, state, pincode,
          isDefault: addresses.find(a => a.id === editingId)?.isDefault || false
        })
        showToast({ message: 'Address updated successfully', type: 'success' })
      } else {
        await apiClient.createAddress({
          label, addressLine, city, state, pincode,
          isDefault: addresses.length === 0
        })
        showToast({ message: 'Address added successfully', type: 'success' })
      }
      setShowForm(false)
      fetchAddresses()
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Failed to save address', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (addr: AddressResponseDTO) => {
    setEditingId(addr.id)
    setLabel(addr.label)
    setAddressLine(addr.addressLine)
    setCity(addr.city)
    setState(addr.state)
    setPincode(addr.pincode)
    setShowForm(true)
  }

  const handleAddNew = () => {
    setEditingId(null)
    setLabel('Home')
    setAddressLine('')
    setCity('')
    setState('')
    setPincode('')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      await apiClient.deleteAddress(id)
      setAddresses(prev => prev.filter(a => a.id !== id))
      showToast({ message: 'Address deleted', type: 'info' })
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Delete failed', type: 'error' })
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Saved Addresses</h2>
          <p className="text-muted-foreground mt-1">Manage your delivery locations</p>
        </div>
        <button onClick={handleAddNew} className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold hover:bg-primary/90 transition-colors">
          <FaPlus size={14} /> Add New
        </button>
      </div>

      <button onClick={handleAddNew} className="w-full md:hidden flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors">
        <FaPlus size={14} /> Add New Address
      </button>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-border">
          <div className="size-20 rounded-full bg-emerald-50 dark:bg-zinc-800 flex items-center justify-center text-emerald-300 dark:text-emerald-900 mb-4">
            <FaMapLocationDot size={32} />
          </div>
          <h3 className="text-xl font-bold">No saved addresses</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">Add a delivery address to checkout faster.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div key={addr.id} className={`rounded-3xl border p-6 transition-all shadow-sm ${addr.isDefault ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-border bg-white dark:bg-zinc-900'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-black tracking-wide bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs">{addr.label}</span>
                {addr.isDefault && <span className="text-[10px] font-black text-primary tracking-wider uppercase bg-primary/10 px-2 py-1 rounded-md">Default</span>}
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 mb-6">
                {addr.addressLine}<br/>{addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => openEdit(addr)} className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                  <FaPen size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(addr.id)} className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
                  <FaTrashCan size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editingId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <input type="text" placeholder="Label (e.g. Home, Work)" value={label} onChange={e => setLabel(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none" required />
            <input type="text" placeholder="House/Street Address" value={addressLine} onChange={e => setAddressLine(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none" required />
            
            <div className="relative">
              <input type="text" maxLength={6} placeholder="Pincode (e.g. 110001)" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none" required />
              {checkingPincode && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-primary font-bold uppercase tracking-wider">Checking...</span>}
            </div>
            {pincodeError && <p className="text-xs text-rose-500 font-bold px-1">{pincodeError}</p>}
            
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none" required />
              <input type="text" placeholder="State" value={state} onChange={e => setState(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none" required />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-full hover:bg-primary/90 transition-colors">
                {saving ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
