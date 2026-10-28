'use client'

import Link from 'next/link'
import { FaArrowRight, FaCheck } from 'react-icons/fa6'

export function EmiEligibilityBanner() {
  const points = [
    'Choose a phone from our catalogue',
    'Submit your eligibility enquiry securely',
    'Get guidance on the next steps',
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:py-8 lg:px-8">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 md:p-10 shadow-xs">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          {/* Left Column: Content */}
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              EMI Financing
            </p>

            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
              Find Out If You Can Buy Your Next Phone on EMI
            </h2>

            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Choose your preferred smartphone and submit an eligibility enquiry. Our team will review your details and guide you through the next steps.
            </p>

            {/* Three concise points */}
            <ul className="mt-6 space-y-3">
              {points.map((point, index) => (
                <li key={index} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <FaCheck size={10} />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            {/* CTA & Disclaimer */}
            <div className="mt-8 pt-2">
              <Link
                href="/emi-eligibility"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                <span>Check EMI Eligibility</span>
                <FaArrowRight size={13} />
              </Link>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed max-w-md">
                Eligibility is subject to verification and financing-partner approval. Submitting an enquiry does not guarantee approval.
              </p>
            </div>
          </div>

          {/* Right Column: Clean, Realistic EMI Eligibility Workflow Panel */}
          <div className="lg:pl-6">
            <div className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Enquiry Workflow
                  </span>
                  <p className="text-base font-extrabold text-foreground mt-0.5">
                    How it works
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary">
                  3 Simple Steps
                </span>
              </div>

              {/* Steps timeline */}
              <div className="mt-5 space-y-4">
                <div className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      1
                    </span>
                    <span className="w-0.5 flex-1 bg-border my-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-xs font-bold text-foreground">Choose a phone</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pick your desired model and brand from our live catalogue.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      2
                    </span>
                    <span className="w-0.5 flex-1 bg-border my-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-xs font-bold text-foreground">Submit eligibility enquiry</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Provide contact details with optional secure verification proofs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      3
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Partner review & guidance</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Our desk reviews eligibility with financing partners and contacts you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Info note */}
              <div className="mt-5 rounded-xl border border-border bg-card p-3.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Estimated EMI Tenure</span>
                <span className="font-bold text-foreground">3 to 24 Months</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
