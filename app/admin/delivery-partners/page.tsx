'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaPen, FaTrashCan, FaMotorcycle, FaMagnifyingGlass, FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { DeliveryPartnerResponseDTO, CreateDeliveryPartnerRequestDTO, UpdateDeliveryPartnerRequestDTO } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

export default function AdminDeliveryPartnersPage() {
  const [partners, setPartners] = useState<DeliveryPartnerResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const size = 10
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<DeliveryPartnerResponseDTO | null>(null)

  useEffect(() => {
    fetchData()
  }, [page])

  useEffect(() => {
    // Reset page on search change
    setPage(0)
    const timeout = setTimeout(fetchData, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiClient.getAdminDeliveryPartners(searchTerm, page, size)
      setPartners(res.data.data.content || [])
      setTotalPages(res.data.data.totalPages || 1)
      setTotalElements(res.data.data.totalElements || 0)
    } catch (error) {
      console.error('Failed to fetch delivery partners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      if (editingPartner) {
        const data: UpdateDeliveryPartnerRequestDTO = {
          name: formData.get('name') as string,
          phone: formData.get('phone') as string,
          vehicleNo: formData.get('vehicleNo') as string,
        }
        await apiClient.updateAdminDeliveryPartner(editingPartner.id, data)
      } else {
        const data: CreateDeliveryPartnerRequestDTO = {
          name: formData.get('name') as string,
          phone: formData.get('phone') as string,
          vehicleNo: formData.get('vehicleNo') as string,
          isActive: formData.get('isActive') === 'on'
        }
        await apiClient.createAdminDeliveryPartner(data)
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to save partner:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery partner?')) return
    try {
      await apiClient.deleteAdminDeliveryPartner(id)
      fetchData()
    } catch (error) {
      console.error('Failed to delete partner:', error)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await apiClient.toggleAdminDeliveryPartnerStatus(id)
      fetchData()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const openAddModal = () => {
    setEditingPartner(null)
    setIsModalOpen(true)
  }

  const openEditModal = (partner: DeliveryPartnerResponseDTO) => {
    setEditingPartner(partner)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Delivery Partners</h1>
          <p className="text-muted-foreground mt-1">Manage your hyperlocal delivery boys and fleet.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          <FaPlus size={14} />
          <span>Add Partner</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-border">
        <div className="flex-1 relative">
          <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-10 pr-4 py-2 outline-none text-sm font-medium"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading && partners.length === 0 ? (
          <div className="p-12 flex justify-center">
            <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : partners.length === 0 ? (
          <div className="p-12 text-center">
            <div className="size-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
              <FaMotorcycle size={24} />
            </div>
            <h3 className="text-lg font-bold">No Partners Found</h3>
            <p className="text-muted-foreground text-sm">Add your first delivery partner to start assigning orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground">Name</th>
                  <th className="p-4 font-semibold text-muted-foreground">Phone</th>
                  <th className="p-4 font-semibold text-muted-foreground">Vehicle No</th>
                  <th className="p-4 font-semibold text-muted-foreground">Status</th>
                  <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {partners.map(partner => (
                  <tr key={partner.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-bold">{partner.name}</td>
                    <td className="p-4 text-muted-foreground">{partner.phone}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md font-mono text-xs border border-border">
                        {partner.vehicleNo}
                      </span>
                    </td>
                    <td className="p-4">
                      <Switch 
                        checked={partner.isActive} 
                        onCheckedChange={() => handleToggleStatus(partner.id)} 
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(partner)}
                          className="size-8 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                        >
                          <FaPen size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(partner.id)}
                          className="size-8 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <FaTrashCan size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="size-8 flex items-center justify-center rounded-lg border border-border disabled:opacity-50"
              >
                <FaChevronLeft size={12} />
              </button>
              <button 
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                className="size-8 flex items-center justify-center rounded-lg border border-border disabled:opacity-50"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Edit Delivery Partner' : 'Add New Partner'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Full Name</label>
              <input 
                name="name" 
                defaultValue={editingPartner?.name} 
                required 
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors"
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Phone Number</label>
              <input 
                name="phone" 
                defaultValue={editingPartner?.phone} 
                required 
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors"
                placeholder="e.g. 9876543210"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Vehicle Number</label>
              <input 
                name="vehicleNo" 
                defaultValue={editingPartner?.vehicleNo} 
                required 
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors uppercase"
                placeholder="e.g. DL-12-AB-3456"
              />
            </div>
            
            {!editingPartner && (
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border">
                <div>
                  <h4 className="text-sm font-bold">Active Status</h4>
                  <p className="text-xs text-muted-foreground">Can receive new orders immediately</p>
                </div>
                <Switch name="isActive" defaultChecked={true} />
              </div>
            )}
            
            <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
              {editingPartner ? 'Save Changes' : 'Add Partner'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
