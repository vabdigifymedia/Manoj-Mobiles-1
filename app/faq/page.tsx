import { serverFetch } from '@/lib/apiClient'
import type { FaqResponseDTO } from '@/lib/types'
import { FaCircleQuestion } from 'react-icons/fa6'

export const metadata = {
  title: 'FAQs | Manoj Mobiles',
  description: 'Frequently asked questions about Manoj Mobiles products, orders, payments, delivery, returns and warranty.',
}

export default async function FAQPage() {
  const faqs = await serverFetch<FaqResponseDTO[]>('/api/public/faqs')

  const faqList = Array.isArray(faqs) ? faqs : []

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-20">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FaCircleQuestion size={28} />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Frequently Asked Questions
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Find answers to common questions about our products, orders,
            payments, delivery, returns and warranty.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {faqList.length > 0 ? (
          <div className="space-y-4">
            {faqList.map((faq, index) => (
              <details
                key={faq.id || index}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-5 font-bold text-foreground transition-colors hover:text-primary sm:px-6">
                  <span className="text-base sm:text-lg">
                    {faq.question}
                  </span>

                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200 group-open:rotate-45">
                    <span className="text-xl leading-none">+</span>
                  </span>
                </summary>

                <div className="border-t border-border px-5 pb-5 pt-4 sm:px-6">
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FaCircleQuestion size={22} />
            </div>

            <h2 className="text-xl font-bold text-foreground">
              No FAQs available
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Frequently asked questions will appear here once they are added
              from the Admin Panel.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}