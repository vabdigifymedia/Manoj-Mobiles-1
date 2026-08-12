'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserCircle } from 'lucide-react'

export default function StaffLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) {
      window.location.href = '/admin'
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-100px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <Link href="/" className="mb-8 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to store
        </Link>
        
        <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UserCircle size={24} />
        </div>
        <h1 className="text-2xl font-black">Staff Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with your organizational email to access the admin panel.</p>
        
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
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
            disabled={!email || !password}
            className="mt-2 w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-50 transition-opacity"
          >
            Sign in
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm font-semibold text-muted-foreground">
          <Link href="/auth" className="text-primary hover:underline">I'm a customer, go to regular login</Link>
        </div>
      </div>
    </main>
  )
}
