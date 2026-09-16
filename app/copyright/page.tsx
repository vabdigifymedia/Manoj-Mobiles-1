import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Copyright,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Copyright Policy | Manoj Mobiles",
  description:
    "Copyright Policy governing the content, branding, images, graphics and other materials available on the Manoj Mobiles website.",
};

export default function CopyrightPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-primary text-sm font-semibold mb-5">
              <Copyright className="w-4 h-4" />
              Legal Information
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Copyright Policy
            </h1>

            <p className="mt-5 text-lg text-slate-600 leading-8">
              This policy explains the ownership and permitted use of content
              available on the Manoj Mobiles website.
            </p>

            <p className="mt-4 text-sm text-slate-500">
              Last Updated: September 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">

          {/* Ownership */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  1. Website Content Ownership
                </h2>

                <div className="space-y-4 text-slate-600 leading-7">
                  <p>
                    Unless otherwise stated, the content created specifically
                    for the Manoj Mobiles website, including website text,
                    graphics, layout, design elements, branding and original
                    materials, is owned by or used with permission by Manoj
                    Mobiles.
                  </p>

                  <p>
                    Such content may not be copied, reproduced, modified,
                    distributed, republished or commercially used without prior
                    written permission, except where permitted by applicable
                    law.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Trademarks */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  2. Trademarks & Brand Names
                </h2>

                <div className="space-y-4 text-slate-600 leading-7">
                  <p>
                    Manoj Mobiles and its associated branding, logos, names and
                    visual identity may be protected by applicable intellectual
                    property laws.
                  </p>

                  <p>
                    Product names, manufacturer names, logos and trademarks
                    displayed on this website belong to their respective
                    owners. Their appearance on the website does not imply
                    ownership by Manoj Mobiles.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Product Images */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Copyright className="w-5 h-5 text-primary" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  3. Product Images & Manufacturer Materials
                </h2>

                <div className="space-y-4 text-slate-600 leading-7">
                  <p>
                    Product photographs, specifications, logos and other
                    manufacturer-provided materials displayed on the website
                    may belong to the respective manufacturers, brands or
                    authorised rights holders.
                  </p>

                  <p>
                    Such materials are displayed for product identification,
                    information and purchasing purposes.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Permitted Use */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  4. Permitted Use
                </h2>

                <p className="text-slate-600 leading-7 mb-4">
                  You may access and use the website for lawful personal or
                  business purchasing purposes. You must not:
                </p>

                <ul className="space-y-3 text-slate-600">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    Copy substantial portions of website content for commercial
                    use without permission.
                  </li>

                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    Reproduce or redistribute website graphics, designs or
                    original materials as your own.
                  </li>

                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    Remove copyright, trademark or other ownership notices.
                  </li>

                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    Use website content in a manner that falsely suggests an
                    association with Manoj Mobiles.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Copyright Infringement */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  5. Copyright Infringement
                </h2>

                <div className="space-y-4 text-slate-600 leading-7">
                  <p>
                    Unauthorised reproduction, distribution, communication,
                    adaptation or other use of copyrighted material may
                    constitute infringement under applicable law.
                  </p>

                  <p>
                    Manoj Mobiles reserves the right to take appropriate action
                    where its own intellectual property rights are infringed,
                    subject to applicable law.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Third Party Rights */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  6. Third-Party Intellectual Property
                </h2>

                <p className="text-slate-600 leading-7">
                  Nothing on this website should be interpreted as granting
                  ownership or licence rights over third-party trademarks,
                  copyrighted materials, product names, logos or other
                  intellectual property belonging to their respective owners.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Copyright Concerns
            </h2>

            <p className="text-slate-600 leading-7">
              If you believe that material appearing on the Manoj Mobiles
              website infringes your copyright or other intellectual property
              rights, please contact us with sufficient information to identify
              the material and explain the basis of your concern.
            </p>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 mt-5 text-primary font-semibold hover:underline"
            >
              Contact Manoj Mobiles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>

          {/* Legal Note */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />

              <p className="text-sm text-slate-600 leading-6">
                This Copyright Policy is intended as general website
                information and does not replace applicable copyright law or
                professional legal advice. Copyright matters are governed by
                applicable law, including the Copyright Act, 1957 and related
                rules, as applicable.
              </p>
            </div>
          </section>

        </div>
      </section>
    </main>
  );
}