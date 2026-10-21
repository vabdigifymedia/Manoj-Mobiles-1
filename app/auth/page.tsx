'use client'

/**
 * ============================================================================
 * MANOJ MOBILES - CUSTOMER AUTHENTICATION (EMAIL + PASSWORD + OTP)
 * ============================================================================
 * 
 * Flow Overview:
 * 1. Signup:
 *    - Full Name (optional), Email, Password, Confirm Password
 *    - Client-side validation (email format, min 6 characters, passwords match)
 *    - On submit -> Displays 6-digit Email OTP Verification screen
 *    - Verify OTP -> Activates account & logs in
 * 
 * 2. Login:
 *    - Email & Password
 *    - Client-side validation & credentials check
 *    - On submit -> Displays 6-digit Email OTP Verification screen
 *    - Verify OTP -> Authenticates session & redirects to account/store
 * 
 * 3. 6-Digit OTP UI:
 *    - 6 separate input boxes with auto-focus, backspace jump & paste support
 *    - Resend OTP with 30s countdown timer
 *    - "Change Email" button to quickly correct email without losing password
 *    - Clear error, validation, and demo helper messaging
 * 
 * 4. Legacy Mobile + OTP System Preservation:
 *    - The previous mobile phone + OTP auth system is safely preserved in
 *      `components/auth/legacy-mobile-auth.tsx`.
 *    - See TEMPORARILY_HIDDEN_AUTH_RESTORE.md for restoration instructions.
 * 
 * 5. Backend Ready:
 *    - Clean service calls via `lib/emailAuthService.ts` with explicit TODOs
 *      for backend API integration.
 * ============================================================================
 */

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Cookies from 'js-cookie'
import { useStore } from '@/components/store-provider'
import { AppInput } from '@/components/ui/login-1'
import { emailAuthService, DEMO_OTP, EmailAuthResult } from '@/lib/emailAuthService'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  RotateCw,
  Sparkles,
  Pencil,
  AlertCircle,
  KeyRound,
  Check
} from 'lucide-react'

// (Optional) Uncomment to restore legacy mobile auth if needed:
// import LegacyMobileAuth from '@/components/auth/legacy-mobile-auth'

export default function AuthPage() {
  const { fetchCart, showToast } = useStore()

  // Authentication Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Step: 'form' (credentials entry) | 'otp' (6-digit email OTP) | 'success' (verified)
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form')

  // Form Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [termsAgreed, setTermsAgreed] = useState(true)

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 6-Digit OTP State
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [resendTimer, setResendTimer] = useState(30)
  const [isResending, setIsResending] = useState(false)

  // Feedback & Loading States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successInfo, setSuccessInfo] = useState('')
  const [userNameGreeting, setUserNameGreeting] = useState('')

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [forgotError, setForgotError] = useState('')

  // Ambient Glow Mouse Tracking
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, resendTimer])

  // Mouse move for dynamic ambient glow effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    })
  }

  // Email format validator
  const isValidEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim())
  }

  // Switch between Login and Signup tabs
  const handleSwitchMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setStep('form')
    setError('')
    setSuccessInfo('')
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
      // Ignore in demo mode if cart API is unavailable
    }

    const target = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('redirect') || '/account'
      : '/account'

    setTimeout(() => {
      window.location.href = target
    }, 1400)
  }

  /**
   * Handle Form Submit (Login or Signup -> Triggers OTP)
   */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessInfo('')

    const cleanEmail = email.trim()

    // Validation
    if (!cleanEmail) {
      setError('Please enter your email address.')
      return
    }
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.')
        return
      }
      if (!termsAgreed) {
        setError('Please agree to the Terms of Service and Privacy Policy to continue.')
        return
      }
    }

    setLoading(true)
    try {
      if (authMode === 'login') {
        const res = await emailAuthService.requestLoginOtp({
          email: cleanEmail,
          password
        })
        setSuccessInfo(res.message)
      } else {
        const res = await emailAuthService.requestSignupOtp({
          name: name.trim(),
          email: cleanEmail,
          password
        })
        setSuccessInfo(res.message)
      }

      // Transition to OTP screen
      setStep('otp')
      setResendTimer(30)
      setOtp(Array(6).fill(''))
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle Verify OTP
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
      const res = await emailAuthService.verifyEmailOtp({
        email: email.trim(),
        otp: code,
        type: authMode,
        name: name.trim()
      })

      if (res.data) {
        setUserNameGreeting(res.data.name)
        setStep('success')
        await saveAuthData(res.data)
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code. Please check and try again.')
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

    // Auto-advance to next box
    if (cleanValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }

    // Auto-verify if all 6 digits filled
    const otpString = newOtp.join('')
    if (otpString.length === 6 && !newOtp.includes('')) {
      handleVerifyOtp(otpString)
    }
  }

  /**
   * Handle Keyboard Navigation in OTP Boxes (Backspace & Arrows)
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
   * Handle OTP Paste (Supports copying 6-digit code)
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
      const res = await emailAuthService.resendOtp({
        email: email.trim(),
        type: authMode
      })
      setResendTimer(30)
      setOtp(Array(6).fill(''))
      setSuccessInfo(res.message)
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  /**
   * Return to form to edit email
   */
  const handleChangeEmail = () => {
    setStep('form')
    setError('')
    setSuccessInfo('')
    setOtp(Array(6).fill(''))
  }

  /**
   * Submit Forgot Password Form
   */
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')

    if (!forgotEmail.trim() || !isValidEmail(forgotEmail.trim())) {
      setForgotError('Please enter a valid email address.')
      return
    }

    setForgotLoading(true)
    try {
      const res = await emailAuthService.forgotPassword(forgotEmail.trim())
      setForgotSuccess(res.message)
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to send reset link.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen h-full w-full bg-[var(--login-color-bg)] text-[var(--login-color-text-primary)] flex overflow-x-hidden">
      
      {/* Back to Store Navigation */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-50 flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)] transition-all bg-[var(--login-color-surface)]/90 px-3.5 py-2 rounded-full backdrop-blur-md border border-[var(--login-color-border)] shadow-xs hover:shadow-md hover:scale-[1.02]"
      >
        <ArrowLeft size={15} /> <span>Back to store</span>
      </Link>

      <div className="w-full flex min-h-screen bg-[var(--login-color-surface)] relative">
        
        {/* ========================================================
            LEFT SECTION: AUTHENTICATION CONTAINER
           ======================================================== */}
        <div
          className="w-full lg:w-1/2 px-5 sm:px-10 lg:px-14 py-16 left min-h-screen relative overflow-hidden flex flex-col justify-center max-w-xl mx-auto lg:max-w-none"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Ambient Glow */}
          <div
            className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-blue-500/20 via-sky-500/20 to-indigo-500/20 rounded-full blur-3xl transition-opacity duration-300 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          />

          <div className="z-10 w-full relative max-w-md mx-auto">

            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 mb-6">
              <div className="size-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/25">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-[var(--login-color-heading)] leading-none">
                  MANOJ MOBILES
                </span>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                  Official Store
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/25 p-3.5 text-xs font-bold text-red-600 dark:text-red-400 text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ====================================================
                VIEW 1: CREDENTIALS FORM (LOGIN / SIGNUP)
               ==================================================== */}
            {step === 'form' && (
              <div className="w-full animate-in fade-in zoom-in-95 duration-200">
                
                {/* Mode Selector Tabs (Sign In vs Create Account) */}
                <div className="flex p-1 bg-[var(--login-color-muted-surface)] rounded-2xl mb-6 border border-[var(--login-color-border)] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('login')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-[var(--login-color-surface)] text-[var(--login-color-heading)] shadow-sm'
                        : 'text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signup')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-[var(--login-color-surface)] text-[var(--login-color-heading)] shadow-sm'
                        : 'text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Form Header */}
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-black text-[var(--login-color-heading)] tracking-tight">
                    {authMode === 'login' ? 'Welcome back 👋' : 'Create an account 🚀'}
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--login-color-text-secondary)] font-medium mt-1">
                    {authMode === 'login'
                      ? 'Enter your email and password to receive a 6-digit verification code.'
                      : 'Join Manoj Mobiles for fast checkout, orders & exclusive offers.'}
                  </p>
                </div>

                {/* Credentials Form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  
                  {/* Signup Only: Full Name Field */}
                  {authMode === 'signup' && (
                    <div className="animate-in fade-in duration-200">
                      <AppInput
                        label="Full Name"
                        placeholder="e.g. Rahul Sharma"
                        type="text"
                        value={name}
                        onChange={(e: any) => setName(e.target.value)}
                        leftIcon={<User size={18} />}
                        autoFocus={authMode === 'signup'}
                      />
                    </div>
                  )}

                  {/* Email Field */}
                  <div>
                    <AppInput
                      label="Email Address"
                      placeholder="name@example.com"
                      type="email"
                      value={email}
                      onChange={(e: any) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      leftIcon={<Mail size={18} />}
                      required
                      autoFocus={authMode === 'login'}
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <AppInput
                      label="Password"
                      placeholder={authMode === 'login' ? 'Enter your password' : 'Create password (min 6 characters)'}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e: any) => {
                        setPassword(e.target.value)
                        if (error) setError('')
                      }}
                      leftIcon={<Lock size={18} />}
                      icon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="hover:text-[var(--login-color-heading)] transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                      required
                    />
                  </div>

                  {/* Signup Only: Confirm Password Field */}
                  {authMode === 'signup' && (
                    <div className="animate-in fade-in duration-200">
                      <AppInput
                        label="Confirm Password"
                        placeholder="Re-enter your password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e: any) => {
                          setConfirmPassword(e.target.value)
                          if (error) setError('')
                        }}
                        leftIcon={<Lock size={18} />}
                        icon={
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="hover:text-[var(--login-color-heading)] transition-colors p-1 cursor-pointer"
                            tabIndex={-1}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        }
                        error={
                          confirmPassword && password !== confirmPassword
                            ? 'Passwords do not match'
                            : undefined
                        }
                        required
                      />
                    </div>
                  )}

                  {/* Options Row (Remember Me / Forgot Password / Terms) */}
                  {authMode === 'login' ? (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)] select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="size-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                        <span className="font-semibold">Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email)
                          setShowForgotModal(true)
                          setForgotError('')
                          setForgotSuccess('')
                        }}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 text-xs text-[var(--login-color-text-secondary)] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={termsAgreed}
                          onChange={(e) => setTermsAgreed(e.target.checked)}
                          className="size-4 mt-0.5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                        />
                        <span className="leading-relaxed">
                          I agree to Manoj Mobiles&apos;{' '}
                          <Link href="/terms" target="_blank" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" target="_blank" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                            Privacy Policy
                          </Link>.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full group/button relative inline-flex justify-center items-center overflow-hidden rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3.5 text-sm font-extrabold text-white transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 cursor-pointer shadow-sm"
                    >
                      <span>
                        {loading
                          ? 'Sending OTP...'
                          : authMode === 'login'
                          ? 'Continue to Verify Email'
                          : 'Continue to Verify Email'}
                      </span>
                      {!loading && (
                        <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                          <div className="relative h-full w-8 bg-white/20" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Helper Subtext */}
                  <p className="text-center text-xs text-[var(--login-color-text-secondary)] font-medium pt-1">
                    🛡️ A 6-digit OTP will be sent to your email for two-factor verification.
                  </p>
                </form>

                {/* Footer Switcher */}
                <div className="mt-8 pt-6 border-t border-[var(--login-color-border)] text-center text-xs sm:text-sm text-[var(--login-color-text-secondary)]">
                  {authMode === 'login' ? (
                    <p>
                      Don&apos;t have an account yet?{' '}
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('signup')}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Sign up for free
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('login')}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Sign in here
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
              <div className="w-full text-center animate-in slide-in-from-right-6 fade-in duration-300">
                
                {/* Header Icon */}
                <div className="flex justify-center mb-3">
                  <div className="grid size-14 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-xs relative">
                    <ShieldCheck size={28} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                    </span>
                  </div>
                </div>

                {/* Title & Email Display */}
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--login-color-heading)] tracking-tight">
                  {authMode === 'login' ? 'Verify Your Login' : 'Verify Your Email'}
                </h1>

                <div className="mt-2 text-xs sm:text-sm text-[var(--login-color-text-secondary)] font-medium max-w-sm mx-auto">
                  <span>Enter the 6-digit code sent to</span>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="font-extrabold text-[var(--login-color-heading)] bg-[var(--login-color-muted-surface)] px-2.5 py-0.5 rounded-md border border-[var(--login-color-border)] text-xs sm:text-sm break-all">
                      {email}
                    </span>
                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                      title="Change email address"
                    >
                      <Pencil size={11} /> <span>Change</span>
                    </button>
                  </div>
                </div>

                {/* Demo Helper Banner */}
                <div className="mt-4 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full text-xs text-blue-700 dark:text-blue-300 font-semibold animate-in fade-in">
                  <Sparkles size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Demo Mode OTP: <strong className="font-black tracking-widest text-blue-600 dark:text-blue-400">{DEMO_OTP}</strong></span>
                </div>

                {/* 6 Separate OTP Input Boxes */}
                <div className="flex justify-center gap-2 sm:gap-2.5 md:gap-3 mt-6" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 md:w-13 md:h-15 text-center text-xl sm:text-2xl font-black bg-[var(--login-color-muted-surface)] border-2 ${
                        digit
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-[var(--login-color-surface)] shadow-sm'
                          : 'border-[var(--login-color-border)] text-[var(--login-color-heading)]'
                      } rounded-xl sm:rounded-2xl outline-none focus:border-blue-600 focus:bg-[var(--login-color-surface)] focus:ring-4 focus:ring-blue-500/15 transition-all shadow-2xs select-none`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <div className="mt-7">
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={otp.join('').length < 6 || loading}
                    className="w-full group/button relative inline-flex justify-center items-center overflow-hidden rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3.5 text-sm font-extrabold text-white transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 cursor-pointer shadow-sm"
                  >
                    <span>
                      {loading
                        ? 'Verifying OTP...'
                        : authMode === 'signup'
                        ? 'Verify Email & Complete'
                        : 'Verify Securely & Sign In'}
                    </span>
                    {!loading && otp.join('').length === 6 && (
                      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                        <div className="relative h-full w-8 bg-white/20" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Resend OTP Row */}
                <div className="mt-6 flex flex-col items-center gap-2 text-xs sm:text-sm text-[var(--login-color-text-secondary)]">
                  {resendTimer > 0 ? (
                    <span className="font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <span>Didn&apos;t receive the code?</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        Resend in {resendTimer}s
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw size={14} className={isResending ? 'animate-spin' : ''} />
                      <span>{isResending ? 'Resending...' : 'Resend verification code'}</span>
                    </button>
                  )}

                  {/* Return to Form Link */}
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="mt-2 text-xs font-semibold text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)] hover:underline cursor-pointer"
                  >
                    ← Back to {authMode === 'login' ? 'login' : 'signup'} form
                  </button>
                </div>

              </div>
            )}

            {/* ====================================================
                VIEW 3: SUCCESS STATE (VERIFIED & REDIRECTING)
               ==================================================== */}
            {step === 'success' && (
              <div className="w-full text-center py-6 animate-in zoom-in-95 duration-300">
                <div className="flex justify-center mb-4">
                  <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-in zoom-in-50 duration-300">
                    <CheckCircle2 size={36} />
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[var(--login-color-heading)] tracking-tight">
                  {authMode === 'signup' ? 'Account Verified!' : 'Login Successful!'}
                </h1>
                
                <p className="mt-2 text-sm text-[var(--login-color-text-secondary)] font-medium max-w-sm mx-auto">
                  {userNameGreeting ? `Welcome, ${userNameGreeting}!` : 'Welcome to Manoj Mobiles!'}{' '}
                  Redirecting to your account dashboard...
                </p>

                {/* Progress bar animation */}
                <div className="w-48 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto mt-6 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}

          </div>

          {/* Legacy System Preservation Notice (Developer/Auditor Info) */}
          <div className="mt-12 text-center z-10">
            <p className="text-[11px] text-[var(--login-color-text-secondary)]/70">
              Manoj Mobiles Secure Authentication System • Protected with 256-bit encryption
            </p>
          </div>

        </div>

        {/* ========================================================
            RIGHT SECTION: BRAND SHOWCASE BANNER (DESKTOP)
           ======================================================== */}
        <div className="hidden lg:block w-1/2 right min-h-screen overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--login-color-surface)] to-transparent z-10 w-24" />
          <Image
            src="/login page side image.png"
            width={1000}
            height={1000}
            priority
            alt="Manoj Mobiles Store"
            className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
          
          <div className="absolute bottom-12 left-12 right-12 z-20 max-w-lg">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-md">
              <Sparkles size={13} />
              <span>Premium Tech Destination</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg mb-3 tracking-tight">
              Upgrade Your Tech Today
            </h2>
            
            <p className="text-white/85 font-medium text-base leading-relaxed drop-shadow">
              Sign in to explore genuine smartphones, original accessories, instant warranty status, and exclusive customer deals.
            </p>

            <div className="mt-6 flex items-center gap-6 text-white/80 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" /> 100% Genuine Devices
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" /> Fast Secure Shipping
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" /> Official Warranty
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          MODAL: FORGOT PASSWORD (DEMO FLOW)
         ======================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--login-color-surface)] border border-[var(--login-color-border)] w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[var(--login-color-heading)]">Reset Password</h3>
                  <p className="text-xs text-[var(--login-color-text-secondary)] font-medium">
                    We&apos;ll send recovery instructions to your email.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)] p-1 rounded-lg hover:bg-[var(--login-color-muted-surface)] transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-bold text-red-600 dark:text-red-400">
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div className="text-center py-4 space-y-3">
                <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {forgotSuccess}
                </p>
                <p className="text-xs text-[var(--login-color-text-secondary)]">
                  Check your inbox and spam folder. Click below to return.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <AppInput
                  label="Email Address"
                  placeholder="name@example.com"
                  type="email"
                  value={forgotEmail}
                  onChange={(e: any) => setForgotEmail(e.target.value)}
                  leftIcon={<Mail size={18} />}
                  required
                  autoFocus
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--login-color-border)] text-xs font-bold text-[var(--login-color-heading)] hover:bg-[var(--login-color-muted-surface)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
