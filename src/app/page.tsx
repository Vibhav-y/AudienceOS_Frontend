import Link from "next/link";

// Public landing page — the app itself lives under /(app) with the sidebar.
// Photography: Unsplash (free to use).
const IMG = {
  woman: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80&auto=format&fit=crop",
  bags: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=700&q=80&auto=format&fit=crop",
  pos: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=700&q=80&auto=format&fit=crop",
  store: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&q=80&auto=format&fit=crop",
  dash: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80&auto=format&fit=crop",
  checkout: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format&fit=crop",
};

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-300px] h-[640px] w-[1000px] -translate-x-1/2 rounded-full bg-orange-500/[0.12] blur-[140px]"
      />

      {/* ════ NAV ═════════════════════════════════════════════════ */}
      <header className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-6">
        <div className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight">
          <Logo />
          <span>Audience<span className="bg-gradient-to-b from-orange-300 to-orange-500 bg-clip-text text-transparent">OS</span></span>
        </div>
        <nav className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.025] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:flex">
          <NavPill href="/chat" active>Agent</NavPill>
          <NavPill href="/dashboard">Dashboard</NavPill>
          <NavPill href="/campaigns">Campaigns</NavPill>
        </nav>
        <Link href="/chat" className="btn-accent inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
          Open the app
          <Arrow />
        </Link>
      </header>

      {/* ════ HERO ════════════════════════════════════════════════ */}
      <section className="relative mx-auto grid max-w-7xl gap-4 px-6 pb-10 pt-6 lg:grid-cols-12 lg:pt-12">
        {/* copy */}
        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="label mb-5">AI-native mini CRM</p>
          <h1 className="text-[2.7rem] font-bold uppercase leading-[0.95] tracking-tight text-neutral-50 sm:text-6xl xl:text-[5.2rem]">
            Reach the
            <br />
            right shoppers
            <br />
            <span className="bg-gradient-to-r from-orange-200 via-orange-400 to-orange-500 bg-clip-text text-transparent">
              in plain English
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-neutral-400">
            Tell AudienceOS a goal — &ldquo;win back dormant premium customers in
            Maharashtra&rdquo; — and an AI strategist finds the audience, picks the channel,
            writes the copy, and shows you a proposal. You approve. It sends. Every rupee is
            attributed back.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/chat" className="btn-accent inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm">
              Start a conversation
              <Arrow />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-6 py-3 text-sm text-neutral-100 transition hover:border-white/[0.22] hover:bg-white/[0.06]"
            >
              See live performance
            </Link>
          </div>

          {/* secondary tiles */}
          <div className="mt-9 grid grid-cols-3 gap-3">
            <Photo src={IMG.bags} alt="Shopping bags" className="h-28 rounded-2xl sm:h-32" />
            <Photo src={IMG.pos} alt="Customer at checkout" className="h-28 rounded-2xl sm:h-32" />
            <div className="card flex flex-col justify-center rounded-2xl p-4">
              <div className="num bg-gradient-to-b from-orange-200 to-orange-500 bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl">
                ₹4.2L
              </div>
              <p className="mt-1 text-[11px] leading-tight text-neutral-500">attributed to messages</p>
            </div>
          </div>
        </div>

        {/* hero photo with floating proposal card */}
        <div className="relative lg:col-span-5">
          <Photo src={IMG.woman} alt="Shopper with bags" className="h-[420px] rounded-[24px] lg:h-full lg:min-h-[560px]" />
          {/* floating proposal card */}
          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/[0.12] bg-black/55 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20"><Spark /></span>
                Campaign proposal
              </span>
              <span className="rounded-full border border-orange-500/25 bg-orange-500/[0.1] px-2.5 py-0.5 text-[11px] text-orange-300">
                needs approval
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-300">
              Found <span className="text-neutral-100">38 customers</span> · avg ₹18,400 LTV ·
              dormant 60–140d. WhatsApp recommended.
            </p>
            <div className="mt-3 flex justify-end">
              <span className="btn-accent cursor-default rounded-full px-3.5 py-1.5 text-xs">
                Approve &amp; launch to 38
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ════ STATS BAND ══════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-white/[0.06] bg-white/[0.04] md:grid-cols-4">
          <Stat value="6" label="funnel stages tracked, end to end" />
          <Stat value="3" label="channels — WhatsApp, Email, SMS" />
          <Stat value="100%" label="parameterized queries, zero raw SQL" />
          <Stat value="₹4.2L" label="revenue attributed to messages" />
        </div>
      </section>

      {/* ════ FEATURE ROW — audience ══════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Photo src={IMG.store} alt="Retail store" className="h-[340px] rounded-[24px] md:h-[440px]" />
          <div>
            <p className="label">Find the audience</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-50 md:text-[2.6rem] md:leading-[1.1]">
              Describe the cohort, skip the query builder
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-neutral-400">
              The agent turns your goal into a validated filter DSL — never raw SQL. Every
              field and operator passes an allowlist and compiles to parameterized,
              injection-proof queries. Malformed audiences fail closed.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-neutral-300">
              <Check>Plain-English goal → precise, reviewable segment</Check>
              <Check>See the count and who&rsquo;s in it before you send</Check>
              <Check>Schema-validated, allowlisted, injection-proof</Check>
            </ul>
          </div>
        </div>
      </section>

      {/* ════ FEATURE ROW — performance ═══════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="label">Revenue, not vanity metrics</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-50 md:text-[2.6rem] md:leading-[1.1]">
              Every rupee traced to the message that earned it
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-neutral-400">
              Delivery callbacks arrive duplicated and out of order — an idempotent,
              event-sourced state machine absorbs all of it. The funnel runs live, all the way
              to attributed orders.
            </p>
            {/* mini funnel */}
            <div className="card mt-7 space-y-3 rounded-[20px] p-5">
              <FunnelRow label="Sent" value="38" pct={100} />
              <FunnelRow label="Delivered" value="37" pct={97} />
              <FunnelRow label="Opened" value="29" pct={76} />
              <FunnelRow label="Clicked" value="14" pct={37} />
              <FunnelRow label="Converted" value="9" pct={24} />
            </div>
          </div>
          <Photo src={IMG.dash} alt="Analytics dashboard" className="order-1 h-[340px] rounded-[24px] md:h-[480px] lg:order-2" />
        </div>
      </section>

      {/* ════ CHANNELS ════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="max-w-2xl">
          <p className="label">Reach them where they are</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-50 md:text-[2.6rem] md:leading-[1.1]">
            One agent, every channel
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-400">
            The strategist picks the channel that fits the cohort — and you can always override it.
          </p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          <Channel name="WhatsApp" tag="Mobile-first cohorts" body="Rich, conversational, high open rates. The default for dormant or premium audiences in India." />
          <Channel name="Email" tag="Considered offers" body="Room for detail and design. Ideal for catalogue drops, receipts, and long-form announcements." />
          <Channel name="SMS" tag="Urgency" body="Short, immediate, impossible to miss. Reserved for time-boxed offers and order nudges." />
        </div>
      </section>

      {/* ════ FINAL CTA ═══════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:pb-28">
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08]">
          <img src={IMG.checkout} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-orange-900/40" />
          <div className="relative px-8 py-16 text-center md:px-16 md:py-24">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight text-neutral-50 md:text-5xl">
              Describe your next campaign in a sentence
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-neutral-300 md:text-base">
              The agent finds the audience, writes the copy, and shows you a proposal. You stay
              in control of every send.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/chat" className="btn-accent inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm">
                Start a conversation
                <Arrow />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.06] px-6 py-3 text-sm text-neutral-100 transition hover:border-white/[0.3] hover:bg-white/[0.1]"
              >
                See live performance
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════ FOOTER ══════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.05]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 text-[16px] font-semibold tracking-tight">
              <Logo />
              <span>Audience<span className="bg-gradient-to-b from-orange-300 to-orange-500 bg-clip-text text-transparent">OS</span></span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500">
              An AI-native mini CRM. Describe a goal, launch a campaign, and trace every rupee
              back to the message that earned it.
            </p>
          </div>
          <FooterCol title="Product" links={[["Agent", "/chat"], ["Dashboard", "/dashboard"], ["Campaigns", "/campaigns"]]} />
          <FooterCol title="Capabilities" links={[["Audiences", "/chat"], ["Channels", "/chat"], ["Attribution", "/dashboard"]]} />
          <FooterCol title="About" links={[["Built for Xeno", "/"], ["The workflow", "/chat"]]} />
        </div>
        <div className="border-t border-white/[0.04] py-6 text-center text-xs text-neutral-600">
          AudienceOS — an AI-native mini CRM, built for the Xeno engineering take-home.
        </div>
      </footer>
    </div>
  );
}

/* ── building blocks ──────────────────────────────────────────── */

function Photo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`group relative overflow-hidden border border-white/[0.08] ${className ?? ""}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-orange-600/15 mix-blend-overlay" />
    </div>
  );
}

function NavPill({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm transition ${
        active
          ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
          : "text-neutral-400 hover:text-neutral-100"
      }`}
    >
      {children}
    </Link>
  );
}

function FunnelRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-300">{label}</span>
        <span className="num text-neutral-500">{value}</span>
      </div>
      <div className="well mt-1.5 h-2 overflow-hidden rounded-full p-0">
        <div className="accent-fill h-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-[#0c0d0f]/70 p-7 md:p-8">
      <div className="num bg-gradient-to-b from-orange-200 to-orange-500 bg-clip-text text-4xl font-semibold text-transparent md:text-5xl">
        {value}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">{label}</p>
    </div>
  );
}

function Channel({ name, tag, body }: { name: string; tag: string; body: string }) {
  return (
    <div className="card card-hover rounded-[20px] p-7">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-50">{name}</h3>
        <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.7)]" />
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-orange-300/80">{tag}</p>
      <p className="mt-3 text-sm leading-relaxed text-neutral-400">{body}</p>
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {children}
    </li>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-300">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-neutral-500 transition hover:text-neutral-200">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── marks ────────────────────────────────────────────────────── */

function Logo() {
  return (
    <img src="/logo.png" alt="AudienceOS" width={32} height={32} className="h-8 w-8 rounded-lg" />
  );
}

function Spark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-orange-300">
      <path d="M12 2c.4 4.5 2.9 7 7.4 7.4C14.9 9.8 12.4 12.3 12 16.8 11.6 12.3 9.1 9.8 4.6 9.4 9.1 9 11.6 6.5 12 2Z" fill="currentColor" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
