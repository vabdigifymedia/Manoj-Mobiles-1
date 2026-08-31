'use client'

import React, { createContext, useContext, useState } from 'react'
import { BulkInquiryModal, BulkInquiryTarget } from './bulk-inquiry-modal'

export type { BulkInquiryTarget }

interface BulkInquiryContextType {
  openBulkInquiry: (target?: BulkInquiryTarget | null) => void
  closeBulkInquiry: () => void
  isOpen: boolean
  target: BulkInquiryTarget | null
}

const BulkInquiryContext = createContext<BulkInquiryContextType | undefined>(undefined)

export function BulkInquiryProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [target, setTarget] = useState<BulkInquiryTarget | null>(null)

  const openBulkInquiry = (targetData?: BulkInquiryTarget | null) => {
    setTarget(targetData || null)
    setIsOpen(true)
  }

  const closeBulkInquiry = () => {
    setIsOpen(false)
    setTarget(null)
  }

  return (
    <BulkInquiryContext.Provider value={{ openBulkInquiry, closeBulkInquiry, isOpen, target }}>
      {children}
      <BulkInquiryModal
        isOpen={isOpen}
        onClose={closeBulkInquiry}
        target={target}
      />
    </BulkInquiryContext.Provider>
  )
}

export function useBulkInquiry() {
  const context = useContext(BulkInquiryContext)
  if (!context) {
    throw new Error('useBulkInquiry must be used within a BulkInquiryProvider')
  }
  return context
}
