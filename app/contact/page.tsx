import { Header } from '@/components/layout/header'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <section className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Contact Us</h1>
          <p className="mt-4 text-gray-600">
            We’d love to hear from you. Whether you’re a potential partner, an NGO, a donor, or someone who needs help,
            the MealBridge team is here to answer your questions.
          </p>

          {/* Contact Info */}
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold">General Inquiries</h2>
              <p className="mt-2 text-gray-600">
                Email us at{' '}
                <a href="mailto:hello@mealbridge.net" className="text-emerald-700 underline">
                  hello@mealbridge.net
                </a>
              </p>

              <h2 className="mt-6 text-xl font-semibold">Partnerships</h2>
              <p className="mt-2 text-gray-600">
                For CSR projects, NGOs, and delivery partners:{' '}
                <a href="mailto:partners@mealbridge.net" className="text-emerald-700 underline">
                  partners@mealbridge.net
                </a>
              </p>

              <h2 className="mt-6 text-xl font-semibold">Privacy & Data</h2>
              <p className="mt-2 text-gray-600">
                Questions about your data or GDPR rights? Contact our privacy team at{' '}
                <a href="mailto:privacy@mealbridge.net" className="text-emerald-700 underline">
                  privacy@mealbridge.net
                </a>
              </p>

              <h2 className="mt-6 text-xl font-semibold">Address</h2>
              <p className="mt-2 text-gray-600">MealBridge Association<br />Bucharest, Romania</p>
            </div>

            {/* Contact Form */}
            <div>
              <form
                action="#"
                method="POST"
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
              >
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Send Message
                </button>
              </form>
            </div>
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
