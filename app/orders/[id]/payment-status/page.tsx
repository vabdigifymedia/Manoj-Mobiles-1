'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { FaLock, FaSpinner } from 'react-icons/fa6'
import { PaymentStatusVerifier } from '@/components/payment/payment-status-verifier'

function PaymentStatusFallback() {
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

function OrderPaymentStatusContent() {
  const params = useParams<{ id: string }>()
  return <PaymentStatusVerifier orderIdFromRoute={params?.id} />
}

export default function OrderPaymentStatusPage() {
  return (
    <Suspense fallback={<PaymentStatusFallback />}>
      <OrderPaymentStatusContent />
    </Suspense>
  )
}
