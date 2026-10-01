'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Cookies from 'js-cookie'
import { apiClient } from '@/lib/apiClient'
import { useStore } from '@/components/store-provider'
import { AppInput } from '@/components/ui/login-1'
import { FaMobileScreen, FaUser, FaArrowLeft, FaShieldHalved } from 'react-icons/fa6'

export default function AuthPage() {
  const { fetchCart } = useStore()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, resendTimer])

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    })
  }

  const handleMouseEnter = () => setIsHovering(true)
  const handleMouseLeave = () => setIsHovering(false)

  const saveAuthData = async (data: any) => {
    Cookies.set('accessToken', data.token, { expires: 1 })
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 })
    if (data.userId) Cookies.set('userId', data.userId, { expires: 7 })
    Cookies.set('userName', data.name || 'Customer', { expires: 7 })
    Cookies.set('userRole', data.role || 'CUSTOMER', { expires: 7 })
    
    await fetchCart()
    
    const target = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('redirect') || '/account'
      : '/account'
    window.location.href = target
  }

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (phone.length !== 10) return
    setLoading(true)
    setError('')
    try {
      await apiClient.sendOtp(phone)
      setStep(2)
      setResendTimer(30)
      setOtp(Array(6).fill(''))
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (otpString: string) => {
    if (otpString.length < 6) return
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.loginWithOtp(phone, otpString)
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

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
    
    const otpString = newOtp.join('')
    if (otpString.length === 6) {
      handleVerifyOtp(otpString)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
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

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6)
    if (pastedData) {
      const newOtp = [...otp]
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i]
      }
      setOtp(newOtp)
      const nextIndex = Math.min(pastedData.length, 5)
      otpInputRefs.current[nextIndex]?.focus()
      
      if (pastedData.length === 6) {
        handleVerifyOtp(pastedData)
      }
    }
  }

  return (
    <div className="h-screen w-full bg-[var(--login-color-bg)] text-[var(--login-color-text-primary)] flex overflow-hidden">
      <Link 
        href="/" 
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm font-semibold text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)] transition-colors bg-[var(--login-color-surface)]/80 p-2 pr-4 rounded-full backdrop-blur-sm border border-[var(--login-color-border)] shadow-xs"
      >
        <FaArrowLeft size={14} /> <span>Back to store</span>
      </Link>
      
      <div className="w-full flex h-full bg-[var(--login-color-surface)] relative">
        
        {/* Left Section: Mobile Number Login Form */}
        <div
          className="w-full lg:w-1/2 px-6 sm:px-12 lg:px-16 left h-full relative overflow-hidden flex flex-col justify-center max-w-xl mx-auto lg:max-w-none"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
            
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-blue-500/20 via-sky-500/20 to-indigo-500/20 rounded-full blur-3xl transition-opacity duration-300 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          />
          
          <div className="form-container sign-in-container z-10 w-full relative">
            
            {/* Error Banner */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-bold text-red-500 dark:text-red-400 text-center animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {/* STEP 1: MOBILE NUMBER ENTRY */}
            {step === 1 && (
              <form className="text-center grid gap-2 w-full animate-in fade-in zoom-in-95 duration-300" onSubmit={handleSendOtp}>
                <div className="grid gap-3 mb-2">
                  <div className="flex justify-center mb-1">
                    <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-xs">
                      <FaMobileScreen size={22} />
                    </div>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--login-color-heading)] tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-sm text-[var(--login-color-text-secondary)] font-medium">
                    Login to continue to Manoj Mobiles
                  </p>
                </div>
                
                <div className="grid gap-2 items-start mt-6 text-left">
                  <label className="text-xs font-bold text-[var(--login-color-heading)] uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <div className="relative w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--login-color-text-secondary)] z-20 select-none text-sm">
                      +91
                    </span>
                    <AppInput 
                      placeholder="Enter mobile number" 
                      type="tel" 
                      maxLength={10}
                      value={phone}
                      onChange={(e: any) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setPhone(val)
                        if (error) setError('')
                      }}
                      style={{ paddingLeft: '3.75rem' }}
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 justify-center items-center mt-6">
                  <button 
                    type="submit"
                    disabled={phone.length !== 10 || loading}
                    className="w-full group/button relative inline-flex justify-center items-center overflow-hidden rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 cursor-pointer shadow-sm"
                  >
                    <span>{loading ? 'Sending OTP...' : 'Continue'}</span>
                    {!loading && phone.length === 10 && (
                      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                        <div className="relative h-full w-8 bg-white/20" />
                      </div>
                    )}
                  </button>

                  <p className="text-xs text-[var(--login-color-text-secondary)] mt-1 font-medium">
                    We&apos;ll send you a verification OTP.
                  </p>
                </div>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 2 && (
              <div className="text-center grid gap-2 w-full animate-in slide-in-from-right-8 fade-in duration-300">
                <div className="grid gap-3 mb-2">
                  <div className="flex justify-center mb-1">
                    <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-xs">
                      <FaShieldHalved size={22} />
                    </div>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--login-color-heading)] tracking-tight">
                    Verify OTP
                  </h1>
                  <p className="text-sm text-[var(--login-color-text-secondary)] font-medium">
                    Code sent to <span className="text-[var(--login-color-heading)] font-bold">+91 {phone}</span>
                    <button 
                      onClick={() => setStep(1)} 
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold"
                    >
                      Edit
                    </button>
                  </p>
                </div>
                
                <div className="flex justify-center gap-2 md:gap-3 mt-6" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold bg-[var(--login-color-muted-surface)] border border-[var(--login-color-border)] rounded-xl outline-none focus:border-blue-600 focus:bg-[var(--login-color-bg)] transition-all text-[var(--login-color-heading)] shadow-2xs"
                    />
                  ))}
                </div>
                
                <div className="flex gap-4 justify-center items-center mt-8">
                  <button 
                    onClick={(e) => { e.preventDefault(); handleVerifyOtp(otp.join('')) }}
                    disabled={otp.join('').length < 6 || loading}
                    className="w-full group/button relative inline-flex justify-center items-center overflow-hidden rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 cursor-pointer shadow-sm"
                  >
                    <span>{loading ? 'Verifying...' : 'Verify Securely'}</span>
                  </button>
                </div>

                <div className="mt-6 text-sm text-[var(--login-color-text-secondary)]">
                  Didn&apos;t receive it?{' '}
                  {resendTimer > 0 ? (
                    <span className="font-semibold text-slate-500 dark:text-zinc-400">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleSendOtp()} 
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: CREATE ACCOUNT (FOR NEW CUSTOMERS) */}
            {step === 3 && (
              <form className="text-center grid gap-2 w-full animate-in slide-in-from-bottom-8 fade-in duration-300" onSubmit={handleRegister}>
                <div className="grid gap-3 mb-2">
                  <div className="flex justify-center mb-1">
                    <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-xs">
                      <FaUser size={22} />
                    </div>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--login-color-heading)] tracking-tight">
                    Create Account
                  </h1>
                  <p className="text-sm text-[var(--login-color-text-secondary)] font-medium">
                    Almost there! What should we call you?
                  </p>
                </div>
                
                <div className="grid gap-2 items-start mt-6 text-left">
                  <label className="text-xs font-bold text-[var(--login-color-heading)] uppercase tracking-wider">
                    Full Name
                  </label>
                  <AppInput 
                    placeholder="Enter your full name" 
                    type="text" 
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                
                <div className="flex gap-4 justify-center items-center mt-6">
                  <button 
                    type="submit"
                    disabled={!name.trim() || loading}
                    className="w-full group/button relative inline-flex justify-center items-center overflow-hidden rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 cursor-pointer shadow-sm"
                  >
                    <span>{loading ? 'Creating...' : 'Complete Registration'}</span>
                    {!loading && name.trim() && (
                      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                        <div className="relative h-full w-8 bg-white/20" />
                      </div>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

        {/* Right Section: Brand Image Banner (Desktop) */}
        <div className="hidden lg:block w-1/2 right h-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--login-color-surface)] to-transparent z-10 w-24" />
          <Image
            src="/login page side image.png"
            width={1000}
            height={1000}
            priority
            alt="Manoj Mobiles Store"
            className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute bottom-12 left-12 z-20 max-w-md">
            <h2 className="text-3xl font-black text-white drop-shadow-lg mb-4">Upgrade Your Tech</h2>
            <p className="text-white/80 font-medium text-lg leading-relaxed drop-shadow">
              Join Manoj Mobiles today for exclusive deals, fast delivery, and premium support on the latest smartphones.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
