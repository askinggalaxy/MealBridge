import { Header } from '@/components/layout/header'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <section className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-sm text-gray-500">Last updated: 24 August 2025</p>

          <div className="mt-8 space-y-8 text-gray-700">
            {/* Intro */}
            <section>
              <p>
                MealBridge (the “Platform”) is operated by <span className="font-medium">MealBridge Association</span>, a non‑profit
                organization (“we”, “us”, “our”). We are committed to protecting your personal data and respecting your
                privacy. This Privacy Policy explains what data we collect, how we use it, on what legal bases (GDPR), and
                the choices and rights you have.
              </p>
            </section>

            {/* Controller & Contact */}
            <section>
              <h2 className="text-2xl font-bold">1. Controller & Contact</h2>
              <p className="mt-2">
                Controller: <span className="font-medium">MealBridge Association</span>, Bucharest, Romania.
                <br />
                Email: <a className="text-emerald-700 underline" href="mailto:privacy@mealbridge.net">privacy@mealbridge.net</a>
                <br />
                If appointed, our Data Protection Officer (DPO) can be reached at the same address with the subject “DPO”.
              </p>
            </section>

            {/* Data we collect */}
            <section>
              <h2 className="text-2xl font-bold">2. Personal Data We Collect</h2>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-medium">Account & Profile:</span> name, display name, email, password (hashed), role (donor/recipient/NGO/admin),
                  phone (optional), short bio, profile photo (optional).
                </li>
                <li>
                  <span className="font-medium">Location:</span> approximate address label (e.g., neighborhood), latitude/longitude for mapping nearby
                  donations. We do not require precise geolocation beyond what you provide.
                </li>
                <li>
                  <span className="font-medium">Donation Data:</span> item photos, categories, description, expiry date, pickup window, status, chat messages
                  related to the donation and reservation.
                </li>
                <li>
                  <span className="font-medium">Usage & Device:</span> log data, IP address, browser type, pages viewed, referrers, and basic analytics.
                </li>
                <li>
                  <span className="font-medium">Communications:</span> emails and notifications you receive from us and your preferences.
                </li>
                <li>
                  <span className="font-medium">Partner Logistics (optional):</span> if you opt for delivery via partners (e.g., couriers), we may process
                  pickup/drop‑off details necessary to fulfill the request.
                </li>
              </ul>
            </section>

            {/* Legal bases */}
            <section>
              <h2 className="text-2xl font-bold">3. Legal Bases for Processing (GDPR)</h2>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-medium">Performance of a contract:</span> to create your account, enable listings, reservations, and messaging.
                </li>
                <li>
                  <span className="font-medium">Legitimate interests:</span> to keep the Platform safe, prevent abuse, provide core analytics, and improve the
                  service (balanced against your rights).
                </li>
                <li>
                  <span className="font-medium">Consent:</span> for optional features such as marketing emails or precise geolocation (where requested). You can
                  withdraw consent at any time.
                </li>
                <li>
                  <span className="font-medium">Legal obligations:</span> to comply with applicable laws and requests from competent authorities.
                </li>
              </ul>
            </section>

            {/* How we use data */}
            <section>
              <h2 className="text-2xl font-bold">4. How We Use Your Data</h2>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>Provide and operate the Platform, including listings, reservations, messaging, and notifications.</li>
                <li>Maintain trust & safety (moderation, preventing fraud, enforcing guidelines and Terms).</li>
                <li>Communicate service updates and respond to your requests.</li>
                <li>Improve usability and performance, run basic, privacy‑respecting analytics.</li>
                <li>Facilitate optional delivery/logistics through partners when you choose that option.</li>
              </ul>
            </section>

            {/* Sharing */}
            <section>
              <h2 className="text-2xl font-bold">5. Sharing & Disclosures</h2>
              <p className="mt-2">We share personal data only as needed to provide the service and for lawful purposes:</p>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-medium">Service providers / processors:</span> hosting, databases, email, error monitoring, and mapping.
                </li>
                <li>
                  <span className="font-medium">Delivery partners (optional):</span> if you request courier pickup/delivery, we share necessary pickup/drop‑off
                  details. Partners act as independent controllers for their services.
                </li>
                <li>
                  <span className="font-medium">Public content:</span> listings (minus private contact details) are visible to other users to enable pickups.
                </li>
                <li>
                  <span className="font-medium">Legal & safety:</span> to comply with the law or protect rights, safety, and property of users and the public.
                </li>
              </ul>
            </section>

            {/* Processors list */}
            <section>
              <h2 className="text-2xl font-bold">6. Sub‑processors & Infrastructure</h2>
              <p className="mt-2">Core infrastructure currently includes (subject to change as the platform evolves):</p>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li><span className="font-medium">Supabase</span> (EU data hosting where available): authentication, Postgres database, storage.</li>
                <li><span className="font-medium">Vercel</span>: web hosting and edge network for the web app.</li>
                <li><span className="font-medium">Email service</span> (e.g., transactional emails for magic links and notifications).</li>
                <li><span className="font-medium">Maps</span>: OpenStreetMap / Leaflet tiles via a third‑party tile provider.</li>
                <li><span className="font-medium">Analytics</span>: lightweight, privacy‑preserving analytics (no cross‑site tracking).</li>
                <li><span className="font-medium">Optional couriers</span> (e.g., Glovo/Bolt/Uber) for pickups and deliveries initiated by you.</li>
              </ul>
              <p className="mt-2 text-sm text-gray-500">
                We maintain Data Processing Agreements (DPAs) where applicable and ensure appropriate safeguards for
                international transfers under GDPR (e.g., SCCs) if data is processed outside the EEA.
              </p>
            </section>

            {/* Retention */}
            <section>
              <h2 className="text-2xl font-bold">7. Data Retention</h2>
              <p className="mt-2">
                We keep personal data only as long as necessary for the purposes described above. Typical retention
                periods: account/profile data for the life of the account; listings, messages, and ratings for as long as
                needed to operate the Platform and for a short period afterward for safety and audit; logs and analytics
                for a limited, proportionate period.
              </p>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-2xl font-bold">8. Security</h2>
              <p className="mt-2">
                We implement technical and organizational measures appropriate to the risk, including encryption in
                transit, role‑based access, and Row Level Security (RLS) in our database. No method of transmission or
                storage is 100% secure; we continuously improve our safeguards.
              </p>
            </section>

            {/* Your rights */}
            <section>
              <h2 className="text-2xl font-bold">9. Your Rights (EEA/UK)</h2>
              <p className="mt-2">Subject to conditions and exceptions under GDPR, you may have the right to:</p>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>Access your personal data;</li>
                <li>Rectify inaccurate or incomplete data;</li>
                <li>Erase data (right to be forgotten);</li>
                <li>Restrict or object to processing (including for legitimate interests);</li>
                <li>Data portability;</li>
                <li>Withdraw consent at any time where processing is based on consent;</li>
                <li>Lodge a complaint with your local Data Protection Authority.</li>
              </ul>
              <p className="mt-2">
                To exercise your rights, contact us at
                {' '}<a className="text-emerald-700 underline" href="mailto:privacy@mealbridge.net">privacy@mealbridge.net</a>.
                We may need to verify your identity before acting on your request.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold">10. Cookies & Similar Technologies</h2>
              <p className="mt-2">
                We use necessary cookies for authentication and core features. We may use optional, privacy‑respecting
                analytics cookies with your consent. You can manage preferences in the cookie banner or your browser
                settings. Learn more on our <a className="text-emerald-700 underline" href="/cookies">Cookies Policy</a> (coming soon).
              </p>
            </section>

            {/* Children */}
            <section>
              <h2 className="text-2xl font-bold">11. Children’s Privacy</h2>
              <p className="mt-2">
                The Platform is intended for users aged 16+ (or the age of digital consent in your country). If you
                believe a child under the relevant age has provided us personal data, please contact us so we can take
                appropriate action.
              </p>
            </section>

            {/* International transfers */}
            <section>
              <h2 className="text-2xl font-bold">12. International Data Transfers</h2>
              <p className="mt-2">
                Where data is transferred outside the EEA/UK, we rely on appropriate safeguards such as Standard
                Contractual Clauses (SCCs) and conduct transfer impact assessments where required.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-2xl font-bold">13. Changes to This Policy</h2>
              <p className="mt-2">
                We may update this Policy from time to time. We will post the new version here and update the “Last
                updated” date. If changes are material, we will provide additional notice (e.g., in‑app or by email).
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold">14. Contact Us</h2>
              <p className="mt-2">
                Questions or requests about this Policy? Email us at
                {' '}<a className="text-emerald-700 underline" href="mailto:privacy@mealbridge.net">privacy@mealbridge.net</a>.
              </p>
            </section>

            {/* Disclaimer */}
            <section className="rounded-xl bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-200">
              <p className="text-sm">
                <span className="font-semibold">A community initiative to reduce food waste.</span> 
               
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