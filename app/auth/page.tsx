'use client'

/**
 * ============================================================================
 * MANOJ MOBILES - CUSTOMER AUTHENTICATION (EMAIL OTP)
 * ============================================================================
 * 
 * Flows:
 * 1. Customer Login:
 *    - Enter Email Address
 *    - POST /api/auth/send-email-otp -> { email }
 *    - Enter 6-digit OTP
 *    - POST /api/auth/login-email-otp -> { email, otp }
 *    - Save JWT access & refresh tokens -> redirect to account
 * 
 * 2. Customer Sign Up:
 *    - Enter Name, Email Address, and Phone Number (10 digits)
 *    - POST /api/auth/send-email-otp -> { email }
 *    - Enter 6-digit OTP
 *    - POST /api/auth/register-email-otp -> { name, email, phone, otp }
 *    - Save JWT access & refresh tokens -> redirect to account
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
  Check
} from 'lucide-react'

export default function AuthPage() {
  const { fetchCart } = useStore()

  // Authentication Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Step: 'form' (enter details & send OTP) | 'otp' (verify 6-digit code) | 'success' (logged in)
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form')

  // Form Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
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
  const [isUserNotFound, setIsUserNotFound] = useState(false)
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

  // Switch between Login and Signup
  const handleSwitchMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setStep('form')
    setError('')
    setIsUserNotFound(false)
    setOtp(Array(6).fill(''))
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
   * Step 1: Send OTP to Email (POST /api/auth/send-email-otp)
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsUserNotFound(false)

    const cleanEmail = email.trim()

    // Validation
    if (!cleanEmail) {
      setError('Please enter your email address.')
      return
    }
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (authMode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.')
        return
      }
      const cleanPhone = phone.replace(/\D/g, '')
      if (!cleanPhone || cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.')
        return
      }
      if (!termsAgreed) {
        setError('Please agree to the Terms of Service to continue.')
        return
      }
    }

    setLoading(true)
    try {
      await emailAuthService.sendEmailOtp(cleanEmail)

      setStep('otp')
      setResendTimer(30)
      setOtp(Array(6).fill(''))
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step 2: Verify OTP
   */
  const handleVerifyOtp = async (otpString?: string) => {
    const code = otpString || otp.join('')
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP.')
      return
    }

    setLoading(true)
    setError('')
    setIsUserNotFound(false)

    try {
      if (authMode === 'login') {
        const res = await emailAuthService.loginWithEmailOtp(email.trim(), code)
        if (res.data) {
          setUserNameGreeting(res.data.name)
          setStep('success')
          await saveAuthData(res.data)
        }
      } else {
        const cleanPhone = phone.replace(/\D/g, '')
        const res = await emailAuthService.registerWithEmailOtp({
          name: name.trim(),
          email: email.trim(),
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
      if (err?.isNotFound || err?.status === 404) {
        setIsUserNotFound(true)
      }
      setError(err?.message || 'Invalid OTP. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle Single Digit OTP Change
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
    setIsUserNotFound(false)
    try {
      await emailAuthService.sendEmailOtp(email.trim())
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
   * Return to form to edit details
   */
  const handleChangeEmail = () => {
    setStep('form')
    setError('')
    setIsUserNotFound(false)
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
            LEFT SECTION: AUTHENTICATION FORM (COMPACT, NO SCROLL)
           ======================================================== */}
        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center px-6 sm:px-12 relative overflow-hidden bg-[var(--login-color-surface)]">
          <div className="w-full max-w-sm mx-auto">

            {/* Error Banner */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 flex flex-col gap-1.5 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="leading-tight">{error}</span>
                </div>
                {isUserNotFound && authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signup')}
                    className="self-start text-[11px] font-semibold underline text-blue-600 dark:text-blue-400 cursor-pointer"
                  >
                    Create a new account now
                  </button>
                )}
              </div>
            )}

            {/* ====================================================
                VIEW 1: FORM (LOGIN / SIGNUP) -> SENDS OTP
               ==================================================== */}
            {step === 'form' && (
              <div className="w-full animate-in fade-in duration-200">
                
                {/* Form Header */}
                <div className="mb-5">
                  <h1 className="text-xl font-bold text-[var(--login-color-heading)] tracking-tight">
                    {authMode === 'login' ? 'Sign In' : 'Create an Account'}
                  </h1>
                  <p className="text-xs text-[var(--login-color-text-secondary)] mt-1">
                    {authMode === 'login'
                      ? 'Enter your email to receive a 6-digit verification code.'
                      : 'Register with your details to receive a verification code.'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  
                  {/* Signup Only: Full Name Field */}
                  {authMode === 'signup' && (
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
                          autoFocus={authMode === 'signup'}
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
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
                          setIsUserNotFound(false)
                        }}
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--login-color-border)] bg-[var(--login-color-bg)] text-xs text-[var(--login-color-heading)] placeholder:text-[var(--login-color-text-secondary)] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                        required
                        autoFocus={authMode === 'login'}
                      />
                    </div>
                  </div>

                  {/* Signup Only: Phone Field */}
                  {authMode === 'signup' && (
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
                  )}

                  {/* Terms for Signup */}
                  {authMode === 'signup' && (
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
                  )}

                  {/* Submit Button */}
                  <div className="pt-1.5">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <span>{loading ? 'Sending code...' : 'Continue'}</span>
                      {!loading && <ArrowRight size={14} />}
                    </button>
                  </div>
                </form>

                {/* Footer Switcher */}
                <div className="mt-5 pt-4 border-t border-[var(--login-color-border)] text-center text-xs text-[var(--login-color-text-secondary)]">
                  {authMode === 'login' ? (
                    <p>
                      New customer?{' '}
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('signup')}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Create an account
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('login')}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* ====================================================
                VIEW 2: 6-DIGIT EMAIL OTP VERIFICATION
               ==================================================== */}
            {step === 'otp' && (
              <div className="w-full text-center animate-in fade-in duration-200">
                
                {/* Title */}
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

                {/* 6 OTP Input Boxes */}
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
                    Back
                  </button>
                </div>

              </div>
            )}

            {/* ====================================================
                VIEW 3: SUCCESS STATE
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
