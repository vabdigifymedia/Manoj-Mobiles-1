'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/lib/auth-context'
import type { UserProfileResponseDTO } from '@/lib/types'
import { useStore } from '@/components/store-provider'
import { FaUser, FaPhone, FaEnvelope } from 'react-icons/fa6'

export default function ProfilePage() {
  const { user } = useAuth()
  const { showToast } = useStore()
  const [profile, setProfile] = useState<UserProfileResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiClient.getUserProfile()
      .then(res => {
        const data = res.data.data
        setProfile(data)
        setName(data.name || '')
        setPhone(data.phone || '')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiClient.updateUserProfile({ name, phone })
      showToast({ message: 'Profile updated successfully', type: 'success' })
      setProfile(prev => prev ? { ...prev, name, phone } : null)
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Failed to update profile', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <div className="rounded-3xl border border-border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
              <div className="flex items-center gap-3 w-full rounded-2xl border border-border bg-slate-50 dark:bg-zinc-950/50 px-4 py-3 text-sm font-medium text-muted-foreground cursor-not-allowed">
                <FaEnvelope className="text-slate-400" />
                {profile?.email || (user as any)?.email || 'N/A'}
              </div>
              <p className="text-[10px] text-muted-foreground ml-1">Email cannot be changed.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <FaUser className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Enter your full name" 
                  className="w-full rounded-2xl border border-border bg-background pl-11 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <FaPhone className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="w-full rounded-2xl border border-border bg-background pl-11 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all" 
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={saving || (name === profile?.name && phone === profile?.phone)} 
                className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  )
}
