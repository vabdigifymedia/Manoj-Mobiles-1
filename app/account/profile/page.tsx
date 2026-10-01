'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/lib/auth-context'
import type { UserProfileResponseDTO } from '@/lib/types'
import { useStore } from '@/components/store-provider'
import { FaUser, FaPhone, FaEnvelope } from 'react-icons/fa6'
import Cookies from 'js-cookie'

export default function ProfilePage() {
  const { user } = useAuth()
  const { showToast } = useStore()
  const [profile, setProfile] = useState<UserProfileResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Pre-populate with existing auth user info if available
    const initialName = user?.name || Cookies.get('userName') || ''
    if (initialName && initialName !== 'Customer' && initialName !== 'Admin') {
      setName(initialName)
    }

    apiClient.getUserProfile()
      .then(res => {
        const data = res.data?.data
        if (data) {
          setProfile(data)
          if (data.name) setName(data.name)
          if (data.phone) setPhone(data.phone)
        }
      })
      .catch(err => {
        // Gracefully catch 404 or network errors so page doesn't crash
        console.warn('Profile not found or could not be loaded:', err?.response?.status || err?.message)
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast({ message: 'Full name is required', type: 'error' })
      return
    }
    if (!phone.trim() || phone.trim().length !== 10) {
      showToast({ message: 'Please enter a valid 10-digit phone number', type: 'error' })
      return
    }

    setSaving(true)
    try {
      const res = await apiClient.updateUserProfile({ name: name.trim(), phone: phone.trim() })
      const updated = res.data?.data
      if (updated) {
        setProfile(updated)
      } else {
        setProfile(prev => prev ? { ...prev, name: name.trim(), phone: phone.trim() } : ({ name: name.trim(), phone: phone.trim() } as any))
      }
      Cookies.set('userName', name.trim(), { expires: 7 })
      showToast({ message: 'Profile updated successfully', type: 'success' })
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Failed to update profile', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
  }

  const hasChanges = Boolean(
    name.trim().length > 0 &&
    phone.trim().length === 10 &&
    (!profile || name.trim() !== (profile.name || '') || phone.trim() !== (profile.phone || ''))
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Profile Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <div className="rounded-3xl border border-border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
              <div className="flex items-center gap-3 w-full rounded-2xl border border-border bg-slate-50 dark:bg-zinc-950/50 px-4 py-3 text-sm font-medium text-muted-foreground cursor-not-allowed">
                <FaEnvelope className="text-slate-400" />
                <span>{profile?.email || (user as any)?.email || 'N/A'}</span>
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
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="w-full rounded-2xl border border-border bg-background pl-11 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all" 
                />
              </div>
              <p className="text-[10px] text-muted-foreground ml-1">Enter your 10-digit mobile number for order updates.</p>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={saving || !hasChanges} 
                className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
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
