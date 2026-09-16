import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  PackageCheck,
  Truck,
  Clock3,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Returns & Cancellation Policy | Manoj Mobiles",
  description:
    "Read the Returns and Cancellation Policy of Manoj Mobiles, including order cancellation, return eligibility, replacement and refund conditions.",
};

const policySections = [
  {
    icon: PackageCheck,
    number: "01",
    title: "Return Eligibility",
    content:
      "Products purchased from Manoj Mobiles may be eligible for return or replacement if they meet the applicable eligibility requirements. The product should be returned in its original condition along with the original packaging, accessories, manuals, invoice and other items supplied with the product.",
    bullets: [
      "The product should be in its original condition.",
      "Original box, accessories, manuals and supplied items should be retained.",
      "The original purchase invoice or valid proof of purchase may be required.",
      "Products showing signs of misuse, unauthorized modification or avoidable damage may not be accepted.",
    ],
  },
  {
    icon: RefreshCcw,
    number: "02",
    title: "Return & Replacement Requests",
    content:
      "If you receive a damaged, defective, incorrect or incomplete product, please contact Manoj Mobiles support as soon as possible after delivery. Our team may request photographs, videos, unboxing evidence or other information to verify the issue.",
    bullets: [
      "The issue may be reviewed before a return or replacement is approved.",
      "Depending on the product and issue, a replacement may be offered instead of a return.",
      "The final resolution may depend on product availability and applicable manufacturer or seller terms.",
    ],
  },
  {
    icon: XCircle,
    number: "03",
    title: "Non-Returnable Situations",
    content:
      "A return or replacement request may not be accepted if the product has been misused, physically damaged after delivery, modified, repaired by an unauthorized person or returned without required accessories or packaging.",
    bullets: [
      "Physical damage caused after delivery.",
      "Liquid damage or damage caused by improper use.",
      "Unauthorized repair, modification or tampering.",
      "Missing accessories, documents or original packaging where applicable.",
      "Damage caused by incorrect installation, handling or operation.",
    ],
  },
  {
    icon: Clock3,
    number: "04",
    title: "Order Cancellation",
    content:
      "Customers may request cancellation of an order before the order is dispatched. Once an order has been dispatched or handed over to a delivery partner, cancellation may not be possible through the normal cancellation process.",
    bullets: [
      "Cancellation requests should be made as early as possible.",
      "Orders that have already been dispatched may not be cancellable.",
      "If cancellation is accepted after payment, the applicable refund will be processed according to the Refund Policy.",
    ],
  },
  {
    icon: Truck,
    number: "05",
    title: "Return Pickup & Shipping",
    content:
      "Where a return is approved, Manoj Mobiles may arrange a return pickup or provide instructions for returning the product. Customers should securely pack the product with its original accessories and documentation.",
    bullets: [
      "Keep the product safely packed until the return process is completed.",
      "Do not send products to any address unless instructed by Manoj Mobiles.",
      "Return shipping arrangements may vary depending on the reason for return and product category.",
    ],
  },
  {
    icon: AlertCircle,
    number: "06",
    title: "Damaged or Incorrect Product",
    content:
      "If the product received is damaged, incorrect or materially different from the product ordered, please contact our support team promptly. Verification may be required before a replacement, return or refund is approved.",
    bullets: [
      "Keep the original packaging and shipping materials.",
      "Provide clear photographs or videos when requested.",
      "Do not discard the product or accessories before the issue is resolved.",
    ],
  },
  {
    icon: ShieldCheck,
    number: "07",
    title: "Manufacturer Warranty",
    content:
      "Some products may be covered by a manufacturer's warranty. Warranty-related issues may be handled according to the applicable manufacturer's warranty terms and service procedures. A warranty claim is separate from the return or cancellation process.",
    bullets: [
      "Warranty coverage depends on the product and manufacturer.",
      "Warranty coverage does not automatically mean that a product can be returned.",
      "Customers may be required to contact an authorized service centre for certain issues.",
    ],
  },
];

function PolicySection({
  icon: Icon,
  number,
  title,
  content,
  bullets,
}: {
  icon: React.ElementType;
  number: string;
  title: string;
  content: string;
  bullets: string[];
}) {
  return (
    <section className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-md md:p-8">
      <div className="flex gap-5">
        {/* Number */}
        <div className="hidden shrink-0 pt-1 text-sm font-bold text-blue-600 sm:block">
          {number}
        </div>

        <div className="min-w-0 flex-1">
          {/* Heading */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon className="h-5 w-5" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {title}
            </h2>
          </div>

          {/* Content */}
          <p className="mt-5 leading-7 text-slate-600">
            {content}
          </p>

          {/* Bullets */}
          <ul className="mt-5 space-y-3">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 text-sm leading-6 text-slate-600"
              >
                <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-blue-600" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ==================== HERO ==================== */}
      <section className="border-b border-slate-100 bg-transparent">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          {/* Back */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            {/* Label */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
              <RefreshCcw className="h-4 w-4" />
              Customer Policy
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Returns & Cancellation Policy
            </h1>

            {/* Description */}
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 md:text-lg">
              Please review our return, replacement and order cancellation
              guidelines before placing or cancelling an order with Manoj
              Mobiles.
            </p>

            {/* Updated */}
            <p className="mt-6 text-sm font-medium text-slate-400">
              Last Updated: September 2026
            </p>
          </div>
        </div>
      </section>

      {/* ==================== QUICK INFO ==================== */}
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <PackageCheck className="h-5 w-5" />
            </div>

            <h3 className="font-semibold text-slate-900">
              Product Condition
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Returns are subject to product condition and applicable
              eligibility requirements.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Clock3 className="h-5 w-5" />
            </div>

            <h3 className="font-semibold text-slate-900">
              Cancellation
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Cancellation requests should be submitted before the order is
              dispatched.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <h3 className="font-semibold text-slate-900">
              Verification
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Returns and replacements may require verification by our team.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== POLICY CONTENT ==================== */}
      <section className="mx-auto max-w-6xl space-y-5 px-4 pb-16 md:px-6">
        {policySections.map((section) => (
          <PolicySection
            key={section.number}
            icon={section.icon}
            number={section.number}
            title={section.title}
            content={section.content}
            bullets={section.bullets}
          />
        ))}

        {/* ==================== REFUND ==================== */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <RefreshCcw className="h-5 w-5" />
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  08. Refunds
                </h2>
              </div>

              <p className="max-w-2xl leading-7 text-slate-600">
                Where an approved cancellation or return results in a refund,
                the refund will be processed according to the applicable
                payment method and our Refund Policy.
              </p>
            </div>

            <Link
              href="/refund"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View Refund Policy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ==================== CHANGES ==================== */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                09. Changes to This Policy
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Manoj Mobiles may update this Returns & Cancellation Policy
                from time to time. Any updated version will be published on
                this page with the revised update date.
              </p>
            </div>
          </div>
        </section>

        {/* ==================== CONTACT ==================== */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Need Help With a Return?
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-500">
                If you have received a damaged, defective or incorrect product,
                or need help with an order cancellation, please contact Manoj
                Mobiles support with your order details.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Contact Support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ==================== IMPORTANT NOTE ==================== */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm leading-6 text-amber-800">
            <strong>Important:</strong> Return, replacement and cancellation
            requests are subject to verification and the applicable terms for
            the product and order. This policy should be read together with
            the Terms & Conditions, Warranty Policy and Refund Policy.
          </p>
        </div>

        {/* ==================== OTHER POLICIES ==================== */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-slate-100 pt-8 text-sm">
          <Link
            href="/refund"
            className="font-medium text-slate-500 transition hover:text-blue-600"
          >
            Refund Policy
          </Link>

          <Link
            href="/warranty"
            className="font-medium text-slate-500 transition hover:text-blue-600"
          >
            Warranty Policy
          </Link>

          <Link
            href="/privacy"
            className="font-medium text-slate-500 transition hover:text-blue-600"
          >
            Privacy Policy
          </Link>

          <Link
            href="/terms"
            className="font-medium text-slate-500 transition hover:text-blue-600"
          >
            Terms & Conditions
          </Link>
        </div>
      </section>
    </main>
  );
}