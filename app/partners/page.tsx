'use client'
import { Header } from '@/components/layout/header'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

export default function PartnersPage() {
  const prefersReduced = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: prefersReduced ? 0 : 0.12, delayChildren: 0.1 },
    },
  }
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }
  const fade: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.6 } },
  }
  const card: Variants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 14, scale: prefersReduced ? 1 : 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  }

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
            🤝 Partner with MealBridge
          </motion.span>
          <motion.h1 variants={fadeUp} className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl">
            Make CSR tangible. Turn surplus into <span className="text-emerald-600">real impact</span>.
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-3xl text-lg text-gray-600">
            Join retailers, restaurants, logistics providers, and NGOs building a smarter, kinder food system. Together,
            we rescue meals before they go to waste and deliver them where they matter most.
          </motion.p>
          <motion.div variants={container} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <motion.div variants={card}><KPI value="200+ kg" label="Food saved / pilot month*"/></motion.div>
            <motion.div variants={card}><KPI value="95%" label="On‑time pickups with partners"/></motion.div>
            <motion.div variants={card}><KPI value="< 24h" label="From listing to handover"/></motion.div>
          </motion.div>
          <p className="mt-2 text-xs text-gray-400">*Example target for a city‑level pilot. Your results may vary.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <motion.a
              variants={fadeUp}
              whileHover={{ scale: prefersReduced ? 1 : 1.03 }}
              whileTap={{ scale: prefersReduced ? 1 : 0.98 }}
              href="#become-partner"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-sm transition hover:bg-emerald-700"
            >
              Become a Partner
            </motion.a>
            <motion.a
              variants={fadeUp}
              whileHover={{ scale: prefersReduced ? 1 : 1.03 }}
              whileTap={{ scale: prefersReduced ? 1 : 0.98 }}
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-gray-800 transition hover:bg-gray-50"
            >
              Talk to Our Team
            </motion.a>
          </div>
        </motion.section>

        {/* Who should partner */}
        <motion.section
          className="mx-auto mt-16 max-w-5xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
        >
          <motion.h2 variants={fadeUp} className="text-2xl font-bold">Who We Work With</motion.h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
            <motion.div variants={card}><PartnerCard title="Retail & Supermarkets" desc="Automate daily surplus donations, reduce waste costs, and report impact for CSR."/></motion.div>
            <motion.div variants={card}><PartnerCard title="Restaurants & Cafés" desc="Move surplus quickly at close, comply with safety, and support your neighborhood."/></motion.div>
            <motion.div variants={card}><PartnerCard title="Couriers & Logistics" desc="Sponsor or fulfill last‑mile pickups. Turn idle capacity into social value."/></motion.div>
            <motion.div variants={card}><PartnerCard title="NGOs & Shelters" desc="Source consistent donations, plan routes, and serve communities at scale."/></motion.div>
          </div>
        </motion.section>

        {/* Why partner (value props) */}
        <motion.section
          className="mx-auto mt-16 max-w-5xl rounded-2xl bg-gray-50 p-6 md:p-10 ring-1 ring-gray-200"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
        >
          <h2 className="text-2xl font-bold">Why Partner with MealBridge</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Benefit title="Measurable CSR" desc="Automated impact dashboards: kg saved, meals delivered, CO₂e avoided, neighborhoods reached."/>
            <Benefit title="Operational Simplicity" desc="Smart pickup windows, batched routes, and role‑based access keep your teams fast and compliant."/>
            <Benefit title="Brand Goodwill" desc="Tell a credible sustainability story backed by transparent data and real community outcomes."/>
            <Benefit title="Compliance & Safety" desc="Clear sharing guidelines, moderation tools, and audit trails support responsible programs."/>
          </div>
        </motion.section>

        {/* How partnership works */}
        <motion.section
          className="mx-auto mt-16 max-w-5xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
        >
          <motion.h2 variants={fadeUp} className="text-2xl font-bold">How a Partnership Works</motion.h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <motion.div variants={card}><Step num={1} title="Scope & Onboarding" desc="Define locations, donation categories, schedules, and data needs. Sign a lightweight MoU/DPA."/></motion.div>
            <motion.div variants={card}><Step num={2} title="Pilot & Optimize" desc="Start with 1–3 sites. Tune pickup windows, safe‑sharing rules, and delivery SLAs using live data."/></motion.div>
            <motion.div variants={card}><Step num={3} title="Scale & Report" desc="Roll out across sites. Access monthly CSR reports and real‑time dashboards for stakeholders."/></motion.div>
          </div>
        </motion.section>

        {/* Tiers */}
        <motion.section
          className="mx-auto mt-16 max-w-5xl"
          id="become-partner"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
        >
          <motion.h2 variants={fadeUp} className="text-2xl font-bold">Partnership Tiers</motion.h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <motion.div variants={card}><Tier name="Pilot" price="CSR‑sponsored" bullets={["1 city / 1–3 sites","Basic reporting","Email support"]} cta="Start Pilot"/></motion.div>
            <motion.div variants={card}><Tier featured name="Impact" price="CSR‑sponsored" bullets={["Multi‑site rollout","Impact dashboard","Quarterly reviews"]} cta="Request Proposal"/></motion.div>
            <motion.div variants={card}><Tier name="Network" price="Custom" bullets={["National network","API & integrations","Dedicated CSM"]} cta="Talk to Sales"/></motion.div>
          </div>
        </motion.section>

        {/* Logos placeholder */}
        <motion.section
          className="mx-auto mt-16 max-w-5xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fade}
        >
          <p className="text-sm uppercase tracking-wide text-gray-500">Trusted by sustainability‑minded teams</p>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl border border-dashed border-gray-300" />
            ))}
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          className="mx-auto mt-16 max-w-5xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
        >
          <motion.h2 variants={fadeUp} className="text-2xl font-bold">Partner FAQ</motion.h2>
          <div className="mt-6 grid grid-cols-1 gap-4">
            <FAQ q="How do you measure impact?" a="We track kg saved, estimated meals, CO₂e avoided, pickup success, and delivery SLAs. Monthly CSR PDFs and real‑time dashboards are available on Impact and Network tiers."/>
            <FAQ q="What about food safety?" a="Partners follow local regulations and our safe‑sharing guidelines. Listings include storage type, expiry, and pickup windows. NGO moderation and audit trails support compliance."/>
            <FAQ q="How fast can we launch a pilot?" a="Typical pilots go live in 2–4 weeks after scoping, depending on sites and stakeholders."/>
            <FAQ q="Can we integrate with our systems?" a="Yes. Network tier includes APIs and SSO options to streamline product flows and reporting."/>
          </div>
        </motion.section>

        {/* CTA final */}
        <motion.section
          className="mx-auto mt-16 max-w-4xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
        >
          <h2 className="text-2xl font-bold">Let’s build a measurable CSR story together</h2>
          <p className="mt-3 text-gray-600">Tell us about your locations, surplus patterns, and goals. We’ll suggest a pilot plan within days.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <motion.a whileHover={{ scale: prefersReduced ? 1 : 1.03 }} whileTap={{ scale: prefersReduced ? 1 : 0.98 }} href="/contact" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-sm transition hover:bg-emerald-700">Contact MealBridge</motion.a>
            <motion.a whileHover={{ scale: prefersReduced ? 1 : 1.03 }} whileTap={{ scale: prefersReduced ? 1 : 0.98 }} href="#become-partner" className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-emerald-800 transition hover:bg-emerald-100">Download Partner One‑Pager</motion.a>
          </div>
          <p className="mt-2 text-xs text-gray-400">(Link the one‑pager PDF when available.)</p>
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

/* ---------- UI Bits ---------- */
function KPI({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
      <div className="text-xl font-semibold text-gray-900">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  )
}

function PartnerCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  )
}

function Benefit({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  )
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">{num}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  )
}

function Tier({ name, price, bullets, cta, featured }: { name: string; price: string; bullets: string[]; cta: string; featured?: boolean }) {
  return (
    <div className={"flex h-full flex-col rounded-2xl border p-6 shadow-sm " + (featured ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white')}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <p className="mt-1 text-sm text-gray-600">{price}</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-700">
          {bullets.map((b, i) => (<li key={i}>{b}</li>))}
        </ul>
      </div>
      <a href="/contact" className={"mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition " + (featured ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-gray-300 text-gray-800 hover:bg-gray-50')}>{cta}</a>
    </div>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer select-none text-base font-semibold text-gray-900">{q}</summary>
      <p className="mt-2 text-sm text-gray-600">{a}</p>
    </details>
  )
}
