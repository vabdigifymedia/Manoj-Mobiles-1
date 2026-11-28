'use client'

import { Suspense } from 'react'
import { FaSpinner } from 'react-icons/fa6'
import { PaymentStatusVerifier } from '@/components/payment/payment-status-verifier'

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <FaSpinner size={34} className="text-primary animate-spin" />
        </div>
      }
    >
      <PaymentStatusVerifier />
    </Suspense>
  )
}
