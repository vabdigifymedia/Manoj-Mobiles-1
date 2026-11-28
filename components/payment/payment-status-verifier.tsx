'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Cookies from 'js-cookie'
import {
  FaArrowRight,
  FaBoxOpen,
  FaCircleCheck,
  FaCircleXmark,
  FaClock,
  FaCreditCard,
  FaLock,
  FaRotate,
  FaRotateLeft,
  FaShieldHalved,
  FaSpinner,
  FaTruckFast,
} from 'react-icons/fa6'
import { apiClient, formatINR } from '@/lib/apiClient'
import { useAuth } from '@/lib/auth-context'
import { useStore } from '@/components/store-provider'
import type { OrderResponseDTO } from '@/lib/types'

export const PENDING_PAYMENT_ORDER_KEY = 'pendingPaymentOrderId'
const LEGACY_ORDER_KEY = 'lastOrderId'
const MAX_PENDING_POLLS = 3
const POLL_INTERVAL_MS = 3000

type VerificationPhase =
  | 'loading'
  | 'confirmed'
  | 'pending'
  | 'failed'
  | 'error'
  | 'auth_required'
  | 'missing'

interface PaymentVerifyPayload extends Partial<OrderResponseDTO> {
  orderId?: string
  message?: string
}

function classifyPaymentOutcome(data: PaymentVerifyPayload | null | undefined): 'SUCCESS' | 'PENDING' | 'FAILED' {
  const paymentStatus = String(data?.paymentStatus || '').toUpperCase()
  const orderStatus = String(data?.orderStatus || '').toUpperCase()

  if (
    paymentStatus === 'FAILED' ||
    orderStatus === 'PAYMENT_FAILED' ||
    orderStatus === 'CANCELLED'
  ) {
    return 'FAILED'
  }

  if (
    paymentStatus === 'SUCCESS' ||
    paymentStatus === 'PAID' ||
    paymentStatus === 'CAPTURED' ||
    ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(orderStatus)
  ) {
    return 'SUCCESS'
  }

  return 'PENDING'
}

function clearPendingSessionOrderId() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PENDING_PAYMENT_ORDER_KEY)
  sessionStorage.removeItem(LEGACY_ORDER_KEY)
}

interface PaymentStatusVerifierProps {
  orderIdFromRoute?: string
}

export function PaymentStatusVerifier({ orderIdFromRoute }: PaymentStatusVerifierProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { cart, clearCart, showToast } = useStore()

  const [phase, setPhase] = useState<VerificationPhase>('loading')
  const [order, setOrder] = useState<PaymentVerifyPayload | null>(null)
  const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(orderIdFromRoute ?? null)
  const [orderIdResolved, setOrderIdResolved] = useState(Boolean(orderIdFromRoute))
  const [pollAttempt, setPollAttempt] = useState(0)
  const [autoPolling, setAutoPolling] = useState(false)
  const [retryingPayment, setRetryingPayment] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [runNonce, setRunNonce] = useState(0)

  const clearCartRef = useRef(clearCart)
  const showToastRef = useRef(showToast)
  const abortTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    clearCartRef.current = clearCart
  }, [clearCart])

  useEffect(() => {
    showToastRef.current = showToast
  }, [showToast])

  // Resolve orderId once query/route/sessionStorage are available in browser
  useEffect(() => {
    const queryOrderId = searchParams.get('orderId')?.trim() || ''
    const merchantRef = searchParams.get('merchant_order_reference')?.trim() || ''
    const gatewayOrderId = searchParams.get('order_id')?.trim() || ''
    const sessionOrderId =
      typeof window !== 'undefined'
        ? sessionStorage.getItem(PENDING_PAYMENT_ORDER_KEY) ||
          sessionStorage.getItem(LEGACY_ORDER_KEY) ||
          ''
        : ''

    // Prefer route param / explicit orderId / sessionStorage pendingPaymentOrderId over gateway order_id
    const targetId =
      orderIdFromRoute?.trim() ||
      queryOrderId ||
      merchantRef ||
      sessionOrderId ||
      gatewayOrderId ||
      null

    setResolvedOrderId(targetId)
    setOrderIdResolved(true)
  }, [orderIdFromRoute, searchParams])

  const clearPendingTimer = useCallback(() => {
    if (abortTimerRef.current) {
      clearTimeout(abortTimerRef.current)
      abortTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (authLoading || !orderIdResolved) return

    cancelledRef.current = false
    clearPendingTimer()

    if (!resolvedOrderId) {
      setPhase('missing')
      return
    }

    const hasToken =
      isAuthenticated ||
      (typeof window !== 'undefined' && Boolean(Cookies.get('accessToken') || Cookies.get('refreshToken')))

    if (!hasToken) {
      setPhase('auth_required')
      return
    }

    const waitMs = (ms: number) =>
      new Promise<void>((resolve) => {
        abortTimerRef.current = setTimeout(resolve, ms)
      })

    const performVerifyCall = async (id: string): Promise<PaymentVerifyPayload> => {
      const res = await apiClient.verifyPayment(id)
      return ((res.data as any)?.data ?? res.data) as PaymentVerifyPayload
    }

    const runVerificationFlow = async () => {
      setPhase('loading')
      setPollAttempt(0)
      setAutoPolling(false)
      setErrorMessage('')

      try {
        const initialData = await performVerifyCall(resolvedOrderId)
        if (cancelledRef.current) return

        setOrder(initialData)
        const outcome = classifyPaymentOutcome(initialData)

        if (outcome === 'SUCCESS') {
          clearPendingSessionOrderId()
          await clearCartRef.current()
          if (!cancelledRef.current) {
            setPhase('confirmed')
          }
          return
        }

        if (outcome === 'FAILED') {
          setPhase('failed')
          return
        }

        // PENDING / PLACED: Poll verify-payment every 3 seconds up to 3 times
        setPhase('pending')
        setAutoPolling(true)

        for (let attempt = 1; attempt <= MAX_PENDING_POLLS; attempt++) {
          if (cancelledRef.current) return
          setPollAttempt(attempt)
          await waitMs(POLL_INTERVAL_MS)
          if (cancelledRef.current) return

          try {
            const polledData = await performVerifyCall(resolvedOrderId)
            if (cancelledRef.current) return

            setOrder(polledData)
            const polledOutcome = classifyPaymentOutcome(polledData)

            if (polledOutcome === 'SUCCESS') {
              clearPendingSessionOrderId()
              await clearCartRef.current()
              if (!cancelledRef.current) {
                setAutoPolling(false)
                setPhase('confirmed')
              }
              return
            }

            if (polledOutcome === 'FAILED') {
              setAutoPolling(false)
              setPhase('failed')
              return
            }
          } catch (pollErr: any) {
            if (cancelledRef.current) return
            if (pollErr?.response?.status === 401 || pollErr?.response?.status === 403) {
              setAutoPolling(false)
              setPhase('auth_required')
              return
            }
            // Stop auto-polling on transient API error; keep Retry Payment available
            setAutoPolling(false)
            setErrorMessage(
              pollErr?.response?.data?.message || 'Unable to reach payment gateway right now.'
            )
            return
          }
        }

        if (!cancelledRef.current) {
          setAutoPolling(false)
        }
      } catch (err: any) {
        if (cancelledRef.current) return
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          setPhase('auth_required')
          return
        }
        setErrorMessage(
          err?.response?.data?.message ||
            'Could not verify your payment status with Pine Labs. Please check again or view your orders.'
        )
        setPhase('error')
      }
    }

    runVerificationFlow()

    return () => {
      cancelledRef.current = true
      clearPendingTimer()
    }
  }, [authLoading, orderIdResolved, isAuthenticated, resolvedOrderId, runNonce, clearPendingTimer])

  const handleRetryPayment = async () => {
    if (!resolvedOrderId) return
    cancelledRef.current = true
    clearPendingTimer()
    setAutoPolling(false)
    setRetryingPayment(true)
    setErrorMessage('')

    try {
      sessionStorage.setItem(PENDING_PAYMENT_ORDER_KEY, resolvedOrderId)
      const res = await apiClient.retryPayment(resolvedOrderId)
      const payload = ((res.data as any)?.data ?? res.data) as PaymentVerifyPayload
      const nextPaymentUrl = payload?.paymentUrl || (res.data as any)?.paymentUrl

      if (nextPaymentUrl) {
        showToastRef.current({
          message: 'Redirecting to Pine Labs payment gateway...',
          type: 'info',
        })
        window.location.href = nextPaymentUrl
        return
      }

      // Fallback: if retry returned already-settled order without paymentUrl, re-verify
      if (classifyPaymentOutcome(payload) === 'SUCCESS') {
        clearPendingSessionOrderId()
        await clearCartRef.current()
        setOrder(payload)
        setPhase('confirmed')
        return
      }

      showToastRef.current({
        message: 'Could not generate a new Pine Labs payment link. Please place a fresh order.',
        type: 'error',
      })
      setRetryingPayment(false)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Failed to initiate payment retry. Please try again.'
      setErrorMessage(msg)
      showToastRef.current({ message: msg, type: 'error' })
      setRetryingPayment(false)
    }
  }

  const handlePlaceFreshOrder = () => {
    clearPendingSessionOrderId()
    const hasCartItems = (cart?.items?.length || 0) > 0
    router.push(hasCartItems ? '/checkout' : '/shop')
  }

  const effectiveId = order?.id || order?.orderId || resolvedOrderId || ''
  const trackingHref = effectiveId ? `/orders/${effectiveId}/tracking` : '/account/orders'
  const orderDetailHref = effectiveId ? `/account/orders/${effectiveId}` : '/account/orders'

  const loginRedirectUrl = (() => {
    const base = pathname || '/payment/callback'
    const query = resolvedOrderId && !orderIdFromRoute ? `?orderId=${encodeURIComponent(resolvedOrderId)}` : ''
    return `/auth?redirect=${encodeURIComponent(`${base}${query}`)}`
  })()

  // 1. Loading Spinner ("Verifying your payment with Pine Labs...")
  if (authLoading || !orderIdResolved || phase === 'loading') {
    return (
      <div className="mx-auto flex min-h-[68vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-full rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-white shadow-inner">
            <FaSpinner size={34} className="animate-spin" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Verifying your payment with Pine Labs...
          </h1>
          <p className="mt-2.5 text-sm font-medium text-muted-foreground leading-relaxed">
            Please wait while we securely confirm your transaction. Do not close or refresh this page.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <FaLock size={11} /> Encrypted Verification
          </div>
        </div>
      </div>
    )
  }

  // 2. Missing Order ID
  if (phase === 'missing') {
    return (
      <div className="mx-auto flex min-h-[68vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-full rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-zinc-200">
            <FaBoxOpen size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">No Pending Payment Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t find an active order reference in this session. You can check your recent orders to view payment status.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/account/orders"
              className="w-full sm:w-auto rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View My Orders
            </Link>
            <Link
              href="/shop"
              className="w-full sm:w-auto rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 3. Sign In Required
  if (phase === 'auth_required') {
    return (
      <div className="mx-auto flex min-h-[68vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-full rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-white">
            <FaShieldHalved size={34} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Sign In to Verify Payment</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your session needs to be verified before we can fetch your payment status from Pine Labs.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={loginRedirectUrl}
              className="w-full sm:w-auto rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign In &amp; Verify
            </Link>
            <Link
              href="/account/orders"
              className="w-full sm:w-auto rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            >
              Go to My Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 4. Order Confirmed (`SUCCESS` / `CONFIRMED`)
  if (phase === 'confirmed') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-full rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm">
          <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-inner">
            <FaCircleCheck size={48} />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3">
            Payment Verified • Pine Labs
          </span>

          <h1 className="text-3xl font-black tracking-tight text-foreground">Order Confirmed!</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Thank you for shopping with Manoj Mobiles. Your payment is confirmed
            {order?.orderNumber ? ` for order ${order.orderNumber}` : ''} and we are preparing your items.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-5 text-left space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-semibold">Order Number</span>
              <span className="font-mono font-bold text-foreground">
                {order?.orderNumber || effectiveId}
              </span>
            </div>
            {order?.totalAmount != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-semibold">Amount Paid</span>
                <span className="font-black text-foreground">{formatINR(order.totalAmount)}</span>
              </div>
            )}
            {order?.paymentMethod && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-semibold">Payment Method</span>
                <span className="font-bold text-foreground">{order.paymentMethod}</span>
              </div>
            )}
            {order?.txnId && (
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-muted-foreground font-semibold shrink-0">Transaction ID</span>
                <span className="font-mono text-xs font-bold text-foreground truncate">{order.txnId}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/60">
              <span className="text-muted-foreground font-semibold">Status</span>
              <span className="rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">
                {order?.orderStatus || 'CONFIRMED'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href={trackingHref}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <FaTruckFast size={15} /> Track Order <FaArrowRight size={13} />
            </Link>
            <Link
              href={orderDetailHref}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            >
              Order Details
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 5. Pending (`PENDING` / `PLACED`)
  if (phase === 'pending') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-full rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm">
          <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-zinc-100 shadow-inner">
            {autoPolling ? (
              <FaSpinner size={40} className="animate-spin" />
            ) : (
              <FaClock size={40} />
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700 dark:text-zinc-200 dark:bg-zinc-800 mb-3">
            {autoPolling
              ? `Checking Pine Labs (${pollAttempt} / ${MAX_PENDING_POLLS})`
              : 'Payment Confirmation Pending'}
          </span>

          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {autoPolling ? 'Confirming Payment...' : 'Payment Still Pending'}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {autoPolling
              ? 'Pine Labs is still finalizing your transaction. We are automatically rechecking every 3 seconds.'
              : 'Your payment has not been confirmed yet. You can retry payment now or check status again.'}
          </p>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
              {errorMessage}
            </div>
          )}

          <div className="mt-7 rounded-2xl border border-border bg-muted/30 p-5 text-left space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-semibold">Order Number</span>
              <span className="font-mono font-bold text-foreground">
                {order?.orderNumber || effectiveId}
              </span>
            </div>
            {order?.totalAmount != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-semibold">Amount</span>
                <span className="font-black text-foreground">{formatINR(order.totalAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/60">
              <span className="text-muted-foreground font-semibold">Payment / Order Status</span>
              <span className="rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-black uppercase text-blue-700 dark:bg-zinc-800 dark:text-zinc-200">
                {order?.paymentStatus || 'PENDING'} • {order?.orderStatus || 'PLACED'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleRetryPayment}
              disabled={retryingPayment}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {retryingPayment ? (
                <>
                  <FaSpinner size={14} className="animate-spin" /> Redirecting...
                </>
              ) : (
                <>
                  <FaCreditCard size={14} /> Retry Payment
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setRunNonce((n) => n + 1)}
              disabled={retryingPayment || autoPolling}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3.5 text-sm font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <FaRotate size={13} /> Verify Now
            </button>
          </div>

          <div className="mt-5">
            <Link
              href={orderDetailHref}
              className="text-xs font-bold text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              View Order Details
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 6. Failed (`FAILED` / `PAYMENT_FAILED`)
  if (phase === 'failed') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-full rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm">
          <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-inner">
            <FaCircleXmark size={48} />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-3">
            Transaction Failed
          </span>

          <h1 className="text-3xl font-black tracking-tight text-foreground">Payment Failed</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {order?.message ||
              'Your online payment could not be completed or was declined by Pine Labs. If any amount was debited, it will be automatically refunded.'}
          </p>

          <div className="mt-7 rounded-2xl border border-border bg-muted/30 p-5 text-left space-y-3">
            {(order?.orderNumber || effectiveId) && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-semibold">Order Reference</span>
                <span className="font-mono font-bold text-foreground">
                  {order?.orderNumber || effectiveId}
                </span>
              </div>
            )}
            {order?.totalAmount != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-semibold">Amount</span>
                <span className="font-bold text-foreground">{formatINR(order.totalAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/60">
              <span className="text-muted-foreground font-semibold">Status</span>
              <span className="rounded-md bg-rose-500/15 px-2.5 py-0.5 text-xs font-black uppercase text-rose-700 dark:text-rose-400">
                {order?.orderStatus || 'PAYMENT_FAILED'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handlePlaceFreshOrder}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <FaRotateLeft size={14} /> Place a Fresh Order
            </button>
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            >
              My Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 7. Unexpected Verification Request Error
  return (
    <div className="mx-auto flex min-h-[68vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-inner">
          <FaCircleXmark size={36} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Verification Error</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{errorMessage}</p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => setRunNonce((n) => n + 1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <FaRotate size={13} /> Verify Again
          </button>
          <button
            type="button"
            onClick={handleRetryPayment}
            disabled={retryingPayment || !resolvedOrderId}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <FaCreditCard size={13} /> Retry Payment
          </button>
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
          >
            My Orders
          </Link>
        </div>
      </div>
    </div>
  )
}
