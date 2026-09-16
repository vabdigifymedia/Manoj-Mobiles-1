'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FaPhone,
  FaEnvelope,
  FaLocationDot,
  FaClock,
  FaArrowRight,
  FaHeadset,
} from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { StoreSettingResponseDTO } from '@/lib/types'

export default function ContactPage() {
  const [storeSettings, setStoreSettings] =
    useState<StoreSettingResponseDTO | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load cached settings first for faster display
    try {
      const cached = localStorage.getItem('manoj_store_settings')

      if (cached) {
        setStoreSettings(JSON.parse(cached))
      }
    } catch {}

    // Fetch latest settings from API
    apiClient
      .getPublicStoreSettings()
      .then((res) => {
        if (res.data?.data) {
          const data = res.data.data

          const logo =
            data?.logoUrl ||
            data?.storeLogo ||
            data?.storeLogoUrl ||
            data?.logo ||
            ''

          const normalized = {
            ...data,
            logoUrl: logo,
            storeLogo: logo,
            storeLogoUrl: logo,
            logo: logo,
          }

          setStoreSettings(normalized)

          localStorage.setItem(
            'manoj_store_settings',
            JSON.stringify(normalized)
          )
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
      })

    // Update immediately if Store Settings are changed elsewhere
    const handleUpdate = (
      e: CustomEvent<StoreSettingResponseDTO>
    ) => {
      if (e.detail) {
        setStoreSettings(e.detail)
      }
    }

    // Update when localStorage changes
    const handleStorage = () => {
      try {
        const cached = localStorage.getItem('manoj_store_settings')

        if (cached) {
          setStoreSettings(JSON.parse(cached))
        }
      } catch {}
    }

    window.addEventListener(
      'store_settings_updated',
      handleUpdate as EventListener
    )

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(
        'store_settings_updated',
        handleUpdate as EventListener
      )

      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const logoUrl =
    storeSettings?.logoUrl ||
    storeSettings?.storeLogo ||
    storeSettings?.storeLogoUrl ||
    storeSettings?.logo

  const storeName =
    storeSettings?.storeName || 'Manoj Mobiles'

  const storeAddress =
    storeSettings?.storeAddress ||
    'Store address will appear here'

  const supportPhone =
    storeSettings?.supportPhone ||
    ''

  const supportEmail =
    storeSettings?.supportEmail ||
    ''

  const phoneHref = supportPhone
    ? `tel:${supportPhone.replace(/\s+/g, '')}`
    : '#'

  const emailHref = supportEmail
    ? `mailto:${supportEmail}`
    : '#'

  if (loading && !storeSettings) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="animate-pulse">
            <div className="mx-auto h-4 w-24 rounded bg-muted" />
            <div className="mx-auto mt-4 h-12 max-w-md rounded bg-muted" />
            <div className="mx-auto mt-4 h-5 max-w-xl rounded bg-muted" />
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">

            {logoUrl && (
              <div className="mb-8 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-background p-3 shadow-sm">
                  <img
                    src={logoUrl}
                    alt={`${storeName} Logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}

            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-primary">
              Get In Touch
            </p>

            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Contact Us
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Have a question about a product, order, delivery, or anything
              else? Our team is here to help you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Address */}
          <div className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FaLocationDot size={22} />
            </div>

            <h2 className="text-xl font-bold text-foreground">
              Visit Us
            </h2>

            <p className="mt-3 text-sm leading-7 text-muted-foreground whitespace-pre-line">
              {storeAddress}
            </p>

            {storeAddress && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  storeAddress
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                Get Directions
                <FaArrowRight size={12} />
              </a>
            )}
          </div>

          {/* Phone */}
          <div className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FaPhone size={20} />
            </div>

            <h2 className="text-xl font-bold text-foreground">
              Call Us
            </h2>

            {supportPhone ? (
              <>
                <a
                  href={phoneHref}
                  className="mt-3 block text-lg font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {supportPhone}
                </a>

                <p className="mt-2 text-sm text-muted-foreground">
                  Call us for product, order and support assistance.
                </p>

                <a
                  href={phoneHref}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  Call Now
                  <FaArrowRight size={12} />
                </a>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Phone support details will appear here.
              </p>
            )}
          </div>

          {/* Email */}
          <div className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FaEnvelope size={21} />
            </div>

            <h2 className="text-xl font-bold text-foreground">
              Email Us
            </h2>

            {supportEmail ? (
              <>
                <a
                  href={emailHref}
                  className="mt-3 block break-all text-lg font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {supportEmail}
                </a>

                <p className="mt-2 text-sm text-muted-foreground">
                  Send us your questions and we will get back to you.
                </p>

                <a
                  href={emailHref}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  Send Email
                  <FaArrowRight size={12} />
                </a>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Email support details will appear here.
              </p>
            )}
          </div>
        </div>

        {/* Main Contact Area */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">

          {/* Contact Form */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                Send Us A Message
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight">
                How can we help?
              </h2>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Fill in the details below and our team will get back to you.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
              }}
              className="space-y-5"
            >
              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Full Name
                  </label>

                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Enter your name"
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-mobile"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Mobile Number
                  </label>

                  <input
                    id="contact-mobile"
                    type="tel"
                    placeholder="Enter mobile number"
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email Address
                </label>

                <input
                  id="contact-email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="mb-2 block text-sm font-semibold"
                >
                  Subject
                </label>

                <input
                  id="contact-subject"
                  type="text"
                  placeholder="What is your query about?"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-sm font-semibold"
                >
                  Message
                </label>

                <textarea
                  id="contact-message"
                  rows={6}
                  placeholder="Write your message..."
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:opacity-90 sm:w-auto"
              >
                Send Message
                <FaArrowRight size={13} />
              </button>
            </form>
          </div>

          {/* Support Card */}
          <div className="flex flex-col rounded-3xl bg-primary p-7 text-primary-foreground shadow-sm sm:p-9 lg:p-10">

            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/10">
              <FaHeadset size={24} />
            </div>

            <h2 className="mt-7 text-3xl font-black">
              Need Help?
            </h2>

            <p className="mt-4 text-sm leading-7 text-primary-foreground/80">
              Our customer support team is available to assist you with
              products, orders, payments, delivery and other queries.
            </p>

            <div className="mt-8 space-y-5">

              {supportPhone && (
                <a
                  href={phoneHref}
                  className="flex items-center gap-4 rounded-2xl bg-primary-foreground/10 p-4 transition hover:bg-primary-foreground/15"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
                    <FaPhone size={16} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-primary-foreground/60">
                      Call Support
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      {supportPhone}
                    </p>
                  </div>
                </a>
              )}

              {supportEmail && (
                <a
                  href={emailHref}
                  className="flex items-center gap-4 rounded-2xl bg-primary-foreground/10 p-4 transition hover:bg-primary-foreground/15"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
                    <FaEnvelope size={16} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-primary-foreground/60">
                      Email Support
                    </p>

                    <p className="mt-1 break-all text-sm font-bold">
                      {supportEmail}
                    </p>
                  </div>
                </a>
              )}

              <div className="flex items-start gap-4 rounded-2xl bg-primary-foreground/10 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
                  <FaClock size={16} />
                </div>

                <div>
                  <p className="text-xs font-medium text-primary-foreground/60">
                    Customer Support
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    We are here to help
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-10">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary-foreground hover:underline"
              >
                Continue Shopping
                <FaArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="mt-10 rounded-3xl border border-border bg-card p-7 text-center shadow-sm sm:p-10">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">
            {storeName}
          </p>

          <h2 className="mt-2 text-2xl font-black">
            We’re here to help
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Whether you need help choosing a smartphone, tracking an order,
            understanding a product, or resolving an issue, feel free to
            contact us.
          </p>
        </div>
      </section>
    </main>
  )
}