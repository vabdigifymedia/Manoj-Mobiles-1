"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTruckFast, FaShieldHalved, FaHeadset, FaCreditCard } from 'react-icons/fa6'

const features = [
  { icon: FaTruckFast, title: 'Fast & Free Delivery', desc: 'Get your device delivered within 24-48 hours across major cities.' },
  { icon: FaShieldHalved, title: '1 Year Warranty', desc: 'All smartphones come with a genuine manufacturer warranty.' },
  { icon: FaHeadset, title: '24/7 Support', desc: 'Our customer support team is always ready to help you.' },
  { icon: FaCreditCard, title: 'Secure Payments', desc: '100% secure payment gateways including UPI, Cards, and Wallets.' },
]

export function FeaturesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {/* Mobile Animated Carousel */}
      <div className="block lg:hidden relative w-full h-[260px]">
        <AnimatePresence mode="wait">
          {features.map((feature, index) => {
            if (index !== currentIndex) return null;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col items-center text-center rounded-3xl bg-background p-8 border border-border shadow-sm"
              >
                <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary mb-5">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
           {features.map((_, i) => (
             <button 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'}`} 
                onClick={() => setCurrentIndex(i)} 
                aria-label={`Go to slide ${i + 1}`}
             />
           ))}
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:grid gap-8 grid-cols-4">
        {features.map(feature => (
          <div key={feature.title} className="flex flex-col items-center text-center rounded-3xl bg-background p-8 transition hover:bg-muted border border-transparent hover:border-border">
            <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary mb-5 transition-transform hover:scale-110">
              <feature.icon size={28} />
            </div>
            <h3 className="text-lg font-bold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </>
  )
}
