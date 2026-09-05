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

const socialIcons = [
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"/></svg>,
      href: '#',
      gradient: 'bg-[var(--login-color-text-primary)]',
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"/></svg>,
      href: '#',
      bg: 'bg-[var(--login-color-text-primary)]',
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396z"/></svg>,
      href: '#',
      bg: 'bg-[var(--login-color-text-primary)]',
    }
];

export default function AuthPage() {
  const { fetchCart } = useStore()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const saveAuthData = async (data: any) => {
    Cookies.set('accessToken', data.token, { expires: 1 })
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 })
    if (data.userId) Cookies.set('userId', data.userId, { expires: 7 })
    Cookies.set('userName', data.name || 'Customer', { expires: 7 })
    Cookies.set('userRole', data.role || 'CUSTOMER', { expires: 7 })
    
    await fetchCart()
    
    const target = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('redirect') || '/'
      : '/'
    window.location.href = target
  }

  const handleSendOtp = async (e?: React.FormEvent) => {
    if(e) e.preventDefault()
    if (phone.length !== 10) return
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.sendOtp(phone)
      console.log("[DEV ONLY] The OTP is:", res.data.data)
      setStep(2)
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setStep(2)
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
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
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    
    const otpString = newOtp.join('');
    if (otpString.length === 6) {
      handleVerifyOtp(otpString);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

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
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      
      if (pastedData.length === 6) {
        handleVerifyOtp(pastedData);
      }
    }
  };

  return (
    <div className="h-screen w-full bg-[var(--login-color-bg)] text-[var(--login-color-text-primary)] flex overflow-hidden">
      <Link href="/" className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm font-semibold text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)] transition-colors bg-[var(--login-color-surface)]/80 p-2 pr-4 rounded-full backdrop-blur-sm">
        <FaArrowLeft size={16} /> Back to store
      </Link>
      
      <div className='w-full flex h-full bg-[var(--login-color-surface)] relative'>
        
        <div
          className='w-full lg:w-1/2 px-6 lg:px-16 left h-full relative overflow-hidden flex flex-col justify-center'
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}>
            
            <div
              className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-pink-500/30 dark:from-purple-300/20 dark:via-blue-300/20 dark:to-pink-300/20 rounded-full blur-3xl transition-opacity duration-200 ${
                isHovering ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            />
            
            <div className="form-container sign-in-container z-10 w-full relative">
              <div className="absolute top-[-40px] left-0 w-full mb-8">
                  {error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-bold text-red-400 text-center animate-in fade-in slide-in-from-top-2">
                      {error}
                    </div>
                  )}
              </div>

              {step === 1 && (
                <form className='text-center grid gap-2 w-full animate-in fade-in zoom-in-95 duration-300' onSubmit={handleSendOtp}>
                  <div className='grid gap-4 md:gap-6 mb-2'>
                    <div className="flex justify-center mb-2">
                       <div className="grid size-12 place-items-center rounded-2xl bg-[var(--login-color-border)] text-[var(--login-color-heading)]">
                         <FaMobileScreen size={24} />
                       </div>
                    </div>
                    <h1 className='text-3xl md:text-4xl font-extrabold text-[var(--login-color-heading)] tracking-tight'>Welcome back</h1>
                    <p className="text-sm text-[var(--login-color-text-secondary)]">Enter your mobile number to sign in or create an account.</p>
                  </div>
                  
                  <div className='grid gap-4 items-center mt-6 text-left'>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--login-color-text-secondary)] z-20">+91</span>
                      <AppInput 
                        placeholder="Phone Number" 
                        type="tel" 
                        value={phone}
                        onChange={(e: any) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        style={{ paddingLeft: '3.5rem' }}
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className='flex gap-4 justify-center items-center mt-8'>
                     <button 
                      type="submit"
                      disabled={phone.length !== 10 || loading}
                      className="w-full group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--login-color-text-primary)] px-4 py-3 text-sm font-bold text-[var(--login-color-bg)] transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                    >
                    <span>{loading ? 'Sending OTP...' : 'Send OTP'}</span>
                    {!loading && phone.length === 10 && (
                      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                        <div className="relative h-full w-8 bg-black/10 dark:bg-white/20" />
                      </div>
                    )}
                  </button>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[var(--login-color-border)]">
                    <span className='text-sm text-[var(--login-color-text-secondary)] block mb-4'>or continue with</span>
                    <div className="social-container">
                      <div className="flex items-center justify-center">
                        <ul className="flex gap-4">
                          {socialIcons.map((social, index) => {
                            return (
                              <li key={index} className="list-none">
                                <a
                                  href={social.href}
                                  className={`w-[3rem] h-[3rem] bg-[var(--login-color-muted-surface)] rounded-full flex justify-center items-center relative z-[1] border border-[var(--login-color-border)] overflow-hidden group`}
                                >
                                  <div
                                    className={`absolute inset-0 w-full h-full ${
                                      social.gradient || social.bg
                                    } scale-y-0 origin-bottom transition-transform duration-500 ease-in-out group-hover:scale-y-100`}
                                  />
                                  <span className="text-[1.2rem] text-[var(--login-color-text-primary)] transition-all duration-500 ease-in-out z-[2] group-hover:text-[var(--login-color-bg)]">
                                    {social.icon}
                                  </span>
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {step === 2 && (
                 <div className='text-center grid gap-2 w-full animate-in slide-in-from-right-8 fade-in duration-300'>
                  <div className='grid gap-4 md:gap-6 mb-2'>
                    <div className="flex justify-center mb-2">
                       <div className="grid size-12 place-items-center rounded-2xl bg-[var(--login-color-border)] text-[var(--login-color-heading)]">
                         <FaShieldHalved size={24} />
                       </div>
                    </div>
                    <h1 className='text-3xl md:text-4xl font-extrabold text-[var(--login-color-heading)] tracking-tight'>Verify OTP</h1>
                    <p className="text-sm text-[var(--login-color-text-secondary)]">
                      Code sent to <span className="text-[var(--login-color-heading)] font-semibold">+91 {phone}</span>
                      <button onClick={() => setStep(1)} className="ml-2 text-[var(--login-color-text-secondary)] hover:text-[var(--login-color-heading)] underline decoration-current text-xs">Edit</button>
                    </p>
                  </div>
                  
                  <div className='flex justify-center gap-2 md:gap-3 mt-8' onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold bg-[var(--login-color-muted-surface)] border border-[var(--login-color-border)] rounded-lg outline-none focus:border-[var(--login-color-text-primary)] focus:bg-[var(--login-color-bg)] transition-all text-[var(--login-color-heading)]"
                      />
                    ))}
                  </div>
                  
                  <div className='flex gap-4 justify-center items-center mt-10'>
                     <button 
                      onClick={(e) => { e.preventDefault(); handleVerifyOtp(otp.join('')); }}
                      disabled={otp.join('').length < 6 || loading}
                      className="w-full group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--login-color-text-primary)] px-4 py-3 text-sm font-bold text-[var(--login-color-bg)] transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                    >
                    <span>{loading ? 'Verifying...' : 'Verify Securely'}</span>
                  </button>
                  </div>

                  <div className="mt-8 text-sm text-[var(--login-color-text-secondary)]">
                    Didn&apos;t receive it? <button onClick={() => handleSendOtp()} className="text-[var(--login-color-heading)] hover:underline ml-1">Resend code</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <form className='text-center grid gap-2 w-full animate-in slide-in-from-bottom-8 fade-in duration-300' onSubmit={handleRegister}>
                  <div className='grid gap-4 md:gap-6 mb-2'>
                    <div className="flex justify-center mb-2">
                       <div className="grid size-12 place-items-center rounded-2xl bg-[var(--login-color-border)] text-[var(--login-color-heading)]">
                         <FaUser size={24} />
                       </div>
                    </div>
                    <h1 className='text-3xl md:text-4xl font-extrabold text-[var(--login-color-heading)] tracking-tight'>Create Account</h1>
                    <p className="text-sm text-[var(--login-color-text-secondary)]">Almost there! What should we call you?</p>
                  </div>
                  
                  <div className='grid gap-4 items-center mt-6 text-left'>
                    <AppInput 
                      placeholder="Full Name" 
                      type="text" 
                      value={name}
                      onChange={(e: any) => setName(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  
                  <div className='flex gap-4 justify-center items-center mt-8'>
                     <button 
                      type="submit"
                      disabled={!name.trim() || loading}
                      className="w-full group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--login-color-text-primary)] px-4 py-3 text-sm font-bold text-[var(--login-color-bg)] transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                    >
                    <span>{loading ? 'Creating...' : 'Complete Registration'}</span>
                    {!loading && name.trim() && (
                      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                        <div className="relative h-full w-8 bg-black/10 dark:bg-white/20" />
                      </div>
                    )}
                  </button>
                  </div>
                </form>
              )}

            </div>
          </div>
          <div className='hidden lg:block w-1/2 right h-full overflow-hidden relative'>
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--login-color-surface)] to-transparent z-10 w-24"></div>
              <Image
                src='https://cdn.21st.dev/assets/mirror/c7/c7c7aee18ed1be4c0450d411b3339874a04999ad26948273c9d6fe96a66a21ea.jpg'
                loader={({ src }) => src}
                width={1000}
                height={1000}
                priority
                alt="Brand image"
                className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-black/50"></div>
              <div className="absolute bottom-12 left-12 z-20 max-w-md">
                <h2 className="text-3xl font-black text-white drop-shadow-lg mb-4">Upgrade Your Tech</h2>
                <p className="text-white/80 font-medium text-lg leading-relaxed drop-shadow">Join Manoj Mobiles today for exclusive deals, fast delivery, and premium support on the latest smartphones.</p>
              </div>
         </div>
      </div>
    </div>
  )
}

