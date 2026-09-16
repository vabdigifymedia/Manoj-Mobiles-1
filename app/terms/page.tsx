import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  ShoppingCart,
  CreditCard,
  Truck,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Scale,
  RefreshCcw,
} from "lucide-react";

export const metadata = {
  title: "Terms of Service | Manoj Mobiles",
  description:
    "Terms of Service governing the use of the Manoj Mobiles website, products, orders, payments, delivery and related services.",
};

const termsSections = [
  {
    number: "01",
    title: "Acceptance of Terms",
    icon: FileText,
    content: (
      <>
        <p>
          Welcome to Manoj Mobiles. By accessing, browsing, registering on, or
          purchasing products through this website, you agree to be bound by
          these Terms of Service and the policies referenced on this website.
        </p>
        <p>
          If you do not agree with any part of these Terms, please do not use
          the website or place an order through it.
        </p>
      </>
    ),
  },
  {
    number: "02",
    title: "Website & Services",
    icon: ShoppingCart,
    content: (
      <>
        <p>
          Manoj Mobiles provides an online platform for browsing, comparing and
          purchasing mobile phones, electronics, accessories and related
          products.
        </p>
        <p>
          We may update, modify, suspend or discontinue any part of the website,
          product catalogue or service from time to time without prior notice.
        </p>
      </>
    ),
  },
  {
    number: "03",
    title: "Product Information",
    icon: CheckCircle2,
    content: (
      <>
        <p>
          We make reasonable efforts to display product descriptions,
          specifications, images, colours, prices and availability accurately.
        </p>
        <p>
          However, product images may vary slightly from the actual product,
          and specifications, colours, packaging or included accessories may
          change according to the manufacturer.
        </p>
        <p>
          Manufacturer specifications and official product documentation shall
          prevail where applicable.
        </p>
      </>
    ),
  },
  {
    number: "04",
    title: "Pricing & Availability",
    icon: CreditCard,
    content: (
      <>
        <p>
          Product prices and availability displayed on the website may change
          from time to time.
        </p>
        <p>
          We reserve the right to correct pricing, product information or
          availability errors. If an order is affected by a significant error,
          we may contact you before processing the order or cancel the affected
          order and provide an appropriate refund where applicable.
        </p>
        <p>
          Any applicable taxes, delivery charges or other charges will be
          displayed during the purchase process where applicable.
        </p>
      </>
    ),
  },
  {
    number: "05",
    title: "Orders & Order Acceptance",
    icon: ShoppingCart,
    content: (
      <>
        <p>
          Placing an order on the website constitutes a request to purchase the
          selected product. An order is not necessarily accepted until it has
          been confirmed by Manoj Mobiles.
        </p>
        <p>
          We may refuse or cancel an order in situations including product
          unavailability, pricing or listing errors, payment issues,
          suspected fraudulent activity, incorrect customer information or
          other legitimate business reasons.
        </p>
        <p>
          If an order is cancelled after payment has been received, the
          applicable amount will be refunded according to the payment method
          and our Refund Policy.
        </p>
      </>
    ),
  },
  {
    number: "06",
    title: "Payments",
    icon: CreditCard,
    content: (
      <>
        <p>
          Payments must be completed using the payment methods made available
          on the website.
        </p>
        <p>
          Payment processing may be handled through third-party payment
          gateways. Manoj Mobiles does not store complete card details unless
          expressly stated in the applicable payment process.
        </p>
        <p>
          You agree to provide accurate billing and payment information and
          confirm that you are authorised to use the selected payment method.
        </p>
      </>
    ),
  },
  {
    number: "07",
    title: "Delivery & Shipping",
    icon: Truck,
    content: (
      <>
        <p>
          Orders will be delivered to the address provided by the customer
          during checkout.
        </p>
        <p>
          Delivery timelines are estimates and may be affected by factors such
          as location, logistics partners, weather, public holidays, product
          availability or circumstances beyond our reasonable control.
        </p>
        <p>
          Customers are responsible for providing a complete and accurate
          delivery address and reachable contact details.
        </p>
      </>
    ),
  },
  {
    number: "08",
    title: "Returns, Cancellations & Refunds",
    icon: RefreshCcw,
    content: (
      <>
        <p>
          Returns, cancellations and refunds are governed by our separate
          Return & Cancellation Policy and Refund Policy.
        </p>
        <p>
          Customers should review those policies before placing an order.
          Certain products may have specific return, replacement or
          cancellation conditions.
        </p>
        <Link
          href="/returns"
          className="inline-flex items-center gap-2 mt-3 text-primary font-semibold hover:underline"
        >
          View Return & Cancellation Policy
          <ArrowRight className="w-4 h-4" />
        </Link>
      </>
    ),
  },
  {
    number: "09",
    title: "Manufacturer Warranty",
    icon: ShieldCheck,
    content: (
      <>
        <p>
          Manufacturer warranty coverage, where applicable, is provided
          according to the terms and conditions of the respective manufacturer.
        </p>
        <p>
          Warranty claims may require the original invoice or proof of
          purchase. Warranty service is generally subject to the manufacturer's
          authorised service process and applicable exclusions.
        </p>
        <p>
          Physical damage, liquid damage, unauthorised repairs or modifications,
          misuse and other exclusions may affect warranty eligibility.
        </p>
        <Link
          href="/warranty"
          className="inline-flex items-center gap-2 mt-3 text-primary font-semibold hover:underline"
        >
          View Warranty Policy
          <ArrowRight className="w-4 h-4" />
        </Link>
      </>
    ),
  },
  {
    number: "10",
    title: "Customer Accounts",
    icon: UserCheck,
    content: (
      <>
        <p>
          If the website allows you to create an account, you are responsible
          for maintaining the confidentiality of your login credentials and for
          activity carried out through your account.
        </p>
        <p>
          You agree to provide accurate and current information and to notify us
          if you believe your account has been accessed without authorisation.
        </p>
      </>
    ),
  },
  {
    number: "11",
    title: "Acceptable Use",
    icon: AlertCircle,
    content: (
      <>
        <p>You agree not to:</p>
        <ul className="space-y-2 mt-3">
          <li className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            Use the website for unlawful or fraudulent purposes.
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            Provide false, misleading or unauthorised information.
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            Attempt to interfere with the security or operation of the website.
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            Use automated methods to access, scrape or copy website content
            without permission.
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            Attempt to gain unauthorised access to another user's account or
            restricted areas.
          </li>
        </ul>
      </>
    ),
  },
  {
    number: "12",
    title: "Intellectual Property",
    icon: FileText,
    content: (
      <>
        <p>
          Unless otherwise stated, the website and its content, including
          branding, logos, text, graphics, images, layout and other materials,
          are owned by or licensed to Manoj Mobiles and are protected by
          applicable intellectual property laws.
        </p>
        <p>
          You may use the website for personal and lawful shopping purposes.
          Content may not be reproduced, modified, distributed or commercially
          exploited without appropriate permission.
        </p>
      </>
    ),
  },
  {
    number: "13",
    title: "Third-Party Services",
    icon: ShieldCheck,
    content: (
      <>
        <p>
          The website may use third-party services such as payment gateways,
          logistics providers, analytics services, communication services and
          other technology providers.
        </p>
        <p>
          Such third-party services may have their own terms and privacy
          policies. Manoj Mobiles is not responsible for the independent
          policies or practices of third-party providers.
        </p>
      </>
    ),
  },
  {
    number: "14",
    title: "Limitation of Liability",
    icon: Scale,
    content: (
      <>
        <p>
          Manoj Mobiles will take reasonable steps to provide accurate product
          information and reliable website services. However, we do not
          guarantee that the website will always be uninterrupted, error-free or
          completely secure.
        </p>
        <p>
          To the extent permitted by applicable law, Manoj Mobiles shall not be
          responsible for indirect or consequential losses arising from the use
          of the website, delays caused by third parties, or circumstances
          beyond our reasonable control.
        </p>
        <p>
          Nothing in these Terms is intended to exclude or limit any consumer
          rights or liability that cannot legally be excluded under applicable
          law.
        </p>
      </>
    ),
  },
  {
    number: "15",
    title: "Force Majeure",
    icon: AlertCircle,
    content: (
      <>
        <p>
          We will not be responsible for delays or failure to perform
          obligations caused by events beyond our reasonable control, including
          natural disasters, government actions, strikes, transportation
          disruptions, network failures, technical failures or other similar
          events.
        </p>
      </>
    ),
  },
  {
    number: "16",
    title: "Changes to These Terms",
    icon: FileText,
    content: (
      <>
        <p>
          We may update these Terms of Service from time to time to reflect
          changes in our services, website functionality, business practices or
          applicable laws.
        </p>
        <p>
          Updated Terms will be published on this page with the revised
          effective date. Your continued use of the website after an update
          constitutes acceptance of the revised Terms to the extent permitted
          by law.
        </p>
      </>
    ),
  },
  {
    number: "17",
    title: "Governing Law & Jurisdiction",
    icon: Scale,
    content: (
      <>
        <p>
          These Terms shall be governed by and interpreted in accordance with
          the laws applicable in India.
        </p>
        <p>
          Any dispute arising in connection with the website, products or
          services shall be subject to the jurisdiction of the courts having
          appropriate jurisdiction, subject to applicable consumer protection
          laws and other legal rights available to customers.
        </p>
      </>
    ),
  },
];

function TermsSection({
  number,
  title,
  icon: Icon,
  content,
}: {
  number: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold tracking-widest text-primary">
              {number}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {title}
            </h2>
          </div>

          <div className="text-slate-600 leading-7 space-y-4 text-sm sm:text-base">
            {content}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-primary text-sm font-semibold mb-5">
              <FileText className="w-4 h-4" />
              Legal Information
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Terms of Service
            </h1>

            <p className="mt-5 text-lg text-slate-600 leading-8">
              These terms explain the rules and conditions that apply when you
              use the Manoj Mobiles website, browse products or place an order.
            </p>

            <p className="mt-4 text-sm text-slate-500">
              Last Updated: September 2026
            </p>
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
            <FileText className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold text-slate-900">
              Clear Terms
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Simple terms for using our website and services.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
            <ShoppingCart className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold text-slate-900">
              Online Orders
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Rules covering products, orders, payments and delivery.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
            <ShieldCheck className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold text-slate-900">
              Customer Rights
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Nothing here is intended to remove rights available under
              applicable law.
            </p>
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-5">
          {termsSections.map((section) => (
            <TermsSection key={section.number} {...section} />
          ))}
        </div>
      </section>

      {/* Related Policies */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Related Policies
          </h2>

          <p className="text-slate-600 mt-2 mb-6">
            Please also review the following policies before placing an order.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/privacy"
              className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-primary transition-colors"
            >
              <span className="font-semibold text-slate-900">
                Privacy Policy
              </span>
              <ArrowRight className="inline-block ml-2 w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/returns"
              className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-primary transition-colors"
            >
              <span className="font-semibold text-slate-900">
                Return & Cancellation
              </span>
              <ArrowRight className="inline-block ml-2 w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/warranty"
              className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-primary transition-colors"
            >
              <span className="font-semibold text-slate-900">
                Warranty Policy
              </span>
              <ArrowRight className="inline-block ml-2 w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />

            <p className="text-sm text-slate-600 leading-6">
              These Terms of Service are intended to explain the general terms
              governing use of the Manoj Mobiles website. They should be read
              together with the Privacy Policy, Return & Cancellation Policy,
              Refund Policy and Warranty Policy. In case of conflict with
              mandatory applicable law or statutory consumer rights, the
              applicable law shall prevail.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}