import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Manoj Mobiles",
  description:
    "Read the Privacy Policy of Manoj Mobiles to understand how we collect, use, protect and manage your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-blue-100 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Manoj Mobiles
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Privacy Policy
            </h1>

            <p className="mt-4 text-base leading-7 text-gray-600">
              Your privacy matters to us. This Privacy Policy explains how
              Manoj Mobiles collects, uses, stores and protects information
              when you use our website, services and place orders with us.
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Last updated: September 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="space-y-10">

            {/* 1 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                1. Information We Collect
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                When you use Manoj Mobiles services, we may collect information
                that you provide directly to us, such as your name, mobile
                number, email address, delivery address and account details.
              </p>

              <p className="mt-3 leading-7 text-gray-600">
                We may also collect information related to your orders,
                products, enquiries, delivery requests and interactions with
                our website.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                2. How We Use Your Information
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                Information collected through our website may be used to:
              </p>

              <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-gray-600">
                <li>Process and manage your orders.</li>
                <li>Provide delivery and order-related services.</li>
                <li>Respond to your enquiries and requests.</li>
                <li>Manage your customer account.</li>
                <li>Provide customer support.</li>
                <li>Improve our website, products and services.</li>
                <li>Communicate important information regarding your orders.</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                3. Account Information
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                If you create an account with Manoj Mobiles, we may store the
                information required to maintain your account and provide
                account-related services. You are responsible for keeping your
                account credentials secure and for the activity carried out
                through your account.
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                4. Order and Payment Information
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                When you place an order, we may collect information necessary
                to process and fulfil the order, including contact and
                delivery information.
              </p>

              <p className="mt-3 leading-7 text-gray-600">
                Payment transactions may be processed through third-party
                payment service providers. Manoj Mobiles does not need to
                directly store sensitive payment credentials such as your
                complete card details when payment processing is handled by
                an authorised payment provider.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                5. Cookies and Local Storage
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                Our website may use cookies, local storage or similar
                technologies to remember preferences, maintain sessions,
                improve website functionality and provide a better browsing
                experience.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                6. Third-Party Services
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                Some website functions may rely on third-party service
                providers, such as payment processing, delivery or mapping,
                authentication, analytics, hosting and other technical
                services.
              </p>

              <p className="mt-3 leading-7 text-gray-600">
                These services may process information according to their own
                privacy policies and terms. We encourage users to review the
                privacy practices of relevant third-party providers where
                applicable.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                7. Data Security
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                We take reasonable measures to protect information handled
                through our website against unauthorised access, misuse,
                alteration or disclosure.
              </p>

              <p className="mt-3 leading-7 text-gray-600">
                However, no method of transmission or electronic storage can
                be guaranteed to be completely secure.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                8. Data Retention
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                We retain information for as long as reasonably necessary for
                the purposes for which it was collected, including providing
                services, maintaining transaction records, resolving
                disputes, complying with applicable requirements and protecting
                our legitimate business interests.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                9. Your Rights and Requests
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                Depending on applicable law, you may have rights relating to
                the personal information we hold about you. You may contact
                Manoj Mobiles regarding questions, corrections or requests
                concerning your personal information.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                10. Children&apos;s Privacy
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                Our website is intended for general customers and is not
                specifically directed toward children. We do not knowingly
                request personal information from children where such
                collection is prohibited by applicable law.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                11. Changes to This Privacy Policy
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                Manoj Mobiles may update this Privacy Policy from time to time
                to reflect changes in our services, website functionality or
                applicable requirements. Any updated version will be published
                on this page.
              </p>
            </section>

            {/* 12 */}
            <section className="rounded-xl bg-blue-50 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900">
                12. Contact Us
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                If you have questions or concerns regarding this Privacy
                Policy or the handling of your information, please contact
                Manoj Mobiles through the contact details provided on our
                website.
              </p>
            </section>

          </div>
        </div>
      </section>
    </main>
  );
}