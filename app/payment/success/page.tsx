'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FaCircleCheck, FaCircleXmark, FaSpinner, FaRotateLeft } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { OrderResponseDTO } from '@/lib/types'
import { useStore } from '@/components/store-provider'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useStore()

  const [order, setOrder] = useState<OrderResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    // 1. Get order ID from query params or sessionStorage
    const queryOrderId = searchParams.get('orderId')
    const sessionOrderId = typeof window !== 'undefined' ? sessionStorage.getItem('lastOrderId') : null
    const orderIdToVerify = queryOrderId || sessionOrderId

    if (!orderIdToVerify) {
      setLoading(false)
      setError(true)
      showToast({ message: 'No order ID found to verify.', type: 'error' })
      return
    }

    let intervalId: NodeJS.Timeout
    const MAX_ATTEMPTS = 15 // Polling up to 30 seconds

    const verifyOrder = async () => {
      try {
        const res = await apiClient.getOrderById(orderIdToVerify)
        const currentOrder = res.data.data
        setOrder(currentOrder)

        if (currentOrder.paymentStatus !== 'PENDING') {
          // Status is final!
          setLoading(false)
          clearInterval(intervalId)
          if (typeof window !== 'undefined') {
             sessionStorage.removeItem('lastOrderId')
          }
        } else {
          setAttempts(prev => {
            if (prev >= MAX_ATTEMPTS) {
              clearInterval(intervalId)
              setLoading(false)
              showToast({ message: 'Payment verification timed out. Check your orders page later.', type: 'error' })
            }
            return prev + 1
          })
        }
      } catch (err) {
        console.error('Failed to fetch order status', err)
        setError(true)
        setLoading(false)
        clearInterval(intervalId)
      }
    }

    // Initial check
    verifyOrder()

    // Poll every 2 seconds
    intervalId = setInterval(verifyOrder, 2000)

    return () => clearInterval(intervalId)
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="size-20 bg-muted/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <FaSpinner size={36} className="text-primary animate-spin" />
        </div>
        <h1 className="text-2xl font-black mb-2">Verifying Payment...</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          Please wait while we confirm your transaction securely with our backend. Do not close or refresh this page.
        </p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="size-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <FaCircleXmark size={36} className="text-destructive" />
        </div>
        <h1 className="text-2xl font-black mb-2 text-destructive">Verification Error</h1>
        <p className="text-muted-foreground text-sm max-w-md mb-8">
          We couldn't verify your payment status at this moment. If money was deducted, it will be automatically updated or refunded.
        </p>
        <Link href="/orders" className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
          View My Orders
        </Link>
      </div>
    )
  }

  const isSuccess = order.paymentStatus === 'SUCCESS'

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 py-12">
      <div className={`size-24 rounded-full flex items-center justify-center mb-6 shadow-inner ${isSuccess ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
        {isSuccess ? (
          <FaCircleCheck size={48} className="text-emerald-500" />
        ) : (
          <FaCircleXmark size={48} className="text-rose-500" />
        )}
      </div>
      
      <h1 className={`text-3xl font-black mb-2 tracking-tight ${isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
      </h1>
      
      <p className="text-muted-foreground max-w-md mb-8">
        {isSuccess 
          ? `Thank you for your order. Your order number is ${order.orderNumber}. We'll send you an update when it ships.`
          : 'Unfortunately, your payment could not be processed. Please try again with a different payment method.'
        }
      </p>
      
      <div className="rounded-2xl border border-border bg-card p-6 w-full max-w-sm mb-8 text-left shadow-xs">
        <h3 className="font-bold text-lg mb-4 border-b border-border pb-3">Order Details</h3>
        <div className="flex justify-between items-center text-sm mb-3">
          <span className="text-muted-foreground font-semibold">Order ID</span>
          <span className="font-mono font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between items-center text-sm mb-3">
          <span className="text-muted-foreground font-semibold">Amount</span>
          <span className="font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground font-semibold">Status</span>
          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
            isSuccess 
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
              : 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
          }`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        {isSuccess ? (
          <Link href="/orders" className="rounded-xl bg-primary px-8 py-3.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow">
            View My Orders
          </Link>
        ) : (
          <>
            <Link href="/orders" className="rounded-xl border border-border bg-card px-6 py-3.5 font-bold text-foreground hover:bg-muted transition-colors">
              Go to Orders
            </Link>
            <button 
              onClick={() => router.push('/checkout')}
              className="rounded-xl bg-primary px-6 py-3.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow flex items-center gap-2"
            >
              <FaRotateLeft /> Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
