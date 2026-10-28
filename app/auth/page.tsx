'use client'

/**
 * ============================================================================
 * MANOJ MOBILES - SMART UNIFIED CUSTOMER AUTHENTICATION (EMAIL OTP)
 * ============================================================================
 * 
 * Flow:
 * 1. Step 'email':
 *    - User enters Email -> Clicks Continue
 *    - Calls checkEmail:
 *      - If user exists -> Sends OTP -> Directly moves to 'otp' (Login)
 *      - If user is new -> Moves to 'register_details' (asks Name & Phone)
 * 
 * 2. Step 'register_details':
 *    - User enters Name & 10-digit Phone -> Clicks Continue
 *    - Sends OTP -> Moves to 'otp' (Register)
 * 
 * 3. Step 'otp':
 *    - 6-digit OTP input (no code hint on screen, no emojis, non-scrollable)
 *    - Verifies and authenticates session
 * ============================================================================
 */

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { useStore } from '@/components/store-provider'
import { emailAuthService, EmailAuthResult } from '@/lib/emailAuthService'
import {
  Mail,
  User,
  Phone,
  CheckCircle2,
  ArrowLeft,
  RotateCw,
  AlertCircle,
  ArrowRight,
  Check,
  Pencil
} from 'lucide-react'

export default function AuthPage() {
  const { fetchCart } = useStore()

  // Steps: 'email' -> 'register_details' (for new users) -> 'otp' -> 'success'
  const [step, setStep] = useState<'email' | 'register_details' | 'otp' | 'success'>('email')

  // Flow mode: 'login' (existing user) | 'signup' (new user)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Form Fields
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [termsAgreed, setTermsAgreed] = useState(true)

  // 6-Digit OTP State
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [resendTimer, setResendTimer] = useState(30)
  const [isResending, setIsResending] = useState(false)

  // Feedback & Loading States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userNameGreeting, setUserNameGreeting] = useState('')

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev: number) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [step, resendTimer])

  // Email format validator
  const isValidEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim())
  }

  /**
   * Save Auth Data to Cookies & Redirect
   */
  const saveAuthData = async (data: EmailAuthResult) => {
    Cookies.set('accessToken', data.token, { expires: 1 })
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 })
    if (data.userId) Cookies.set('userId', data.userId, { expires: 7 })
    Cookies.set('userName', data.name || 'Customer', { expires: 7 })
    Cookies.set('userRole', data.role || 'CUSTOMER', { expires: 7 })

    try {
      await fetchCart()
    } catch {
      // Ignore if cart fetch fails
    }

    const target = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('redirect') || '/account'
      : '/account'

    setTimeout(() => {
      window.location.href = target
    }, 1200)
  }

  /**
   * Step 1: Submit Email (Smart Check: Existing vs New User)
   */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError('Please enter your email address.')
      return
    }
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      // Check if email already has an account
      const exists = await emailAuthService.checkEmail(cleanEmail)

      if (exists === true) {
        // Existing user -> Send OTP and proceed straight to login
        setAuthMode('login')
        await emailAuthService.sendEmailOtp(cleanEmail)
        setStep('otp')
        setResendTimer(30)
        setOtp(Array(6).fill(''))
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
      } else if (exists === false) {
        // New user -> Show details step (Name + Phone) before sending OTP
        setAuthMode('signup')
        setStep('register_details')
      } else {
        // Fallback if check endpoint unavailable -> Send OTP directly
        setAuthMode('login')
        await emailAuthService.sendEmailOtp(cleanEmail)
        setStep('otp')
        setResendTimer(30)
        setOtp(Array(6).fill(''))
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to continue. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step 2 (New Users Only): Submit Name and Phone, then send OTP
   */
  const handleRegisterDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanName = name.trim()
    const cleanPhone = phone.replace(/\D/g, '')

    if (!cleanName) {
      setError('Please enter your full name.')
      return
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }
    if (!termsAgreed) {
      setError('Please agree to the Terms of Service to continue.')
      return
    }

    setLoading(true)
    try {
      await emailAuthService.sendEmailOtp(email.trim().toLowerCase())
      setStep('otp')
      setResendTimer(30)
      setOtp(Array(6).fill(''))
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step 3: Verify OTP (Handles both Login and Registration)
   */
  const handleVerifyOtp = async (otpString?: string) => {
    const code = otpString || otp.join('')
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP.')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (authMode === 'login') {
        const res = await emailAuthService.loginWithEmailOtp(email.trim().toLowerCase(), code)
        if (res.data) {
          setUserNameGreeting(res.data.name)
          setStep('success')
          await saveAuthData(res.data)
        }
      } else {
        const cleanPhone = phone.replace(/\D/g, '')
        const res = await emailAuthService.registerWithEmailOtp({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          otp: code
        })
        if (res.data) {
          setUserNameGreeting(res.data.name)
          setStep('success')
          await saveAuthData(res.data)
        }
      }
    } catch (err: any) {
      // If login returned 404 (user does not exist), seamlessly switch to complete profile
      if (authMode === 'login' && (err?.isNotFound || err?.status === 404)) {
        setAuthMode('signup')
        setStep('register_details')
        setError('No account found with this email. Please complete your name and phone number to sign up.')
        return
      }
      setError(err?.message || 'Invalid OTP. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle Single Digit OTP Input
   */
  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (!cleanValue && value !== '') return

    const newOtp = [...otp]
    newOtp[index] = cleanValue ? cleanValue.slice(-1) : ''
    setOtp(newOtp)
    if (error) setError('')

    if (cleanValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }

    const otpString = newOtp.join('')
    if (otpString.length === 6 && !newOtp.includes('')) {
      handleVerifyOtp(otpString)
    }
  }

  /**
   * Handle Keyboard Navigation in OTP Boxes
   */
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleVerifyOtp()
    }
  }

  /**
   * Handle OTP Paste
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6)
    if (pastedData) {
      const newOtp = [...otp]
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || ''
      }
      setOtp(newOtp)
      const nextFocus = Math.min(pastedData.length, 5)
      otpInputRefs.current[nextFocus]?.focus()

      if (pastedData.length === 6) {
        handleVerifyOtp(pastedData)
      }
    }
  }

  /**
   * Resend OTP
   */
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return
    setIsResending(true)
    setError('')
    try {
      await emailAuthService.sendEmailOtp(email.trim().toLowerCase())
      setResendTimer(30)
      setOtp(Array(6).fill(''))
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  /**
   * Change Email / Return to start
   */
  const handleChangeEmail = () => {
    setStep('email')
    setError('')
    setOtp(Array(6).fill(''))
  }

  return (
    <div className="h-screen max-h-screen w-full bg-[var(--login-color-bg)] text-[var(--login-color-text-primary)] flex overflow-hidden">
      
      {/* Back to Store Navigation */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 text-xs font-medium text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)] transition-colors bg-[var(--login-color-surface)]/80 px-3 py-1.5 rounded-md border border-[var(--login-color-border)] shadow-xs backdrop-blur-sm"
      >
        <ArrowLeft size={13} />
        <span>Back to store</span>
      </Link>

      <div className="w-full h-full flex overflow-hidden">
        
        {/* ========================================================
            LEFT SECTION: UNIFIED AUTHENTICATION (NO SCROLL, NO EMOJIS)
           ======================================================== */}
        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center px-6 sm:px-12 relative overflow-hidden bg-[var(--login-color-surface)]">
          <div className="w-full max-w-sm mx-auto">

            {/* Error Banner */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* ====================================================
                STEP 1: EMAIL ENTRY (UNIFIED ENTRY POINT)
               ==================================================== */}
            {step === 'email' && (
              <div className="w-full animate-in fade-in duration-200">
                <div className="mb-5">
                  <h1 className="text-xl font-bold text-[var(--login-color-heading)] tracking-tight">
                    Welcome
                  </h1>
                  <p className="text-xs text-[var(--login-color-text-secondary)] mt-1">
                    Enter your email address to sign in or create an account.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--login-color-heading)] mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--login-color-text-secondary)] pointer-events-none" />
                      <input
                        type="email"
                        placeholder="customer@gmail.com"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setEmail(e.target.value)
                          if (error) setError('')
                        }}
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--login-color-border)] bg-[var(--login-color-bg)] text-xs text-[var(--login-color-heading)] placeholder:text-[var(--login-color-text-secondary)] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <span>{loading ? 'Continuing...' : 'Continue'}</span>
                      {!loading && <ArrowRight size={14} />}
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-[var(--login-color-text-secondary)] pt-1">
                    We will send a 6-digit verification code to your email.
                  </p>
                </form>
              </div>
            )}

            {/* ====================================================
                STEP 2: NEW USER DETAILS (NAME & PHONE)
               ==================================================== */}
            {step === 'register_details' && (
              <div className="w-full animate-in fade-in duration-200">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-[var(--login-color-heading)] tracking-tight">
                      Complete Profile
                    </h1>
                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Pencil size={11} /> <span>Change</span>
                    </button>
                  </div>
                  <p className="text-xs text-[var(--login-color-text-secondary)] mt-1">
                    Enter your details to create an account for <span className="font-semibold text-[var(--login-color-heading)]">{email}</span>.
                  </p>
                </div>

                <form onSubmit={handleRegisterDetailsSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--login-color-heading)] mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--login-color-text-secondary)] pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--login-color-border)] bg-[var(--login-color-bg)] text-xs text-[var(--login-color-heading)] placeholder:text-[var(--login-color-text-secondary)] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--login-color-heading)] mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--login-color-text-secondary)] pointer-events-none" />
                      <input
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        value={phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setPhone(val)
                          if (error) setError('')
                        }}
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--login-color-border)] bg-[var(--login-color-bg)] text-xs text-[var(--login-color-heading)] placeholder:text-[var(--login-color-text-secondary)] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <label className="flex items-start gap-2 text-[11px] text-[var(--login-color-text-secondary)] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={termsAgreed}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTermsAgreed(e.target.checked)}
                        className="size-3.5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                      />
                      <span>
                        I agree to the{' '}
                        <Link href="/terms" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">
                          Privacy Policy
                        </Link>.
                      </span>
                    </label>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <span>{loading ? 'Sending code...' : 'Send Verification Code'}</span>
                      {!loading && <ArrowRight size={14} />}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ====================================================
                STEP 3: 6-DIGIT EMAIL OTP VERIFICATION
               ==================================================== */}
            {step === 'otp' && (
              <div className="w-full text-center animate-in fade-in duration-200">
                <h1 className="text-xl font-bold text-[var(--login-color-heading)] tracking-tight">
                  Enter Verification Code
                </h1>

                <div className="mt-1 text-xs text-[var(--login-color-text-secondary)]">
                  <span>Sent to </span>
                  <span className="font-semibold text-[var(--login-color-heading)]">{email}</span>
                  <span> · </span>
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* 6 OTP Input Boxes (No code hint displayed) */}
                <div className="flex justify-center gap-2 mt-5" onPaste={handlePaste}>
                  {otp.map((digit: string, index: number) => (
                    <input
                      key={index}
                      ref={(el: HTMLInputElement | null) => {
                        otpInputRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleOtpKeyDown(index, e)}
                      className="w-10 h-12 text-center text-lg font-bold bg-[var(--login-color-bg)] border border-[var(--login-color-border)] rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-[var(--login-color-heading)] transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={otp.join('').length < 6 || loading}
                    className="w-full h-10 inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <span>{loading ? 'Verifying...' : 'Verify and Continue'}</span>
                  </button>
                </div>

                {/* Resend OTP Row */}
                <div className="mt-4 flex flex-col items-center gap-1.5 text-xs text-[var(--login-color-text-secondary)]">
                  {resendTimer > 0 ? (
                    <span className="text-[11px]">
                      Resend code in <strong className="font-semibold text-blue-600 dark:text-blue-400">{resendTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      <RotateCw size={12} className={isResending ? 'animate-spin' : ''} />
                      <span>{isResending ? 'Resending...' : 'Resend verification code'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="text-[11px] text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)] hover:underline cursor-pointer mt-1"
                  >
                    Back to email
                  </button>
                </div>
              </div>
            )}

            {/* ====================================================
                STEP 4: SUCCESS STATE
               ==================================================== */}
            {step === 'success' && (
              <div className="w-full text-center py-4 animate-in fade-in duration-200">
                <div className="flex justify-center mb-3">
                  <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 size={28} />
                  </div>
                </div>

                <h1 className="text-lg font-bold text-[var(--login-color-heading)] tracking-tight">
                  {authMode === 'signup' ? 'Registration Complete' : 'Signed In Successfully'}
                </h1>
                
                <p className="mt-1 text-xs text-[var(--login-color-text-secondary)]">
                  {userNameGreeting ? `Welcome, ${userNameGreeting}.` : 'Welcome to Manoj Mobiles.'} Redirecting to your account...
                </p>

                <div className="w-36 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto mt-4 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ========================================================
            RIGHT SECTION: CLEAN PROFESSIONAL SHOWCASE (DESKTOP)
           ======================================================== */}
        <div className="hidden lg:flex w-1/2 h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-12 flex-col justify-between overflow-hidden relative">
          
          {/* Top Brand Info */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="font-bold text-sm tracking-wide text-white">Manoj Mobiles</span>
            <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-md text-blue-200 border border-white/15">
              Secure Gateway
            </span>
          </div>

          {/* Center Message */}
          <div className="relative z-10 my-auto max-w-sm">
            <h2 className="text-2xl font-bold leading-tight tracking-tight mb-2 text-white">
              Fast and Secure Checkout
            </h2>
            <p className="text-xs text-blue-200/90 leading-relaxed mb-6">
              Sign in with your email to track deliveries, view invoices, and manage your orders.
            </p>

            <div className="space-y-2.5 text-xs text-blue-100/90 font-medium">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-blue-400 shrink-0" />
                <span>100% Genuine Products with Brand Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-blue-400 shrink-0" />
                <span>Instant Email Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-blue-400 shrink-0" />
                <span>Live Order Tracking and Status</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 text-[11px] text-blue-300/70 flex justify-between items-center border-t border-white/10 pt-3">
            <span>Manoj Mobiles</span>
            <span>256-bit SSL Encryption</span>
          </div>

        </div>

      </div>

    </div>
  )
}
