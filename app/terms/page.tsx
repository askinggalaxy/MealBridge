import { Header } from '@/components/layout/header'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <section className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Terms of Service</h1>
          <p className="mt-4 text-sm text-gray-500">Last updated: 24 August 2025</p>

          <div className="mt-8 space-y-8 text-gray-700">
            {/* Intro */}
            <section>
              <p>
                Welcome to MealBridge (the “Platform”), operated by <span className="font-medium">MealBridge Association</span>, a non‑profit
                organization based in Bucharest, Romania (“we”, “us”, “our”). By accessing or using MealBridge, you agree
                to these Terms of Service (the “Terms”). Please read them carefully.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-bold">1. Eligibility</h2>
              <p className="mt-2">
                You must be at least 16 years old (or the age of digital consent in your jurisdiction) to use MealBridge.
                By creating an account, you confirm that you meet this requirement and have the capacity to enter into a
                binding agreement.
              </p>
            </section>

            {/* Accounts */}
            <section>
              <h2 className="text-2xl font-bold">2. Accounts & Registration</h2>
              <p className="mt-2">
                To access certain features, you must create an account. You agree to provide accurate, current, and
                complete information, and to keep it updated. You are responsible for safeguarding your account and for
                all activities under it. Notify us immediately if you suspect unauthorized use.
              </p>
            </section>

            {/* Use of Platform */}
            <section>
              <h2 className="text-2xl font-bold">3. Use of the Platform</h2>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>Use MealBridge only for lawful purposes and in accordance with these Terms.</li>
                <li>You may list surplus food items you reasonably believe are safe to share, following our guidelines.</li>
                <li>You agree not to misuse the Platform (e.g., fraudulent listings, harassment, spamming, or attempts to breach security).</li>
                <li>We may moderate, edit, or remove content that violates these Terms or our community guidelines.</li>
              </ul>
            </section>

            {/* Food safety */}
            <section>
              <h2 className="text-2xl font-bold">4. Food Safety Disclaimer</h2>
              <p className="mt-2">
                MealBridge facilitates sharing but does not independently verify, guarantee, or certify the safety or
                quality of donated food. Donors are responsible for accurately describing items and complying with safety
                guidelines. Recipients accept food “as is” and are encouraged to use their best judgment. MealBridge
                disclaims all liability for any harm arising from consumption of donated food, to the maximum extent
                permitted by law.
              </p>
            </section>

            {/* Donations & Delivery */}
            <section>
              <h2 className="text-2xl font-bold">5. Donations & Delivery</h2>
              <p className="mt-2">
                Donations on MealBridge are free of charge unless explicitly stated (e.g., small handling fee for
                delivery services). Pickup arrangements are made between donor and recipient. If you opt for a delivery
                partner, that service is governed by the partner’s own terms.
              </p>
            </section>

            {/* Content */}
            <section>
              <h2 className="text-2xl font-bold">6. Content & Intellectual Property</h2>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>Users retain rights to content they create (photos, descriptions, etc.) but grant MealBridge a
                  non‑exclusive, royalty‑free license to use it for operating and promoting the Platform.</li>
                <li>All MealBridge trademarks, branding, and code remain our property or that of our licensors.</li>
              </ul>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-2xl font-bold">7. Privacy</h2>
              <p className="mt-2">
                Your use of the Platform is also governed by our <a className="text-emerald-700 underline" href="/privacy">Privacy Policy</a>, which explains how we
                collect and process personal data.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold">8. Suspension & Termination</h2>
              <p className="mt-2">
                We may suspend or terminate your account if you violate these Terms, our guidelines, or applicable laws.
                You may also delete your account at any time. Certain provisions (e.g., disclaimers, liability limits)
                will survive termination.
              </p>
            </section>

            {/* Liability */}
            <section>
              <h2 className="text-2xl font-bold">9. Limitation of Liability</h2>
              <p className="mt-2">
                To the fullest extent permitted by law, MealBridge and its officers, staff, or volunteers are not liable
                for indirect, incidental, or consequential damages arising from your use of the Platform. Our total
                liability will not exceed the greater of €50 or the amount you paid us (if any) in the past 12 months.
              </p>
            </section>

            {/* Indemnity */}
            <section>
              <h2 className="text-2xl font-bold">10. Indemnification</h2>
              <p className="mt-2">
                You agree to indemnify and hold harmless MealBridge, its staff, volunteers, and partners from claims,
                damages, or expenses arising from your use of the Platform, your content, or your violation of these
                Terms.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-2xl font-bold">11. Changes to Terms</h2>
              <p className="mt-2">
                We may update these Terms from time to time. Updated versions will be posted here with a revised “Last
                updated” date. If changes are material, we will provide reasonable notice (e.g., via in‑app notification
                or email).
              </p>
            </section>

            {/* Governing law */}
            <section>
              <h2 className="text-2xl font-bold">12. Governing Law & Jurisdiction</h2>
              <p className="mt-2">
                These Terms are governed by the laws of Romania and the European Union. Any disputes will be subject to
                the exclusive jurisdiction of the courts in Bucharest, Romania, unless applicable law requires otherwise.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold">13. Contact Us</h2>
              <p className="mt-2">
                For questions about these Terms, contact us at
                {' '}<a className="text-emerald-700 underline" href="mailto:hello@mealbridge.net">hello@mealbridge.net</a>.
              </p>
            </section>

            {/* Disclaimer */}
            <section className="rounded-xl bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-200">
              <p className="text-sm">
                <span className="font-semibold">Note:</span> This Terms of Service template is tailored for MealBridge as a non‑profit food sharing platform. It
                does not constitute legal advice. Please review with qualified counsel to ensure compliance with your
                jurisdiction and activities.
              </p>
            </section>
          </div>
        </section>
      </main>
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} MealBridge — A community initiative to reduce food waste.
        </div>
      </footer>
    </div>
  )
}
