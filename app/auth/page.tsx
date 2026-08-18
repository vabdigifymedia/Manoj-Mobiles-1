'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaShieldHalved, FaArrowLeft, FaMobileScreen, FaUser } from 'react-icons/fa6'
import Cookies from 'js-cookie'
import { apiClient } from '@/lib/apiClient'
import { useStore } from '@/components/store-provider'

export default function AuthPage() {
  const router = useRouter()
  const { fetchCart } = useStore()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length !== 10) return
    setLoading(true)
    setError('')
    try {
      await apiClient.sendOtp(phone)
      setStep(2)
    } catch (err: any) {
      // Proceed to OTP verification step even if mock server accepts any OTP
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const saveAuthData = (data: any) => {
    Cookies.set('accessToken', data.token, { expires: 1 })
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 })
    if (data.userId) Cookies.set('userId', data.userId, { expires: 7 })
    Cookies.set('userName', data.name || 'Customer', { expires: 7 })
    Cookies.set('userRole', data.role || 'CUSTOMER', { expires: 7 })
    fetchCart()
    window.location.href = '/'
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 4) return
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.loginWithOtp(phone, otp)
      saveAuthData(res.data.data)
    } catch (err: any) {
      const msg = err.response?.data?.message || ''
      if (err.response?.status === 404 || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('register')) {
        setStep(3)
      } else {
        setError(msg || 'Invalid OTP. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.customerRegister(name.trim(), phone)
      saveAuthData(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-100px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <Link href="/" className="mb-8 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <FaArrowLeft size={16} /> Back to store
        </Link>
        
        {error && (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs font-bold text-destructive">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div>
            <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <FaMobileScreen size={24} />
            </div>
            <h1 className="text-2xl font-black">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter your mobile number to sign in or create a new account.</p>
            
            <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">+91</span>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full rounded-xl border border-border bg-background py-3 pl-14 pr-4 text-sm font-semibold outline-none focus:border-primary" 
                    placeholder="Enter 10-digit number"
                    autoFocus
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={phone.length !== 10 || loading}
                className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
            
            <p className="mt-8 text-center text-xs text-muted-foreground">
              By proceeding, you agree to our <a href="#" className="underline hover:text-foreground">Terms</a> and <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </div>
        ) : step === 2 ? (
          <div>
            <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
              <FaShieldHalved size={24} />
            </div>
            <h1 className="text-2xl font-black">Verify OTP</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ve sent a code to <b>+91 {phone}</b>. 
              <button onClick={() => setStep(1)} className="ml-1 font-bold text-primary hover:underline">Edit</button>
            </p>
            
            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Enter OTP</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-xl border border-border bg-background py-3 px-4 text-center text-xl font-black tracking-[0.5em] outline-none focus:border-primary" 
                  placeholder="••••"
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                disabled={otp.length < 4 || loading}
                className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
            
            <div className="mt-8 text-center text-sm font-semibold text-muted-foreground">
              Didn&apos;t receive code? <button onClick={handleSendOtp} className="text-primary hover:underline">Resend</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-blue-100 text-blue-600">
              <FaUser size={24} />
            </div>
            <h1 className="text-2xl font-black">Create Account</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please enter your full name to complete registration for <b>+91 {phone}</b>.</p>
            
            <form onSubmit={handleRegister} className="mt-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm font-semibold outline-none focus:border-primary" 
                  placeholder="e.g. Ramesh Kumar"
                  autoFocus
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={!name.trim() || loading}
                className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Creating Account...' : 'Complete Sign Up'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
