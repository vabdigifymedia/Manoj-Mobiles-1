import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  FileText,
  Wrench,
  XCircle,
  AlertCircle,
  Clock3,
  PackageCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Warranty Policy | Manoj Mobiles",
  description:
    "Read the Warranty Policy of Manoj Mobiles covering manufacturer warranty, warranty claims, exclusions, service and required documents.",
};

const warrantySections = [
  {
    icon: ShieldCheck,
    number: "01",
    title: "Manufacturer Warranty",
    content:
      "Products sold by Manoj Mobiles may be covered by the manufacturer's warranty applicable to the specific brand and model. The warranty period, coverage and service conditions may vary depending on the product and manufacturer.",
    bullets: [
      "Warranty coverage is subject to the applicable manufacturer's terms.",
      "The warranty period begins according to the manufacturer's applicable purchase or activation terms.",
      "Warranty coverage may differ between smartphones, tablets, accessories and other products.",
      "Any additional or extended warranty will be subject to its specific terms and conditions.",
    ],
  },
  {
    icon: FileText,
    number: "02",
    title: "Proof of Purchase",
    content:
      "A valid purchase invoice may be required when submitting a warranty claim. Customers should retain their original invoice and other purchase documents for the duration of the applicable warranty period.",
    bullets: [
      "A valid Manoj Mobiles purchase invoice may be required.",
      "The invoice should contain sufficient product and purchase details.",
      "The product's IMEI, serial number or other identification details may be verified.",
      "Warranty service may be subject to successful verification of the purchase.",
    ],
  },
  {
    icon: Wrench,
    number: "03",
    title: "Warranty Service",
    content:
      "Warranty service is generally provided through the respective manufacturer's authorized service network. Depending on the brand, product and nature of the issue, the customer may be required to visit or contact an authorized service centre.",
    bullets: [
      "Warranty assessment may be performed by the manufacturer's authorized service centre.",
      "Repair or replacement decisions may be made according to the manufacturer's warranty terms.",
      "Service may be provided on a carry-in, pickup, doorstep or other applicable basis depending on the brand.",
      "Manoj Mobiles may assist customers in understanding the applicable warranty process.",
    ],
  },
  {
    icon: Smartphone,
    number: "04",
    title: "Warranty Coverage",
    content:
      "Manufacturer warranty generally applies to manufacturing defects or defects in materials and workmanship that occur during the applicable warranty period and under normal use. Exact coverage depends on the product manufacturer's warranty terms.",
    bullets: [
      "Manufacturing defects may be covered under the applicable warranty.",
      "Electrical or functional defects may be covered where permitted by the manufacturer.",
      "Warranty coverage is subject to inspection and verification by the authorized service centre.",
      "Specific components and accessories may have different warranty periods.",
    ],
  },
  {
    icon: XCircle,
    number: "05",
    title: "Warranty Exclusions",
    content:
      "Warranty coverage generally does not apply to damage or defects resulting from misuse, accidents, unauthorized modifications or other conditions excluded by the applicable manufacturer's warranty.",
    bullets: [
      "Physical damage, cracks, dents or broken parts caused after purchase.",
      "Liquid or moisture damage where excluded by the manufacturer.",
      "Damage caused by misuse, negligence or improper handling.",
      "Unauthorized repair, modification, rooting, tampering or alteration.",
      "Damage caused by incompatible accessories, chargers or other equipment where applicable.",
      "Normal wear and tear or cosmetic damage that does not affect functionality.",
      "Damage caused by abnormal voltage, electrical surge, fire, natural events or other external causes where excluded.",
    ],
  },
  {
    icon: AlertCircle,
    number: "06",
    title: "Software & Unauthorized Modifications",
    content:
      "Warranty coverage may be affected if the device has been modified outside the manufacturer's approved software or hardware environment. Certain software issues, data loss and problems caused by unauthorized modifications may fall outside warranty coverage.",
    bullets: [
      "Unauthorized software or hardware modifications may affect warranty eligibility.",
      "Rooting, jailbreaking or similar modifications may void applicable warranty coverage.",
      "Data loss is generally the customer's responsibility.",
      "Customers should maintain appropriate backups before submitting a device for service.",
    ],
  },
  {
    icon: PackageCheck,
    number: "07",
    title: "Accessories & Components",
    content:
      "Accessories supplied with a product may have warranty periods or coverage conditions different from the main device. Customers should refer to the applicable manufacturer's warranty terms for specific accessory coverage.",
    bullets: [
      "Chargers, cables, batteries and other accessories may have separate warranty terms.",
      "Warranty periods for accessories may differ from the main product.",
      "Consumable or wear-related components may have limited or no warranty coverage depending on the manufacturer.",
    ],
  },
  {
    icon: Clock3,
    number: "08",
    title: "Warranty Period",
    content:
      "The warranty period is determined by the applicable manufacturer and product. Customers should check their invoice, warranty documentation or the manufacturer's official warranty information for the exact coverage period applicable to their device.",
    bullets: [
      "Warranty duration may vary by brand and model.",
      "Extended warranty plans, if purchased, are governed by their separate terms.",
      "The remaining warranty period may continue after a repair according to the manufacturer's applicable policy.",
    ],
  },
];

function WarrantySection({
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

          {/* Description */}
          <p className="mt-5 leading-7 text-slate-600">
            {content}
          </p>

          {/* Points */}
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

export default function WarrantyPage() {
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
              <ShieldCheck className="h-4 w-4" />
              Customer Protection
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Warranty Policy
            </h1>

            {/* Description */}
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 md:text-lg">
              Understand the warranty coverage, service process, exclusions
              and requirements applicable to products purchased from Manoj
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
              <ShieldCheck className="h-5 w-5" />
            </div>

            <h3 className="font-semibold text-slate-900">
              Manufacturer Coverage
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Warranty coverage depends on the brand, model and applicable
              manufacturer terms.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <FileText className="h-5 w-5" />
            </div>

            <h3 className="font-semibold text-slate-900">
              Keep Your Invoice
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              A valid purchase invoice may be required to verify warranty
              eligibility.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Wrench className="h-5 w-5" />
            </div>

            <h3 className="font-semibold text-slate-900">
              Authorized Service
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Warranty assessment and service may be handled by the
              manufacturer's authorized service network.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== WARRANTY CONTENT ==================== */}
      <section className="mx-auto max-w-6xl space-y-5 px-4 pb-16 md:px-6">
        {warrantySections.map((section) => (
          <WarrantySection
            key={section.number}
            icon={section.icon}
            number={section.number}
            title={section.title}
            content={section.content}
            bullets={section.bullets}
          />
        ))}

        {/* ==================== CLAIM PROCESS ==================== */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 md:p-8">
          <div className="flex flex-col gap-7 md:flex-row md:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Wrench className="h-6 w-6" />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">
                09. How to Raise a Warranty Claim
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-blue-100 bg-white p-4">
                  <span className="text-xs font-bold text-blue-600">
                    STEP 01
                  </span>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                    Keep your invoice and product details ready.
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-4">
                  <span className="text-xs font-bold text-blue-600">
                    STEP 02
                  </span>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                    Contact Manoj Mobiles support regarding the issue.
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-4">
                  <span className="text-xs font-bold text-blue-600">
                    STEP 03
                  </span>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                    Follow the applicable manufacturer service process.
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-4">
                  <span className="text-xs font-bold text-blue-600">
                    STEP 04
                  </span>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                    Submit the product for inspection if required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== IMPORTANT ==================== */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                10. Important Warranty Information
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Manoj Mobiles does not independently determine whether a
                manufacturer's warranty claim is valid. Warranty eligibility,
                diagnosis, repair, replacement and applicable service
                decisions may be determined by the respective manufacturer's
                authorized service centre in accordance with its warranty
                terms.
              </p>

              <p className="mt-4 leading-7 text-slate-600">
                Customers should follow the manufacturer's instructions for
                warranty service and retain all relevant purchase documents.
              </p>
            </div>
          </div>
        </section>

        {/* ==================== EXTENDED WARRANTY ==================== */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Clock3 className="h-5 w-5" />
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  Extended Warranty
                </h2>
              </div>

              <p className="max-w-2xl leading-7 text-slate-600">
                If an extended warranty or protection plan is purchased,
                coverage will be governed by the terms of that specific plan
                in addition to any applicable manufacturer warranty.
              </p>
            </div>
          </div>
        </section>

        {/* ==================== CONTACT ==================== */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Need Help With Warranty?
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-500">
                If you are facing an issue with a product purchased from Manoj
                Mobiles, contact our support team with your order or invoice
                details so we can guide you through the applicable process.
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

        {/* ==================== OTHER POLICIES ==================== */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-slate-100 pt-8 text-sm">
          <Link
            href="/refund"
            className="font-medium text-slate-500 transition hover:text-blue-600"
          >
            Refund Policy
          </Link>

          <Link
            href="/returns"
            className="font-medium text-slate-500 transition hover:text-blue-600"
          >
            Returns & Cancellation
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

        {/* ==================== DISCLAIMER ==================== */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm leading-6 text-amber-800">
            <strong>Important:</strong> Warranty coverage, duration and
            service conditions vary by brand and product. The applicable
            manufacturer's warranty terms will govern the warranty service
            for the purchased product. Customers should refer to the
            manufacturer's official warranty documentation for product
            specific coverage.
          </p>
        </div>
      </section>
    </main>
  );
}