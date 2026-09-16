import type { Metadata } from "next";
import {
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  Clock3,
  PackageCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Refund Policy | Manoj Mobiles",
  description:
    "Read the Refund Policy of Manoj Mobiles covering refund eligibility, processing, payment methods and refund timelines.",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur">
              <RefreshCcw className="h-4 w-4" />
              Customer Policy
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Refund Policy
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
              At Manoj Mobiles, we aim to make the refund process simple,
              transparent and convenient for our customers.
            </p>

            <p className="mt-4 text-sm text-blue-200">
              Last Updated: September 2026
            </p>
          </div>
        </div>
      </section>

      {/* Quick Highlights */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <Highlight
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Secure Process"
            text="Refunds are processed through secure payment channels."
          />

          <Highlight
            icon={<CreditCard className="h-5 w-5" />}
            title="Original Payment Method"
            text="Refunds are generally sent back through the original payment method."
          />

          <Highlight
            icon={<Clock3 className="h-5 w-5" />}
            title="Processing Time"
            text="Actual credit time may depend on your bank or payment provider."
          />

          <Highlight
            icon={<PackageCheck className="h-5 w-5" />}
            title="Order Verification"
            text="Refund requests may be reviewed before approval."
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-10">

          {/* 1 */}
          <PolicySection
            number="01"
            title="Refund Eligibility"
          >
            <p>
              Refunds may be issued for eligible orders where a refund has
              been approved by Manoj Mobiles in accordance with the applicable
              order and product conditions.
            </p>

            <p>
              Eligibility may depend on the reason for the refund, the
              condition of the product, order verification and the applicable
              terms communicated at the time of purchase.
            </p>

            <p>
              A refund is not considered approved merely because a customer
              has submitted a request. The request may need to be reviewed
              and verified before processing.
            </p>
          </PolicySection>

          {/* 2 */}
          <PolicySection
            number="02"
            title="When a Refund May Be Issued"
          >
            <p>
              Subject to applicable terms, a refund may be considered in
              situations such as:
            </p>

            <ul className="mt-4 space-y-3">
              <Bullet>
                An eligible order is cancelled and the applicable amount is
                refundable.
              </Bullet>

              <Bullet>
                A product is approved for refund after verification.
              </Bullet>

              <Bullet>
                Manoj Mobiles is unable to fulfil an eligible order and the
                customer is entitled to a refund.
              </Bullet>

              <Bullet>
                A payment has been successfully received but the order cannot
                be processed for an applicable reason.
              </Bullet>

              <Bullet>
                A duplicate payment or other payment-related issue is
                confirmed by our team.
              </Bullet>
            </ul>
          </PolicySection>

          {/* 3 */}
          <PolicySection
            number="03"
            title="Refund for Damaged, Defective or Incorrect Products"
          >
            <p>
              If a customer receives a product that is damaged, defective or
              different from the product ordered, the issue should be reported
              to Manoj Mobiles as soon as possible.
            </p>

            <p>
              Depending on the nature of the issue, our team may request
              photographs, videos, order details, packaging information or
              other supporting information for verification.
            </p>

            <p>
              Once the issue has been reviewed and the refund is approved,
              the applicable refund amount will be processed according to the
              approved resolution.
            </p>
          </PolicySection>

          {/* 4 */}
          <PolicySection
            number="04"
            title="Refund After Order Cancellation"
          >
            <p>
              Where an order cancellation qualifies for a refund, the
              applicable refundable amount will be processed after the
              cancellation is confirmed.
            </p>

            <p>
              Cancellation eligibility, applicable deductions and cancellation
              conditions are governed by our separate{" "}
              <span className="font-semibold text-blue-700">
                Returns & Cancellation Policy
              </span>
              .
            </p>

            <p>
              Any applicable charges, deductions or non-refundable amounts
              will be communicated or applied according to the terms
              applicable to the order.
            </p>
          </PolicySection>

          {/* 5 */}
          <PolicySection
            number="05"
            title="Refund Method"
          >
            <p>
              Wherever possible, refunds will be processed through the
              original payment method used for the transaction.
            </p>

            <p>
              Depending on the payment method, bank, card issuer, payment
              gateway or other financial institution involved, the time taken
              for the refunded amount to appear in the customer's account may
              vary.
            </p>
          </PolicySection>

          {/* 6 */}
          <PolicySection
            number="06"
            title="Refund Processing Time"
          >
            <p>
              Once a refund has been approved and initiated by Manoj Mobiles,
              the amount may take additional time to reflect in the customer's
              bank account, card account or payment wallet.
            </p>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                <div>
                  <h3 className="font-semibold text-blue-950">
                    Important
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-blue-900/80">
                    Refund processing and bank crediting are separate stages.
                    Once Manoj Mobiles initiates the refund, the final credit
                    time may depend on the relevant bank, card issuer,
                    payment gateway or financial institution.
                  </p>
                </div>
              </div>
            </div>
          </PolicySection>

          {/* 7 */}
          <PolicySection
            number="07"
            title="Partial Refunds"
          >
            <p>
              In certain situations, only part of the amount paid may be
              refundable. This may apply where specific charges, deductions,
              discounts, offers or other applicable terms affect the
              refundable amount.
            </p>

            <p>
              The final refund amount will be determined after reviewing the
              order and the circumstances of the refund request.
            </p>
          </PolicySection>

          {/* 8 */}
          <PolicySection
            number="08"
            title="Offers, Discounts and Promotional Benefits"
          >
            <p>
              Where an order was placed using a promotional offer, discount,
              cashback, coupon or other benefit, the refund calculation may
              take the terms of that offer into account.
            </p>

            <p>
              Promotional benefits that have already been used or applied may
              not necessarily be refundable as cash.
            </p>
          </PolicySection>

          {/* 9 */}
          <PolicySection
            number="09"
            title="Payment Gateway and Bank Charges"
          >
            <p>
              Depending on the transaction and payment method, certain
              payment processing charges or transaction-related deductions may
              apply where permitted under the applicable terms.
            </p>

            <p>
              Any applicable deduction will be considered while calculating
              the final refundable amount.
            </p>
          </PolicySection>

          {/* 10 */}
          <PolicySection
            number="10"
            title="Refund Verification"
          >
            <p>
              Manoj Mobiles may verify an order, payment, customer details,
              product information and other relevant information before
              approving a refund.
            </p>

            <p>
              Customers may be asked to provide additional information or
              supporting documents where reasonably required to process the
              refund request.
            </p>
          </PolicySection>

          {/* 11 */}
          <PolicySection
            number="11"
            title="Refund Not Received"
          >
            <p>
              If you have received confirmation that your refund has been
              initiated but the amount has not yet appeared in your account,
              please first check the transaction details with your bank,
              card issuer or payment provider.
            </p>

            <p>
              If the amount still does not appear after the applicable
              processing period, you may contact Manoj Mobiles with your order
              number and refund details so that our team can assist you.
            </p>
          </PolicySection>

          {/* 12 */}
          <PolicySection
            number="12"
            title="Changes to the Refund Policy"
          >
            <p>
              Manoj Mobiles may update or modify this Refund Policy from time
              to time to reflect changes in our services, payment processes,
              business practices or applicable requirements.
            </p>

            <p>
              Any updated version will be published on this page with the
              corresponding revision date.
            </p>
          </PolicySection>

          {/* Contact */}
          <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <HelpCircle className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-blue-950">
                  Need Help With a Refund?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  If you have questions regarding a refund or need assistance
                  with an existing refund request, please contact Manoj
                  Mobiles customer support with your order details.
                </p>

                <p className="mt-4 text-sm font-medium text-blue-700">
                  Please keep your Order ID / Order Number ready when
                  contacting our support team.
                </p>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <p className="text-sm leading-6 text-amber-900">
              This Refund Policy should be read together with Manoj Mobiles'
              Terms of Service and Returns & Cancellation Policy. In case of
              any conflict between policies, the terms specifically applicable
              to the relevant order or transaction may apply.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------------------------------------
   Reusable Components
---------------------------------------------- */

function PolicySection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-slate-200 pb-10 last:border-0">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
          {number}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {title}
          </h2>

          <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
      <span>{children}</span>
    </li>
  );
}

function Highlight({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          {icon}
        </div>

        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}