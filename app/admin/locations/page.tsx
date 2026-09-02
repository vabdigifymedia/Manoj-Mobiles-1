'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaPen, FaTrashCan, FaCity, FaLocationDot, FaMagnifyingGlass } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { CityResponseDTO, PincodeResponseDTO, CreateCityRequestDTO, CreatePincodeRequestDTO } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

export default function AdminLocationsPage() {
  const [activeTab, setActiveTab] = useState<'cities' | 'pincodes'>('cities')
  
  // Data State
  const [cities, setCities] = useState<CityResponseDTO[]>([])
  const [pincodes, setPincodes] = useState<PincodeResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal States
  const [isCityModalOpen, setIsCityModalOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<CityResponseDTO | null>(null)
  
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false)
  const [editingPincode, setEditingPincode] = useState<PincodeResponseDTO | null>(null)
  
  // Search
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [citiesRes, pincodesRes] = await Promise.all([
        apiClient.getAdminCities(),
        apiClient.getAdminPincodes()
      ])
      setCities(citiesRes.data.data)
      setPincodes(pincodesRes.data.data)
    } catch (error) {
      console.error('Failed to fetch delivery zones:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- City Handlers ---
  const handleSaveCity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: CreateCityRequestDTO = {
      name: formData.get('name') as string,
      state: formData.get('state') as string,
      isActive: formData.get('isActive') === 'on'
    }

    try {
      if (editingCity) {
        await apiClient.updateAdminCity(editingCity.id, data)
      } else {
        await apiClient.createAdminCity(data)
      }
      setIsCityModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save city')
    }
  }

  const handleDeleteCity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this city? (Will fail if pincodes are attached)')) return
    try {
      await apiClient.deleteAdminCity(id)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete city')
    }
  }

  // --- Pincode Handlers ---
  const handleSavePincode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: CreatePincodeRequestDTO = {
      pincode: formData.get('pincode') as string,
      cityId: formData.get('cityId') as string,
      estimatedDeliveryDays: parseInt(formData.get('estimatedDeliveryDays') as string, 10),
      codAvailable: formData.get('codAvailable') === 'on',
      isActive: formData.get('isActive') === 'on'
    }

    try {
      if (editingPincode) {
        await apiClient.updateAdminPincode(editingPincode.id, data)
      } else {
        await apiClient.createAdminPincode(data)
      }
      setIsPincodeModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save pincode')
    }
  }

  const handleDeletePincode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pincode?')) return
    try {
      await apiClient.deleteAdminPincode(id)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete pincode')
    }
  }

  const filteredCities = cities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.state.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredPincodes = pincodes.filter(p => p.pincode.includes(searchTerm) || p.cityName.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black">Delivery Zones</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage serviceable cities and pincodes.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:border-primary"
            />
          </div>
          <button 
            onClick={() => {
              if (activeTab === 'cities') {
                setEditingCity(null); setIsCityModalOpen(true)
              } else {
                setEditingPincode(null); setIsPincodeModalOpen(true)
              }
            }}
            className="flex shrink-0 items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-all"
          >
            <FaPlus size={14} /> Add {activeTab === 'cities' ? 'City' : 'Pincode'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-2xl w-fit mb-6 border border-border">
        {[
          { id: 'cities', label: 'Cities', icon: FaCity },
          { id: 'pincodes', label: 'Pincodes', icon: FaLocationDot }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSearchTerm('') }}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="deliveryTab" className="absolute inset-0 bg-card rounded-xl shadow-sm border border-border" />
            )}
            <span className="relative z-10 flex items-center gap-2"><tab.icon size={14} /> {tab.label}</span>
          </button>
        ))}
      </div>

      {/* Data Views */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading data...</div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'cities' && (
              <motion.div key="cities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-bold">City & State</th>
                        <th className="px-6 py-4 font-bold">Pincodes</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredCities.length === 0 ? (
                        <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No cities found.</td></tr>
                      ) : filteredCities.map(city => (
                        <tr key={city.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-foreground">{city.name}</div>
                            <div className="text-xs text-muted-foreground">{city.state}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-primary/10 text-primary font-bold px-2 py-1 rounded-md text-xs">{city.totalPincodesCount || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${city.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                              {city.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => { setEditingCity(city); setIsCityModalOpen(true) }} className="p-2 text-primary hover:bg-primary/10 rounded-lg mr-2"><FaPen size={14} /></button>
                            <button onClick={() => handleDeleteCity(city.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><FaTrashCan size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'pincodes' && (
              <motion.div key="pincodes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-bold">Pincode</th>
                        <th className="px-6 py-4 font-bold">City</th>
                        <th className="px-6 py-4 font-bold">Delivery Days</th>
                        <th className="px-6 py-4 font-bold">Options</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPincodes.length === 0 ? (
                        <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No pincodes found.</td></tr>
                      ) : filteredPincodes.map(pin => (
                        <tr key={pin.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-black text-primary tracking-widest">{pin.pincode}</td>
                          <td className="px-6 py-4 font-semibold">{pin.cityName}, {pin.state}</td>
                          <td className="px-6 py-4">{pin.estimatedDeliveryDays} Days</td>
                          <td className="px-6 py-4">
                            {pin.codAvailable ? <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded-md text-xs font-bold">COD Available</span> : <span className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-bold">Prepaid Only</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${pin.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                              {pin.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => { setEditingPincode(pin); setIsPincodeModalOpen(true) }} className="p-2 text-primary hover:bg-primary/10 rounded-lg mr-2"><FaPen size={14} /></button>
                            <button onClick={() => handleDeletePincode(pin.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><FaTrashCan size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* City Modal */}
      <Dialog open={isCityModalOpen} onOpenChange={setIsCityModalOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black">{editingCity ? 'Edit City' : 'Add New City'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCity} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">City Name</label>
              <input type="text" name="name" defaultValue={editingCity?.name} required className="w-full mt-1.5 px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">State</label>
              <input type="text" name="state" defaultValue={editingCity?.state} required className="w-full mt-1.5 px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary" />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
              <div>
                <p className="text-sm font-bold">Active Status</p>
                <p className="text-xs text-muted-foreground">If disabled, all pincodes in this city become unserviceable.</p>
              </div>
              <Switch name="isActive" defaultChecked={editingCity ? editingCity.isActive : true} />
            </div>
            <button type="submit" className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl mt-2 hover:bg-primary/90 transition-all active:scale-95">
              {editingCity ? 'Save Changes' : 'Create City'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pincode Modal */}
      <Dialog open={isPincodeModalOpen} onOpenChange={setIsPincodeModalOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black">{editingPincode ? 'Edit Pincode' : 'Add New Pincode'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePincode} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Pincode</label>
                <input type="text" name="pincode" defaultValue={editingPincode?.pincode} pattern="[0-9]{6}" required title="6 digit pincode" className="w-full mt-1.5 px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">City</label>
                <select name="cityId" defaultValue={editingPincode?.cityId} required className="w-full mt-1.5 px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary">
                  <option value="">Select City...</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Estimated Delivery Days</label>
              <input type="number" min="1" name="estimatedDeliveryDays" defaultValue={editingPincode?.estimatedDeliveryDays || 2} required className="w-full mt-1.5 px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary" />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
              <div>
                <p className="text-sm font-bold">COD Available</p>
                <p className="text-xs text-muted-foreground">Allow Cash on Delivery for this pincode.</p>
              </div>
              <Switch name="codAvailable" defaultChecked={editingPincode ? editingPincode.codAvailable : true} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
              <div>
                <p className="text-sm font-bold">Active Status</p>
                <p className="text-xs text-muted-foreground">Enable or disable delivery temporarily.</p>
              </div>
              <Switch name="isActive" defaultChecked={editingPincode ? editingPincode.isActive : true} />
            </div>
            <button type="submit" className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl mt-2 hover:bg-primary/90 transition-all active:scale-95">
              {editingPincode ? 'Save Changes' : 'Create Pincode'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
