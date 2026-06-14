"use client";

// ─────────────────────────────────────────────────────────────────────
// AudienceOS — landing page (single file, self-contained).
//
// Design system (page-scoped):
//   ink      #060906   page ground
//   ivory    #F8F4EE   primary type
//   stone    #AA9E90   secondary type
//   champagne#C08736   single accent, used sparingly
//   hairline rgba(248,244,238,0.08)
//
// Type: Instrument Serif (var(--font-serif)) for display, system sans
// for UI. Hero: Three.js point-field terrain. Photography: Unsplash,
// in the editorial strip further down — never competing with the hero.
// ─────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";

/* ════ tokens ══════════════════════════════════════════════════════ */

const T = {
  ink: "#060906",
  ivory: "#F8F4EE",
  stone: "#AA9E90",
  champagne: "#C08736",
  hairline: "rgba(248,244,238,0.08)",
};

const serif = { fontFamily: "var(--font-serif), Georgia, serif" };

/* ════ Three.js hero scene ═════════════════════════════════════════ */

function HeroScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060906, 0.055);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.4, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── particle terrain ──
    const COLS = 130;
    const ROWS = 70;
    const SPACING = 0.34;
    const count = COLS * ROWS;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const ivory = new THREE.Color(0xf8f4ee);
    const champagne = new THREE.Color(0xc08736);

    let i = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        positions[i * 3] = (c - COLS / 2) * SPACING;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (r - ROWS / 2) * SPACING;

        // mostly ivory; a thin vein of champagne through the middle
        const vein = Math.exp(-Math.pow((r - ROWS * 0.55) / 6, 2));
        const col = ivory.clone().lerp(champagne, Math.min(vein * 1.1, 1));
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
        i++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // soft round sprite so points render as glows, not squares
    const sprite = (() => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 64;
      const cx = cv.getContext("2d")!;
      const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.4, "rgba(255,255,255,0.5)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      cx.fillStyle = g;
      cx.fillRect(0, 0, 64, 64);
      const tx = new THREE.CanvasTexture(cv);
      tx.colorSpace = THREE.SRGBColorSpace;
      return tx;
    })();

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      map: sprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    points.position.y = -1.2;
    scene.add(points);

    // ── interaction state ──
    const mouse = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // pause rendering when the hero is offscreen
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
      threshold: 0,
    });
    io.observe(mount);

    // ── animation loop ──
    const pos = geo.attributes.position as THREE.BufferAttribute;
    let raf = 0;
    let t = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      if (!reduced) t += 0.0035;

      // layered waves — slow, asymmetric, never repeating visibly
      for (let k = 0; k < count; k++) {
        const x = pos.getX(k);
        const z = pos.getZ(k);
        const y =
          Math.sin(x * 0.55 + t * 2.1) * 0.32 +
          Math.sin(z * 0.7 - t * 1.4) * 0.26 +
          Math.sin((x + z) * 0.32 + t) * 0.22;
        pos.setY(k, y);
      }
      pos.needsUpdate = true;

      // camera drift toward cursor (gentle — degrees, not theatrics)
      eased.x += (mouse.x - eased.x) * 0.03;
      eased.y += (mouse.y - eased.y) * 0.03;
      camera.position.x = eased.x * 1.1;
      camera.position.y = 2.4 - eased.y * 0.5;
      camera.lookAt(0, -0.4, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      sprite.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="absolute inset-0 z-0"
      style={{
        maskImage:
          "linear-gradient(180deg, transparent 0%, black 18%, black 78%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(180deg, transparent 0%, black 18%, black 78%, transparent 100%)",
      }}
    />
  );
}

/* ════ scroll reveal ═══════════════════════════════════════════════ */

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(24px)",
        transition: `opacity 0.9s ease ${delay}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ════ shared bits ═════════════════════════════════════════════════ */

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[11px] font-medium uppercase"
      style={{ color: T.champagne, letterSpacing: "0.22em" }}
    >
      {children}
    </p>
  );
}

function Rule() {
  return <div style={{ height: 1, background: T.hairline }} />;
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 8h11M9.5 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ════ editorial photo (Unsplash) ══════════════════════════════════ */

function Photo({
  src,
  alt,
  caption,
  tall,
}: {
  src: string;
  alt: string;
  caption: string;
  tall?: boolean;
}) {
  return (
    <figure className="group">
      <div
        className={`overflow-hidden border ${tall ? "aspect-[3/4]" : "aspect-[4/3]"}`}
        style={{ borderColor: T.hairline }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
          style={{ filter: "grayscale(0.35) contrast(1.02) brightness(0.92)" }}
        />
      </div>
      <figcaption
        className="mt-3 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: T.stone }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

/* ════ page ════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: T.ink, color: T.ivory }}
    >
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header
        className="relative z-30 border-b"
        style={{ borderColor: T.hairline }}
      >
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-baseline gap-px text-[19px]" style={serif}>
            Audience<span style={{ color: T.champagne }}>OS</span>
          </Link>
          <nav className="hidden items-center gap-9 text-[13px] md:flex" style={{ color: T.stone }}>
            <Link href="/chat" className="transition-colors hover:text-[#F8F4EE]">Agent</Link>
            <Link href="/dashboard" className="transition-colors hover:text-[#F8F4EE]">Dashboard</Link>
            <Link href="/campaigns" className="transition-colors hover:text-[#F8F4EE]">Campaigns</Link>
          </nav>
          <Link
            href="/chat"
            className="group inline-flex items-center gap-2 border px-5 py-2.5 text-[13px] transition-colors"
            style={{ borderColor: "rgba(192,135,54,0.4)", color: T.ivory }}
          >
            Open the app
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRight />
            </span>
          </Link>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative">
        <HeroScene />
        <div className="relative z-10 mx-auto max-w-[1200px] px-6 pb-40 pt-32 lg:px-8 lg:pt-44">
          <Reveal>
            <Eyebrow>AI-native customer relationship platform</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <h1
              className="mt-8 max-w-[15ch] text-[clamp(3rem,8vw,6.5rem)] leading-[1.02] tracking-[-0.01em]"
              style={serif}
            >
              Every campaign begins as{" "}
              <em style={{ color: T.champagne }}>a sentence.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.22}>
            <p
              className="mt-10 max-w-[44ch] text-[15px] leading-[1.8]"
              style={{ color: T.stone }}
            >
              Describe the outcome you want. AudienceOS finds the audience,
              chooses the channel, writes the message, and presents a complete
              proposal — nothing is sent until you approve it, and every rupee
              of revenue is traced back to its source.
            </p>
          </Reveal>
          <Reveal delay={0.34}>
            <div className="mt-12 flex flex-wrap items-center gap-8">
              <Link
                href="/chat"
                className="group inline-flex items-center gap-3 px-8 py-4 text-[13px] font-medium tracking-wide transition-opacity hover:opacity-90"
                style={{ background: T.ivory, color: T.ink }}
              >
                Begin a conversation
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight />
                </span>
              </Link>
              <Link
                href="/dashboard"
                className="border-b pb-1 text-[13px] tracking-wide transition-colors"
                style={{ borderColor: "rgba(192,135,54,0.5)", color: T.ivory }}
              >
                View live performance
              </Link>
            </div>
          </Reveal>
        </div>

        {/* hero footnote strip */}
        <div className="relative z-10 border-t" style={{ borderColor: T.hairline }}>
          <div
            className="mx-auto grid max-w-[1200px] grid-cols-2 gap-px px-6 py-8 text-center md:grid-cols-4 lg:px-8"
            style={{ color: T.stone }}
          >
            {[
              ["₹4.2L", "revenue attributed this month"],
              ["6.3×", "average return on spend"],
              ["38 sec", "from idea to proposal"],
              ["100%", "of sends approved by a human"],
            ].map(([v, l]) => (
              <div key={l} className="px-4">
                <div className="text-[26px]" style={{ ...serif, color: T.ivory }}>
                  {v}
                </div>
                <div className="mt-1.5 text-[11px] uppercase tracking-[0.14em]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT ─────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-[1200px] px-6 py-32 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <Eyebrow>The product</Eyebrow>
            <h2 className="mt-6 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.15]" style={serif}>
              A strategist that shows its work.
            </h2>
            <p className="mt-6 text-[14px] leading-[1.8]" style={{ color: T.stone }}>
              You speak in goals, not queries. The agent answers with a fully
              formed plan — audience, channel, timing, copy, and the revenue it
              expects to produce. Edit anything. Approve once.
            </p>
          </Reveal>

          {/* proposal mock — built in markup, not a screenshot */}
          <Reveal className="lg:col-span-8" delay={0.15}>
            <div className="border" style={{ borderColor: T.hairline, background: "rgba(248,244,238,0.015)" }}>
              {/* title bar */}
              <div
                className="flex items-center justify-between border-b px-6 py-4"
                style={{ borderColor: T.hairline }}
              >
                <span className="text-[12px]" style={{ color: T.stone }}>
                  Proposal · Diwali win-back
                </span>
                <span
                  className="px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: T.champagne, border: "1px solid rgba(192,135,54,0.35)" }}
                >
                  Awaiting approval
                </span>
              </div>

              <div className="grid md:grid-cols-2">
                {/* left: the ask + the plan */}
                <div className="border-b p-7 md:border-b-0 md:border-r" style={{ borderColor: T.hairline }}>
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: T.stone }}>
                    You asked
                  </p>
                  <p className="mt-3 text-[17px] leading-relaxed" style={serif}>
                    &ldquo;Win back premium customers who went quiet after
                    Diwali.&rdquo;
                  </p>
                  <div className="mt-8 space-y-4 text-[13px]" style={{ color: T.stone }}>
                    {[
                      ["Audience", "3,214 customers · avg order ₹2,840"],
                      ["Channel", "WhatsApp · 9:30 AM IST"],
                      ["Offer", "15% comeback · 7-day window"],
                      ["Forecast", "₹61,000 ± 12% attributed revenue"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-6 border-b pb-3" style={{ borderColor: T.hairline }}>
                        <span className="shrink-0 uppercase tracking-[0.14em] text-[10px] pt-0.5">{k}</span>
                        <span className="text-right" style={{ color: T.ivory }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* right: the message */}
                <div className="flex flex-col p-7">
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: T.stone }}>
                    Drafted message
                  </p>
                  <div
                    className="mt-4 flex-1 border p-5 text-[13.5px] leading-[1.8]"
                    style={{ borderColor: T.hairline, color: T.ivory, background: "rgba(8,7,4,0.5)" }}
                  >
                    Hi Priya — we kept your favourites aside. Here&rsquo;s 15%
                    off to pick up right where you left off. Valid till Sunday.
                    <span style={{ color: T.stone }}> · sent as Meera from AudienceOS</span>
                  </div>
                  <div className="mt-5 flex items-center gap-4">
                    <span
                      className="inline-flex cursor-default items-center gap-2 px-5 py-2.5 text-[12px] font-medium"
                      style={{ background: T.champagne, color: T.ink }}
                    >
                      Approve &amp; send
                    </span>
                    <span className="text-[12px]" style={{ color: T.stone }}>
                      Edit copy · Change audience
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-6 lg:px-8"><Rule /></div>

      {/* ── COMMERCE, UP CLOSE (Unsplash editorial strip) ───────── */}
      <section className="relative z-10 mx-auto max-w-[1200px] px-6 py-32 lg:px-8">
        <Reveal>
          <Eyebrow>Who it&rsquo;s for</Eyebrow>
          <h2 className="mt-6 max-w-[24ch] text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.15]" style={serif}>
            Built for the people who actually run the store.
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Reveal>
            <Photo
              tall
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80&auto=format&fit=crop"
              alt="A boutique retail storefront"
              caption="01 — The storefront"
            />
          </Reveal>
          <Reveal delay={0.12} className="md:mt-12">
            <Photo
              tall
              src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=900&q=80&auto=format&fit=crop"
              alt="A customer paying at the counter"
              caption="02 — The customer"
            />
          </Reveal>
          <Reveal delay={0.24}>
            <Photo
              tall
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format&fit=crop"
              alt="A card payment moment at checkout"
              caption="03 — The repeat order"
            />
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <p className="mt-12 max-w-[52ch] text-[14px] leading-[1.8]" style={{ color: T.stone }}>
            D2C brands, boutiques, and growing commerce teams — the ones where
            &ldquo;the marketing department&rdquo; is one person with taste and
            no time for query builders.
          </p>
        </Reveal>
      </section>

      <div className="mx-auto max-w-[1200px] px-6 lg:px-8"><Rule /></div>

      {/* ── METHOD (numbered) ───────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-[1200px] px-6 py-32 lg:px-8">
        <Reveal>
          <Eyebrow>The method</Eyebrow>
          <h2 className="mt-6 max-w-[22ch] text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.15]" style={serif}>
            Three moves. No dashboards in between.
          </h2>
        </Reveal>
        <div className="mt-20 grid gap-x-12 gap-y-16 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Speak",
              d: "State the goal in plain English or Hinglish. No segment builders, no query syntax — the agent translates intent into a precise audience in seconds.",
            },
            {
              n: "02",
              t: "Approve",
              d: "Every campaign arrives as a proposal: who it reaches, what it says, when it goes, what it should earn. You remain the only person with a send button.",
            },
            {
              n: "03",
              t: "Attribute",
              d: "Revenue is traced to the exact conversation, segment, and message that produced it — so each campaign starts from everything the last one learned.",
            },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <div className="text-[13px]" style={{ color: T.champagne, letterSpacing: "0.18em" }}>
                {s.n}
              </div>
              <div className="mt-4"><Rule /></div>
              <h3 className="mt-6 text-[24px]" style={serif}>{s.t}</h3>
              <p className="mt-4 text-[13.5px] leading-[1.8]" style={{ color: T.stone }}>
                {s.d}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── QUOTE ───────────────────────────────────────────────── */}
      <section className="relative z-10 border-y" style={{ borderColor: T.hairline, background: "rgba(248,244,238,0.015)" }}>
        <div className="mx-auto max-w-[900px] px-6 py-28 text-center lg:px-8">
          <Reveal>
            <span className="text-[40px] leading-none" style={{ ...serif, color: T.champagne }}>
              &ldquo;
            </span>
            <blockquote
              className="mx-auto mt-2 max-w-[28ch] text-[clamp(1.5rem,3vw,2.2rem)] leading-[1.35]"
              style={serif}
            >
              It feels less like software and more like a colleague who happens
              to know every customer by name.
            </blockquote>
            <p className="mt-8 text-[12px] uppercase tracking-[0.18em]" style={{ color: T.stone }}>
              Early access partner · D2C apparel, Mumbai
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-[1200px] px-6 py-36 text-center lg:px-8">
        <Reveal>
          <Eyebrow>Begin</Eyebrow>
          <h2 className="mx-auto mt-8 max-w-[18ch] text-[clamp(2.2rem,5vw,4rem)] leading-[1.08]" style={serif}>
            Your next campaign is one sentence away.
          </h2>
          <div className="mt-12">
            <Link
              href="/chat"
              className="group inline-flex items-center gap-3 px-10 text-[13px] font-medium tracking-wide transition-opacity hover:opacity-90"
              style={{ background: T.ivory, color: T.ink, paddingTop: "1.1rem", paddingBottom: "1.1rem" }}
            >
              Begin a conversation
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight />
              </span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t" style={{ borderColor: T.hairline }}>
        <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-16 md:grid-cols-12 lg:px-8">
          <div className="md:col-span-5">
            <span className="text-[19px]" style={serif}>
              Audience<span style={{ color: T.champagne }}>OS</span>
            </span>
            <p className="mt-4 max-w-[36ch] text-[13px] leading-[1.8]" style={{ color: T.stone }}>
              The AI-native CRM for teams who would rather describe an outcome
              than configure a funnel.
            </p>
          </div>
          {[
            ["Product", [["Agent", "/chat"], ["Dashboard", "/dashboard"], ["Campaigns", "/campaigns"]]],
            ["Channels", [["WhatsApp", "/chat"], ["SMS", "/chat"], ["Email", "/chat"]]],
          ].map(([title, links]) => (
            <div key={title as string} className="md:col-span-2">
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: T.stone }}>
                {title as string}
              </p>
              <ul className="mt-5 space-y-3 text-[13px]">
                {(links as [string, string][]).map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="transition-colors hover:text-[#C08736]" style={{ color: T.ivory }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="md:col-span-3 md:text-right">
            <p className="text-[12px]" style={{ color: T.stone }}>
              © {new Date().getFullYear()} AudienceOS
              <br />
              Made for modern commerce.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
