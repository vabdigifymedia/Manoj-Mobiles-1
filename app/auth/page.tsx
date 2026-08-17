'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaShieldHalved, FaArrowLeft, FaMobileScreen } from 'react-icons/fa6'
import { useStore } from '@/components/store-provider'

export default function AuthPage() {
  const router = useRouter()
  const { login } = useStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length === 10) {
      setStep(2)
    }
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length === 4) {
      // Mock success
      login()
      router.push('/')
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-100px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <Link href="/" className="mb-8 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <FaArrowLeft size={16} /> Back to store
        </Link>
        
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
                disabled={phone.length !== 10}
                className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-50 transition-opacity"
              >
                Send OTP
              </button>
            </form>
            
            <p className="mt-8 text-center text-xs text-muted-foreground">
              By proceeding, you agree to our <a href="#" className="underline hover:text-foreground">Terms</a> and <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
              <FaShieldHalved size={24} />
            </div>
            <h1 className="text-2xl font-black">Verify OTP</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a 4-digit code to <b>+91 {phone}</b>. 
              <button onClick={() => setStep(1)} className="ml-1 font-bold text-primary hover:underline">Edit</button>
            </p>
            
            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Enter OTP</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full rounded-xl border border-border bg-background py-3 px-4 text-center text-xl font-black tracking-[1em] outline-none focus:border-primary" 
                  placeholder="••••"
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                disabled={otp.length !== 4}
                className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-50 transition-opacity"
              >
                Verify & Continue
              </button>
            </form>
            
            <div className="mt-8 text-center text-sm font-semibold text-muted-foreground">
              Didn't receive code? <button className="text-primary hover:underline">Resend</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
