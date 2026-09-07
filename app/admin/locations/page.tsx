'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaPen, FaTrashCan, FaMagnifyingGlass, FaChevronDown, FaChevronUp, FaBoxOpen } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { CityResponseDTO, PincodeResponseDTO, CreateCityRequestDTO, CreatePincodeRequestDTO, CityCoverageRule } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdminLocationsPage() {
  const [cities, setCities] = useState<CityResponseDTO[]>([])
  const [pincodes, setPincodes] = useState<PincodeResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set())
  
  // Modals
  const [isCityModalOpen, setIsCityModalOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<CityResponseDTO | null>(null)
  
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false)
  const [editingPincode, setEditingPincode] = useState<PincodeResponseDTO | null>(null)
  const [targetCityId, setTargetCityId] = useState<string>('')
  
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
      setCities(citiesRes.data.data.content || [])
      setPincodes(pincodesRes.data.data.content || [])
    } catch (error) {
      console.error('Failed to fetch delivery zones:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers ---
  const toggleExpand = (id: string) => {
    const next = new Set(expandedCities)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedCities(next)
  }

  const handleSaveCity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: CreateCityRequestDTO = {
      name: formData.get('name') as string,
      state: formData.get('state') as string,
      coverageRule: (formData.get('coverageRule') as CityCoverageRule) || 'ALL',
      isActive: formData.get('isActive') === 'on'
    }

    try {
      if (editingCity) await apiClient.updateAdminCity(editingCity.id, data)
      else await apiClient.createAdminCity(data)
      setIsCityModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save city')
    }
  }

  const handleDeleteCity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this city?')) return
    try {
      await apiClient.deleteAdminCity(id)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete city')
    }
  }

  const handleCoverageRuleChange = async (city: CityResponseDTO, newRule: CityCoverageRule) => {
    try {
      await apiClient.updateAdminCity(city.id, {
        name: city.name,
        state: city.state,
        isActive: city.isActive,
        coverageRule: newRule
      })
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update rule')
    }
  }

  const handleSavePincode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: CreatePincodeRequestDTO = {
      pincode: formData.get('pincode') as string,
      cityId: targetCityId,
      estimatedDeliveryDays: parseInt(formData.get('estimatedDeliveryDays') as string, 10),
      codAvailable: formData.get('codAvailable') === 'on',
      isActive: formData.get('isActive') === 'on'
    }

    try {
      if (editingPincode) await apiClient.updateAdminPincode(editingPincode.id, data)
      else await apiClient.createAdminPincode(data)
      setIsPincodeModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save pincode')
    }
  }

  const handleDeletePincode = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await apiClient.deleteAdminPincode(id)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete pincode')
    }
  }

  const filteredCities = cities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.state.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black">Delivery Zones</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage serviceable cities, rules, and pincodes.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder="Search cities..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:border-primary shadow-sm"
            />
          </div>
          <button 
            onClick={() => { setEditingCity(null); setIsCityModalOpen(true) }}
            className="flex shrink-0 items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-all"
          >
            <FaPlus size={14} /> Add City
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading delivery zones...</div>
        ) : filteredCities.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
            <FaBoxOpen size={48} className="mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-xl font-bold">No Cities Found</h3>
            <p className="text-muted-foreground mt-1">Start by adding a new city to your delivery zones.</p>
          </div>
        ) : (
          filteredCities.map(city => {
            const isExpanded = expandedCities.has(city.id)
            const cityPincodes = pincodes.filter(p => p.cityId === city.id)
            
            return (
              <div key={city.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
                {/* Header / Accordion Trigger */}
                <div 
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/10 border-b border-border' : ''}`}
                  onClick={(e) => {
                    // Prevent toggle if clicking interactive elements
                    if ((e.target as HTMLElement).closest('.prevent-toggle')) return;
                    toggleExpand(city.id)
                  }}
                >
                  <div className="flex items-center gap-4">
                    <button className="text-muted-foreground p-1 rounded hover:bg-muted/50 transition-colors">
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    <div>
                      <h3 className="text-lg font-black">{city.name}</h3>
                      <p className="text-sm text-muted-foreground font-semibold">{city.state} • {cityPincodes.length} Pincodes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 prevent-toggle">
                    <Select 
                      value={city.coverageRule || 'ALL'} 
                      onValueChange={(val) => handleCoverageRuleChange(city, val as CityCoverageRule)}
                    >
                      <SelectTrigger className="w-[180px] h-9 text-xs font-bold rounded-lg border-border shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Deliver Everywhere</SelectItem>
                        <SelectItem value="INCLUDE">Include Specific Only</SelectItem>
                        <SelectItem value="EXCLUDE">Exclude Specific</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="h-6 w-px bg-border hidden sm:block" />
                    
                    <Switch 
                      checked={city.isActive} 
                      onCheckedChange={(checked) => apiClient.updateAdminCity(city.id, { ...city, isActive: checked }).then(fetchData)}
                    />
                    
                    <div className="flex gap-1 sm:ml-2">
                      <button onClick={() => { setEditingCity(city); setIsCityModalOpen(true) }} className="p-2 text-primary hover:bg-primary/10 rounded-lg"><FaPen size={14} /></button>
                      <button onClick={() => handleDeleteCity(city.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><FaTrashCan size={14} /></button>
                    </div>
                  </div>
                </div>

                {/* Expanded Pincode View */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 bg-muted/5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Managed Pincodes</h4>
                          <button 
                            onClick={() => {
                              setTargetCityId(city.id)
                              setEditingPincode(null)
                              setIsPincodeModalOpen(true)
                            }}
                            className="text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <FaPlus size={10} /> Add Pincode
                          </button>
                        </div>

                        {cityPincodes.length === 0 ? (
                          <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                            {city.coverageRule === 'INCLUDE' ? "No pincodes added. Delivery won't happen anywhere in this city." : 
                             city.coverageRule === 'EXCLUDE' ? "No pincodes excluded. Delivery will happen everywhere." : 
                             "No specific pincodes tracked. Delivery will happen everywhere."}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {cityPincodes.map(pin => (
                              <div key={pin.id} className="bg-background border border-border p-3 rounded-xl shadow-sm flex flex-col gap-2 relative group hover:border-primary/30 transition-colors">
                                <div className="flex items-start justify-between">
                                  <span className="font-black text-lg text-primary tracking-widest">{pin.pincode}</span>
                                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setTargetCityId(city.id); setEditingPincode(pin); setIsPincodeModalOpen(true) }} className="p-1.5 text-muted-foreground hover:text-primary"><FaPen size={12} /></button>
                                    <button onClick={() => handleDeletePincode(pin.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><FaTrashCan size={12} /></button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold">
                                  <span className="bg-muted px-2 py-0.5 rounded-md">{pin.estimatedDeliveryDays} Days</span>
                                  {pin.codAvailable ? <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-md">COD</span> : <span className="text-muted-foreground">Prepaid</span>}
                                  <span className={pin.isActive ? 'text-emerald-500' : 'text-destructive'}>{pin.isActive ? 'Active' : 'Disabled'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })
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
            {!editingCity && (
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Coverage Rule</label>
                <select name="coverageRule" defaultValue="ALL" className="w-full mt-1.5 px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary">
                  <option value="ALL">Deliver Everywhere</option>
                  <option value="INCLUDE">Include Specific Only</option>
                  <option value="EXCLUDE">Exclude Specific</option>
                </select>
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border mt-2">
              <div>
                <p className="text-sm font-bold">Active Status</p>
                <p className="text-xs text-muted-foreground">If disabled, all pincodes in this city become unserviceable.</p>
              </div>
              <Switch name="isActive" defaultChecked={editingCity ? editingCity.isActive : true} />
            </div>
            <button type="submit" className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl mt-4 hover:bg-primary/90 transition-all active:scale-95">
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
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Pincode</label>
              <input type="text" name="pincode" defaultValue={editingPincode?.pincode} pattern="[0-9]{6}" required title="6 digit pincode" className="w-full mt-1.5 px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary text-center tracking-[0.5em] text-lg font-mono" />
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
            <button type="submit" className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl mt-4 hover:bg-primary/90 transition-all active:scale-95">
              {editingPincode ? 'Save Changes' : 'Create Pincode'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
