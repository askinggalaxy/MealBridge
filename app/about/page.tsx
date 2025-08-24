'use client'
import { Header } from '@/components/layout/header'
import { useMemo } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

export default function AboutPage() {
  const prefersReduced = useReducedMotion()

  // Motion presets
  const fadeUp: Variants = useMemo(() => ({
    hidden: { opacity: 0, y: prefersReduced ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }), [prefersReduced])

  const fade: Variants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.6 } },
  }), [])

  const container: Variants = useMemo(() => ({
    hidden: {},
    show: {
      transition: { staggerChildren: prefersReduced ? 0 : 0.12, delayChildren: 0.1 },
    },
  }), [prefersReduced])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Hero */}
        <motion.section
          className="mx-auto max-w-5xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={container}
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
          >
            🌉 Bridging People. Saving Meals. Sharing Hope.
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl"
          >
            About <span className="text-emerald-600">MealBridge</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-3xl text-lg text-gray-600"
          >
            Every day, good food gets wasted while people nearby need a meal. MealBridge connects donors, recipients,
            and delivery partners to rescue food before it’s too late—turning waste into hope.
          </motion.p>

          {/* Stats */}
          <motion.div
            variants={container}
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <motion.div variants={fadeUp}>
              <StatCard value="0 food" label="should go to waste" />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard value="3 min" label="to list a donation" />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard value="1 click" label="to reserve nearby" />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Mission */}
        <motion.section
          className="mx-auto mt-16 max-w-5xl rounded-2xl bg-gray-50 p-6 md:p-10 ring-1 ring-gray-200"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
        >
          <h2 className="text-2xl font-bold">Our Mission</h2>
          <p className="mt-3 text-gray-600">
            MealBridge exists to <span className="font-semibold text-gray-800">fight food waste</span> and{' '}
            <span className="font-semibold text-gray-800">support communities</span> by making it easy for anyone to
            share surplus food with those who need it most. We’re building a trusted, human‑centered network where
            households, shops, restaurants, and NGOs come together to help.
          </p>
          <ul className="mt-6 grid list-none grid-cols-1 gap-4 sm:grid-cols-3">
            <motion.li variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <Pill>Reduce waste at the source</Pill>
            </motion.li>
            <motion.li variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <Pill>Serve people with dignity</Pill>
            </motion.li>
            <motion.li variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <Pill>Activate local communities</Pill>
            </motion.li>
          </ul>
        </motion.section>

        {/* How It Works */}
        <section className="mx-auto mt-16 max-w-5xl">
          <motion.h2
            className="text-2xl font-bold"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            How MealBridge Works
          </motion.h2>
          <motion.div
            className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={container}
          >
            <motion.div variants={cardVariant(prefersReduced)}>
              <Step
                icon={
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="currentColor">
                    <path d="M4 4h16v2H4zM4 8h16v12H4zM6 10h5v5H6z" />
                  </svg>
                }
                title="List Food"
                desc="Snap a photo, add expiry and pickup window, drop a pin or address. Listing takes under 3 minutes."
              />
            </motion.div>
            <motion.div variants={cardVariant(prefersReduced)}>
              <Step
                icon={
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="currentColor">
                    <path d="M12 2a10 10 0 1 0 6.32 17.78l3.2.8-1-3.1A10 10 0 0 0 12 2z" />
                  </svg>
                }
                title="Find & Reserve"
                desc="Recipients browse the map, filter by distance or expiry, and reserve with one click."
              />
            </motion.div>
            <motion.div variants={cardVariant(prefersReduced)}>
              <Step
                icon={
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="currentColor">
                    <path d="M3 6h18v2H3zm2 4h14v2H5zm3 4h8v2H8z" />
                  </svg>
                }
                title="Pickup or Delivery"
                desc="Meet at the chosen time—or use a delivery partner/volunteer to bridge the last mile."
              />
            </motion.div>
          </motion.div>
        </section>

        {/* Trust & Safety */}
        <motion.section
          className="mx-auto mt-16 max-w-5xl rounded-2xl bg-white p-6 md:p-10 ring-1 ring-gray-200"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
        >
          <h2 className="text-2xl font-bold">Trust &amp; Safety First</h2>
          <motion.div
            className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={cardVariant(prefersReduced)}>
              <SafetyCard
                title="Clear Guidelines"
                desc="Prefer sealed or non‑perishable items; label storage type and expiry. High‑risk foods are restricted."
              />
            </motion.div>
            <motion.div variants={cardVariant(prefersReduced)}>
              <SafetyCard
                title="Reputation"
                desc="Quick thumbs up/down and short comments after pickup help build a trusted community."
              />
            </motion.div>
            <motion.div variants={cardVariant(prefersReduced)}>
              <SafetyCard
                title="Moderation"
                desc="Flag suspicious listings. NGO moderators can hide items and restrict abusive accounts."
              />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* CTA */}
        <motion.section
          className="mx-auto mt-16 max-w-4xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
        >
          <h2 className="text-2xl font-bold">Join the Movement</h2>
          <p className="mt-3 text-gray-600">
            Whether you have a few extra groceries, manage a store with daily surplus, or want to help with logistics—
            MealBridge is your bridge to making an impact.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <motion.a
              whileHover={{ scale: prefersReduced ? 1 : 1.03 }}
              whileTap={{ scale: prefersReduced ? 1 : 0.98 }}
              href="/donations/create"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-sm transition hover:bg-emerald-700"
            >
              Start Donating
            </motion.a>
            <motion.a
              whileHover={{ scale: prefersReduced ? 1 : 1.03 }}
              whileTap={{ scale: prefersReduced ? 1 : 0.98 }}
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-gray-800 transition hover:bg-gray-50"
            >
              Explore Nearby
            </motion.a>
            <motion.a
              whileHover={{ scale: prefersReduced ? 1 : 1.03 }}
              whileTap={{ scale: prefersReduced ? 1 : 0.98 }}
              href="/partners"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-emerald-800 transition hover:bg-emerald-100"
            >
              Become a Partner
            </motion.a>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            NGOs and delivery companies: ask us about sponsored routes and CSR partnerships.
          </p>
        </motion.section>
      </main>
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} MealBridge — A community initiative to reduce food waste.
        </div>
      </footer>
    </div>
  )
}

/* ----------------- UI Bits ----------------- */

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm will-change-transform">
      <div className="text-xl font-semibold text-gray-900">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-800 ring-1 ring-inset ring-gray-200">
      {children}
    </span>
  )
}

function Step({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  )
}

function SafetyCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  )
}

// Card reveal animation variant
function cardVariant(prefersReduced: boolean | null): Variants {
  // Coerce nullable value to strict boolean for motion calculations
  const pr = !!prefersReduced
  return {
    hidden: { opacity: 0, y: pr ? 0 : 16, scale: pr ? 1 : 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      // Use a typed cubic-bezier tuple for ease to satisfy Framer Motion types
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  }
}
