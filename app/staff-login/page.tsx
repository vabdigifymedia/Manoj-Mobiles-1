'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaCircleUser, FaCircleExclamation } from 'react-icons/fa6'
import { useAuth } from '@/lib/auth-context'

export default function StaffLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      router.push('/admin')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
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
        
        <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <FaCircleUser size={24} />
        </div>
        <h1 className="text-2xl font-black">Staff Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with your organizational email to access the admin panel.</p>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs font-bold text-destructive">
            <FaCircleExclamation size={16} />
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold outline-none focus:border-primary" 
              placeholder="name@manojmobiles.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold outline-none focus:border-primary" 
              placeholder="Enter your password"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={!email || !password || loading}
            className="mt-2 w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Signing in...
              </>
            ) : 'Sign in'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm font-semibold text-muted-foreground">
          <Link href="/auth" className="text-primary hover:underline">I&apos;m a customer, go to regular login</Link>
        </div>
      </div>
    </main>
  )
}
